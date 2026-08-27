import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// Fixed set of self-reported symptom flags. Deliberately a direct question to
// the patient ("do you have fatigue?") rather than an inferred heuristic from
// some other signal — the opposite of server/ml/predict.py's old approach
// (inferring 'has_muscle_weakness' from a WHOOP recovery score threshold),
// which data/DATA_PROVENANCE.md found had no clinical basis. Keys are stored
// as BiometricReading.metricType values, prefixed so they can't collide with
// WHOOP's (recovery_score, sleep_score, strain, hrv) or hand-scan's
// (antioxidant_score) metric types.
export const SYMPTOM_KEYS = [
  'fatigue',
  'poor_sleep',
  'muscle_weakness',
  'joint_pain',
  'low_mood',
  'poor_concentration',
  'digestive_issues',
  'skin_issues',
] as const;

// Adherence — "did the patient follow their recommended plan" — is
// deliberately a single low-friction question (not a per-supplement
// checklist) since self-logged adherence has notoriously poor compliance in
// consumer apps once logging itself becomes a chore. Optional: only makes
// sense once a recommendation actually exists, so the frontend only shows
// it when one does, and the backend doesn't require it.
const ADHERENCE_VALUES: Record<string, number> = { yes: 100, partial: 50, no: 0 };
const ADHERENCE_LABELS: Record<number, string> = { 100: 'yes', 50: 'partial', 0: 'no' };

// POST /v1/checkins — body: { patientId, wellnessScore: 1-5, symptoms: string[], adherence?: 'yes'|'partial'|'no' }
// No dedicated CheckIn table — this app's DB role can't ALTER or CREATE
// tables it doesn't own (see MVP-LAUNCH-CHECKLIST.md §4/§8), so, same as
// hand-scan and WHOOP data, this is stored as BiometricReading rows
// (source: 'self_report'). Every known symptom key gets a row on every
// submission — 1 if reported, 0 if not — so "not reported" and "reported
// absent" stay distinguishable in the data, not just silently missing.
router.post('/', async (req, res) => {
  try {
    const { patientId, wellnessScore, symptoms = [], adherence } = req.body;

    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }
    const score = Number(wellnessScore);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      res.status(400).json({ error: 'wellnessScore must be an integer from 1 to 5' });
      return;
    }
    if (!Array.isArray(symptoms) || symptoms.some((s) => !SYMPTOM_KEYS.includes(s))) {
      res.status(400).json({ error: 'symptoms must be an array of known symptom keys' });
      return;
    }
    if (adherence !== undefined && !(adherence in ADHERENCE_VALUES)) {
      res.status(400).json({ error: 'adherence must be one of: yes, partial, no' });
      return;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const recordedAt = new Date();
    const symptomSet = new Set(symptoms);

    await prisma.biometricReading.createMany({
      data: [
        { patientId, source: 'self_report', metricType: 'wellness_score', value: score, recordedAt },
        ...SYMPTOM_KEYS.map((key) => ({
          patientId,
          source: 'self_report',
          metricType: `symptom_${key}`,
          value: symptomSet.has(key) ? 1 : 0,
          recordedAt,
        })),
        ...(adherence !== undefined
          ? [{ patientId, source: 'self_report', metricType: 'adherence_score', value: ADHERENCE_VALUES[adherence]!, recordedAt }]
          : []),
      ],
    });

    res.status(201).json({ success: true, data: { recordedAt } });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to save check-in' });
  }
});

// GET /v1/checkins/:patientId/latest — most recent self-report submission, if any
router.get('/:patientId/latest', async (req, res) => {
  try {
    const { patientId } = req.params;

    const latestWellness = await prisma.biometricReading.findFirst({
      where: { patientId, source: 'self_report', metricType: 'wellness_score' },
      orderBy: { recordedAt: 'desc' },
    });

    if (!latestWellness) {
      res.json({ success: true, data: null });
      return;
    }

    const sameCheckIn = await prisma.biometricReading.findMany({
      where: { patientId, source: 'self_report', recordedAt: latestWellness.recordedAt },
    });

    const symptoms = sameCheckIn
      .filter((r) => r.metricType.startsWith('symptom_') && r.value === 1)
      .map((r) => r.metricType.replace('symptom_', ''));

    const adherenceReading = sameCheckIn.find((r) => r.metricType === 'adherence_score');

    res.json({
      success: true,
      data: {
        recordedAt: latestWellness.recordedAt,
        wellnessScore: latestWellness.value,
        symptoms,
        adherence: adherenceReading ? ADHERENCE_LABELS[adherenceReading.value] ?? null : null,
      },
    });
  } catch (error) {
    console.error('Error fetching latest check-in:', error);
    res.status(500).json({ error: 'Failed to fetch latest check-in' });
  }
});

// GET /v1/checkins/:patientId/history — recent wellness_score history for the
// patient's own trend view (mvp-roadmap.md Phase 5's "outcome tracking"
// follow-up). Separate from the admin-only biometric-summary endpoint
// (mounted under /v1/patients with requireAuth) since the consumer/patient
// portal has no session auth by design (prd.md Phase 3) — same public,
// patientId-scoped model as every other route in this file.
router.get('/:patientId/history', async (req, res) => {
  try {
    const { patientId } = req.params;
    const readings = await prisma.biometricReading.findMany({
      where: { patientId, source: 'self_report', metricType: 'wellness_score' },
      orderBy: { recordedAt: 'desc' },
      take: 20,
    });
    const history = readings.map((r) => ({ value: r.value, recordedAt: r.recordedAt })).reverse();
    res.json({ success: true, data: { history } });
  } catch (error) {
    console.error('Error fetching check-in history:', error);
    res.status(500).json({ error: 'Failed to fetch check-in history' });
  }
});

export default router;
