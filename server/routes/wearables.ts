import { Router } from 'express';
import { prisma } from '../db';
import * as whoop from '../services/whoopService';
import * as fitbit from '../services/fitbitService';
import { WearableAuthError } from '../services/oauthCrypto';
import { buildBiometricSummary } from '../services/biometrics';

const router = Router();

// The Phase 1 patient flow has no session/auth (see prd.md Phase 3) — the
// frontend carries patientId in localStorage and passes it explicitly, same
// as every other consumer route in this app (/v1/onboard/:patientId,
// /v1/analysis/hand-scan, etc). This router follows that same model.

function frontendBase(): string {
  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
  return origins[0]!;
}

// Saves new readings, skipping any already recorded for this
// patient/source/metric/timestamp so repeated "Sync now" clicks with no new
// upstream data don't spam duplicates. Shared by every provider's sync route.
async function saveNewReadings(
  patientId: string,
  source: string,
  readings: { metricType: string; value: number; recordedAt: Date }[]
): Promise<number> {
  if (readings.length === 0) return 0;

  const existing = await prisma.biometricReading.findMany({
    where: {
      patientId,
      source,
      OR: readings.map((r) => ({ metricType: r.metricType, recordedAt: r.recordedAt })),
    },
    select: { metricType: true, recordedAt: true },
  });

  const existingSet = new Set(existing.map((e) => `${e.metricType}-${e.recordedAt.getTime()}`));
  const toInsert = readings.filter((r) => !existingSet.has(`${r.metricType}-${r.recordedAt.getTime()}`));

  if (toInsert.length === 0) return 0;
  await prisma.biometricReading.createMany({ data: toInsert.map((r) => ({ patientId, source, ...r })) });
  return toInsert.length;
}

// GET /v1/wearables/status?patientId=xxx — both providers in one call, so
// the dashboard's device panel doesn't need N round trips for N providers.
router.get('/status', async (req, res) => {
  try {
    const patientId = req.query.patientId as string;
    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    const connections = await prisma.wearableConnection.findMany({
      where: { patientId, provider: { in: ['whoop', 'fitbit'] } },
    });
    const whoopConn = connections.find((c) => c.provider === 'whoop');
    const fitbitConn = connections.find((c) => c.provider === 'fitbit');

    const [whoopLast, fitbitLast] = await Promise.all([
      whoopConn
        ? prisma.biometricReading.findFirst({ where: { patientId, source: 'whoop' }, orderBy: { recordedAt: 'desc' } })
        : null,
      fitbitConn
        ? prisma.biometricReading.findFirst({ where: { patientId, source: 'fitbit' }, orderBy: { recordedAt: 'desc' } })
        : null,
    ]);

    res.json({
      success: true,
      data: {
        whoop: {
          configured: whoop.isWhoopConfigured(),
          connected: !!whoopConn,
          lastSyncedAt: whoopLast?.recordedAt ?? null,
        },
        fitbit: {
          configured: fitbit.isFitbitConfigured(),
          connected: !!fitbitConn,
          lastSyncedAt: fitbitLast?.recordedAt ?? null,
        },
      },
    });
  } catch (error) {
    console.error('Wearable status error:', error);
    res.status(500).json({ error: 'Failed to fetch wearable status' });
  }
});

// GET /v1/wearables/biometric-summary?patientId=xxx — the patient's own trend
// data (WHOOP/Fitbit + hand-scan wellness score), for the health chart on
// their dashboard. Same computation and shape as the pharmacist-side
// /v1/patients/:id/biometric-summary (routes/patients.ts) — just reached by
// patientId rather than a staff session, matching every other Phase 1
// consumer route in this app.
router.get('/biometric-summary', async (req, res) => {
  try {
    const patientId = req.query.patientId as string;
    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    const summary = await buildBiometricSummary(patientId);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error building patient biometric summary:', error);
    res.status(500).json({ error: 'Failed to build biometric summary' });
  }
});

// ============================================================================
// WHOOP
// ============================================================================

