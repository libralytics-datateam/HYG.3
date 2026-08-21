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

export default router;
