import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /v1/recommendations/:patientId — all recommendations for user
router.get('/:patientId', async (req, res) => {
  try {
    const recs = await prisma.nutritionRecommendation.findMany({
      where: { patientId: req.params['patientId'] },
      orderBy: { createdAt: 'desc' },
      include: { handScan: { select: { scannedAt: true, analysisStatus: true } } }
    });

    const data = recs.map(r => ({
      id: r.id,
      source: r.source,
      createdAt: r.createdAt,
      scanDate: r.handScan?.scannedAt || null,
      signals: JSON.parse(r.detectedSignals),
      deficiencies: JSON.parse(r.deficiencies),
      foods: JSON.parse(r.foods),
      fruits: JSON.parse(r.fruits),
      vitamins: JSON.parse(r.vitamins),
      mealPlan: JSON.parse(r.mealPlan),
      disclaimer: r.disclaimer
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// GET /v1/recommendations/:patientId/latest — most recent recommendation
router.get('/:patientId/latest', async (req, res) => {
  try {
    const rec = await prisma.nutritionRecommendation.findFirst({
      where: { patientId: req.params['patientId'] },
      orderBy: { createdAt: 'desc' },
      include: { handScan: { select: { scannedAt: true } } }
    });

    if (!rec) {
      res.json({ success: true, data: null });
      return;
    }

    res.json({
      success: true,
      data: {
        id: rec.id,
        source: rec.source,
        createdAt: rec.createdAt,
        scanDate: rec.handScan?.scannedAt || null,
        signals: JSON.parse(rec.detectedSignals),
        deficiencies: JSON.parse(rec.deficiencies),
        foods: JSON.parse(rec.foods),
        fruits: JSON.parse(rec.fruits),
        vitamins: JSON.parse(rec.vitamins),
        mealPlan: JSON.parse(rec.mealPlan),
        disclaimer: rec.disclaimer
      }
    });
  } catch (error) {
    console.error('Error fetching latest recommendation:', error);
    res.status(500).json({ error: 'Failed to fetch recommendation' });
  }
});

// GET /v1/recommendations/:patientId/pending — is there a hand-scan sitting
// in pharmacist review right now? Without this, the dashboard's only signal
// is /latest (which only reflects an *approved* NutritionRecommendation) —
// a patient who scanned and is genuinely waiting sees the same "No Analysis
// Yet, take your first scan" empty state as someone who never scanned at
// all. Returns elapsed time since submission, not a fabricated ETA — no
// real pharmacist-staffing turnaround commitment exists anywhere in this
// project to promise a number against (see data/DATA_PROVENANCE.md's
// honesty precedent; a made-up "usually within 24h" would be exactly the
// kind of unearned claim that file exists to catch).
router.get('/:patientId/pending', async (req, res) => {
  try {
    const concept = await prisma.customVitaminConcept.findFirst({
      where: {
        patientId: req.params['patientId'],
        aiOutput: { type: 'hand_scan_vitamin_concept' },
      },
      orderBy: { generatedAt: 'desc' },
      include: { aiOutput: true },
    });

    if (!concept || concept.status !== 'pending_pharmacist_review') {
      res.json({ success: true, data: null });
      return;
    }

    res.json({
      success: true,
      data: {
        submittedAt: concept.aiOutput.createdAt,
        wasSentBackForChanges: concept.aiOutput.reviewStatus === 'modified',
      },
    });
  } catch (error) {
    console.error('Error checking pending recommendation status:', error);
    res.status(500).json({ error: 'Failed to check pending status' });
  }
});

export default router;