// GET /v1/wearables/whoop/connect?patientId=xxx — redirects the browser to WHOOP's authorization page
router.get('/whoop/connect', async (req, res) => {
  const patientId = req.query.patientId as string;
  if (!patientId) {
    res.status(400).send('patientId is required');
    return;
  }
  if (!whoop.isWhoopConfigured()) {
    res.redirect(`${frontendBase()}/client/wearables/callback?status=not_configured&provider=whoop`);
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
    res.redirect(`${frontendBase()}/client/wearables/callback?status=denied&provider=whoop`);
    return;
  }

  const patientId = state ? whoop.verifyState(state) : null;
  if (!code || !patientId) {
    res.redirect(`${frontendBase()}/client/wearables/callback?status=error&provider=whoop`);
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

    res.redirect(`${frontendBase()}/client/wearables/callback?status=success&provider=whoop`);
  } catch (err) {
    console.error('WHOOP callback error:', err);
    res.redirect(`${frontendBase()}/client/wearables/callback?status=error&provider=whoop`);
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
    // If the refresh token itself is dead, this throws — caught below and
    // reported as needsReauth, same as a live-fetch 401 would be.
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

    // Each fetch is caught individually so one metric failing (rate limit,
    // a WHOOP-side outage on just that endpoint) doesn't sink the whole
    // sync — but WearableAuthError is re-thrown, not swallowed: if the
    // token is dead, every one of these will fail the same way, and
    // reporting "synced 0 metrics, nothing wrong" would be actively
    // misleading (the old behavior, before this pass).
    const fetchOrNull = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof WearableAuthError) throw err;
        console.error('WHOOP metric fetch failed (non-auth):', err);
        return null;
      }
    };

    const [recovery, sleep, cycle] = await Promise.all([
      fetchOrNull(() => whoop.fetchLatestRecovery(accessToken)),
      fetchOrNull(() => whoop.fetchLatestSleep(accessToken)),
      fetchOrNull(() => whoop.fetchLatestCycle(accessToken)),
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

    const savedCount = await saveNewReadings(patientId, 'whoop', readings);

    res.json({
      success: true,
      data: { syncedMetrics: readings.map((r) => r.metricType), newReadings: savedCount },
    });
  } catch (error) {
    if (error instanceof WearableAuthError) {
      // The user needs to reconnect — retrying a sync can never succeed on
      // its own. Distinct error shape so the frontend can show "Reconnect"
      // instead of "Sync failed, try again" (see WearablesPanel.tsx).
      res.status(401).json({ error: 'Your WHOOP authorization has expired. Please reconnect.', needsReauth: true });
      return;
    }
    console.error('WHOOP sync error:', error);
    res.status(502).json({ error: 'Failed to sync WHOOP data. Please try again in a moment.' });
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

// ============================================================================
// Fitbit — same shape as WHOOP above, deliberately not deduplicated into a
// single generic "provider" router: the token exchange (Basic-Auth header
// vs body credentials) and the data-endpoint field mapping genuinely differ
// per provider, and hiding that behind a generic abstraction would make the
// real differences harder to see, not easier.
// ============================================================================

// GET /v1/wearables/fitbit/connect?patientId=xxx
router.get('/fitbit/connect', async (req, res) => {
  const patientId = req.query.patientId as string;
  if (!patientId) {
    res.status(400).send('patientId is required');
    return;
  }
  if (!fitbit.isFitbitConfigured()) {
    res.redirect(`${frontendBase()}/client/wearables/callback?status=not_configured&provider=fitbit`);
    return;
  }
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    res.status(404).send('Patient not found');
    return;
  }
  res.redirect(fitbit.getAuthorizationUrl(patientId));
});

// GET /v1/wearables/fitbit/callback
router.get('/fitbit/callback', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    res.redirect(`${frontendBase()}/client/wearables/callback?status=denied&provider=fitbit`);
    return;
  }

  const patientId = state ? fitbit.verifyState(state) : null;
  if (!code || !patientId) {
    res.redirect(`${frontendBase()}/client/wearables/callback?status=error&provider=fitbit`);
    return;
  }

  try {
    const tokens = await fitbit.exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const data = {
      accessToken: fitbit.encryptToken(tokens.access_token),
      refreshToken: fitbit.encryptToken(tokens.refresh_token),
      expiresAt,
    };

    const existing = await prisma.wearableConnection.findFirst({ where: { patientId, provider: 'fitbit' } });
    if (existing) {
      await prisma.wearableConnection.update({ where: { id: existing.id }, data });
    } else {
      await prisma.wearableConnection.create({ data: { patientId, provider: 'fitbit', ...data } });
    }

    res.redirect(`${frontendBase()}/client/wearables/callback?status=success&provider=fitbit`);
  } catch (err) {
    console.error('Fitbit callback error:', err);
    res.redirect(`${frontendBase()}/client/wearables/callback?status=error&provider=fitbit`);
  }
});

