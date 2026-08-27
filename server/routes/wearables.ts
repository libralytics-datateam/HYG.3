import { Router } from 'express';
import { prisma } from '../db';
import * as whoop from '../services/whoopService';

const router = Router();

// The Phase 1 patient flow has no session/auth (see prd.md Phase 3) — the
// frontend carries patientId in localStorage and passes it explicitly, same
// as every other consumer route in this app (/v1/onboard/:patientId,
// /v1/analysis/hand-scan, etc). This router follows that same model.

function frontendBase(): string {
  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
  return origins[0]!;
}

// GET /v1/wearables/status?patientId=xxx
router.get('/status', async (req, res) => {
  try {
    const patientId = req.query.patientId as string;
    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }
    const conn = await prisma.wearableConnection.findFirst({ where: { patientId, provider: 'whoop' } });
    const lastReading = conn
      ? await prisma.biometricReading.findFirst({
          where: { patientId, source: 'whoop' },
          orderBy: { recordedAt: 'desc' },
        })
      : null;

    res.json({
      success: true,
      data: {
        whoopConfigured: whoop.isWhoopConfigured(),
        connected: !!conn,
        lastSyncedAt: lastReading?.recordedAt ?? null,
      },
    });
  } catch (error) {
    console.error('Wearable status error:', error);
    res.status(500).json({ error: 'Failed to fetch wearable status' });
  }
});

// GET /v1/wearables/whoop/connect?patientId=xxx — redirects the browser to WHOOP's authorization page
router.get('/whoop/connect', async (req, res) => {
  const patientId = req.query.patientId as string;
  if (!patientId) {
    res.status(400).send('patientId is required');
    return;
  }
  if (!whoop.isWhoopConfigured()) {
    res.redirect(`${frontendBase()}/client/wearables/callback?status=not_configured`);
    return;
  }
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    res.status(404).send('Patient not found');
    return;
  }
  res.redirect(whoop.getAuthorizationUrl(patientId));
});

// GET /v1/wearables/whoop/callback — WHOOP redirects here after the user authorizes (or denies) access
router.get('/whoop/callback', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    res.redirect(`${frontendBase()}/client/wearables/callback?status=denied`);
    return;
  }

  const patientId = state ? whoop.verifyState(state) : null;
  if (!code || !patientId) {
    res.redirect(`${frontendBase()}/client/wearables/callback?status=error`);
    return;
  }

  try {
    const tokens = await whoop.exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const data = {
      accessToken: whoop.encryptToken(tokens.access_token),
      refreshToken: whoop.encryptToken(tokens.refresh_token),
      expiresAt,
    };

    const existing = await prisma.wearableConnection.findFirst({ where: { patientId, provider: 'whoop' } });
    if (existing) {
      await prisma.wearableConnection.update({ where: { id: existing.id }, data });
    } else {
      await prisma.wearableConnection.create({ data: { patientId, provider: 'whoop', ...data } });
    }

    res.redirect(`${frontendBase()}/client/wearables/callback?status=success`);
  } catch (err) {
    console.error('WHOOP callback error:', err);
    res.redirect(`${frontendBase()}/client/wearables/callback?status=error`);
  }
});