// POST /v1/wearables/fitbit/sync — body: { patientId }
router.post('/fitbit/sync', async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    const conn = await prisma.wearableConnection.findFirst({ where: { patientId, provider: 'fitbit' } });
    if (!conn) {
      res.status(404).json({ error: 'No Fitbit connection for this patient' });
      return;
    }

    let accessToken = fitbit.decryptToken(conn.accessToken);

    if (conn.expiresAt.getTime() < Date.now() + 60_000) {
      const refreshToken = fitbit.decryptToken(conn.refreshToken);
      const refreshed = await fitbit.refreshTokens(refreshToken);
      accessToken = refreshed.access_token;
      await prisma.wearableConnection.update({
        where: { id: conn.id },
        data: {
          accessToken: fitbit.encryptToken(refreshed.access_token),
          refreshToken: fitbit.encryptToken(refreshed.refresh_token),
          expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      });
    }

    const fetchOrNull = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof WearableAuthError) throw err;
        console.error('Fitbit metric fetch failed (non-auth):', err);
        return null;
      }
    };

    const [sleepData, heartData, activityData] = await Promise.all([
      fetchOrNull(() => fitbit.fetchTodaySleep(accessToken)),
      fetchOrNull(() => fitbit.fetchTodayHeartRate(accessToken)),
      fetchOrNull(() => fitbit.fetchTodayActivity(accessToken)),
    ]);

    const readings: { metricType: string; value: number; recordedAt: Date }[] = [];
    const now = new Date(); // Fitbit's daily-summary endpoints don't return a precise per-reading timestamp

    const sleepEntry = sleepData?.sleep?.[0];
    if (sleepEntry?.efficiency != null) {
      readings.push({ metricType: 'fitbit_sleep_efficiency', value: sleepEntry.efficiency, recordedAt: now });
    }

    const restingHr = heartData?.['activities-heart']?.[0]?.value?.restingHeartRate;
    if (restingHr != null) {
      readings.push({ metricType: 'fitbit_resting_hr', value: restingHr, recordedAt: now });
    }

    const steps = activityData?.summary?.steps;
    if (steps != null) {
      readings.push({ metricType: 'fitbit_steps', value: steps, recordedAt: now });
    }

    const savedCount = await saveNewReadings(patientId, 'fitbit', readings);

    res.json({
      success: true,
      data: { syncedMetrics: readings.map((r) => r.metricType), newReadings: savedCount },
    });
  } catch (error) {
    if (error instanceof WearableAuthError) {
      res.status(401).json({ error: 'Your Fitbit authorization has expired. Please reconnect.', needsReauth: true });
      return;
    }
    console.error('Fitbit sync error:', error);
    res.status(502).json({ error: 'Failed to sync Fitbit data. Please try again in a moment.' });
  }
});

// DELETE /v1/wearables/fitbit?patientId=xxx
router.delete('/fitbit', async (req, res) => {
  try {
    const patientId = req.query.patientId as string;
    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    const conn = await prisma.wearableConnection.findFirst({ where: { patientId, provider: 'fitbit' } });
    if (conn) {
      try {
        await fitbit.revokeAccess(fitbit.decryptToken(conn.accessToken));
      } catch (revokeErr) {
        console.error('Fitbit revoke-on-disconnect failed:', revokeErr);
      }
    }

    await prisma.wearableConnection.deleteMany({ where: { patientId, provider: 'fitbit' } });
    res.json({ success: true });
  } catch (error) {
    console.error('Fitbit disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Fitbit' });
  }
});

export default router;