// POST /v1/wearables/whoop/sync — body: { patientId } — pulls latest recovery/sleep/cycle data into BiometricReading
router.post('/whoop/sync', async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    const conn = await prisma.wearableConnection.findFirst({ where: { patientId, provider: 'whoop' } });
    if (!conn) {
      res.status(404).json({ error: 'No WHOOP connection for this patient' });
      return;
    }

    let accessToken = whoop.decryptToken(conn.accessToken);

    // Refresh proactively if the token is expired or expiring within a minute.
    if (conn.expiresAt.getTime() < Date.now() + 60_000) {
      const refreshToken = whoop.decryptToken(conn.refreshToken);
      const refreshed = await whoop.refreshTokens(refreshToken);
      accessToken = refreshed.access_token;
      await prisma.wearableConnection.update({
        where: { id: conn.id },
        data: {
          accessToken: whoop.encryptToken(refreshed.access_token),
          refreshToken: whoop.encryptToken(refreshed.refresh_token),
          expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      });
    }

    const [recovery, sleep, cycle] = await Promise.all([
      whoop.fetchLatestRecovery(accessToken).catch(() => null),
      whoop.fetchLatestSleep(accessToken).catch(() => null),
      whoop.fetchLatestCycle(accessToken).catch(() => null),
    ]);

    const readings: { metricType: string; value: number; recordedAt: Date }[] = [];

    const recoveryRecord = recovery?.records?.[0];
    if (recoveryRecord?.score?.recovery_score != null) {
      const recordedAt = new Date(recoveryRecord.created_at);
      readings.push({ metricType: 'recovery_score', value: recoveryRecord.score.recovery_score, recordedAt });
      if (recoveryRecord.score.hrv_rmssd_milli != null) {
        readings.push({ metricType: 'hrv', value: recoveryRecord.score.hrv_rmssd_milli, recordedAt });
      }
    }

    const sleepRecord = sleep?.records?.[0];
    if (sleepRecord?.score?.sleep_performance_percentage != null) {
      readings.push({
        metricType: 'sleep_score',
        value: sleepRecord.score.sleep_performance_percentage,
        recordedAt: new Date(sleepRecord.created_at),
      });
    }

    const cycleRecord = cycle?.records?.[0];
    if (cycleRecord?.score?.strain != null) {
      readings.push({
        metricType: 'strain',
        value: cycleRecord.score.strain,
        recordedAt: new Date(cycleRecord.created_at),
      });
    }

    // Skip readings already recorded (same patient/source/metric/timestamp) so
    // clicking "Sync now" repeatedly with no new WHOOP data doesn't spam duplicates.
    let savedCount = 0;
    if (readings.length > 0) {
      const existing = await prisma.biometricReading.findMany({
        where: {
          patientId,
          source: 'whoop',
          OR: readings.map((r) => ({
            metricType: r.metricType,
            recordedAt: r.recordedAt,
          })),
        },
        select: { metricType: true, recordedAt: true },
      });

      const existingSet = new Set(existing.map((e) => `${e.metricType}-${e.recordedAt.getTime()}`));
      const toInsert = readings.filter((r) => !existingSet.has(`${r.metricType}-${r.recordedAt.getTime()}`));

      if (toInsert.length > 0) {
        await prisma.biometricReading.createMany({
          data: toInsert.map((r) => ({ patientId, source: 'whoop', ...r })),
        });
        savedCount = toInsert.length;
      }
    }

    res.json({
      success: true,
      data: { syncedMetrics: readings.map((r) => r.metricType), newReadings: savedCount },
    });
  } catch (error) {
    console.error('WHOOP sync error:', error);
    res.status(502).json({ error: 'Failed to sync WHOOP data. The connection may need to be re-authorized.' });
  }
});

// DELETE /v1/wearables/whoop?patientId=xxx — disconnect (revokes at WHOOP too, not just locally)
router.delete('/whoop', async (req, res) => {
  try {
    const patientId = req.query.patientId as string;
    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    const conn = await prisma.wearableConnection.findFirst({ where: { patientId, provider: 'whoop' } });
    if (conn) {
      try {
        await whoop.revokeAccess(whoop.decryptToken(conn.accessToken));
      } catch (revokeErr) {
        // Proceed with local disconnect regardless — a failed revoke call
        // (e.g. already-expired token) shouldn't block the user from
        // disconnecting in our app.
        console.error('WHOOP revoke-on-disconnect failed:', revokeErr);
      }
    }

    await prisma.wearableConnection.deleteMany({ where: { patientId, provider: 'whoop' } });
    res.json({ success: true });
  } catch (error) {
    console.error('WHOOP disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect WHOOP' });
  }
});

export default router;
