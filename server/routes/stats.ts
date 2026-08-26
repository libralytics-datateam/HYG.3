import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /v1/stats/overview — live KPI counts for the Dashboard
router.get('/overview', async (req, res) => {
  try {
    const orgId = req.user!.orgId;
    const [
      totalDatasets,
      totalProducts,
      totalPatients,
      allInsights,
      datasets
    ] = await Promise.all([
      prisma.dataset.count({ where: { orgId } }),
      prisma.product.count({ where: { orgId } }),
      prisma.patient.count({ where: { orgId } }),
      prisma.aiOutput.findMany({ where: { orgId }, select: { reviewStatus: true } }),
      prisma.dataset.findMany({ where: { orgId }, select: { qualityScore: true } })
    ]);

    const pendingInsights = allInsights.filter(i => i.reviewStatus === 'pending').length;
    const acceptedInsights = allInsights.filter(i => i.reviewStatus === 'accepted').length;
    const rejectedInsights = allInsights.filter(i => i.reviewStatus === 'rejected').length;

    const avgQualityScore = datasets.length > 0
      ? Math.round(datasets.reduce((sum, d) => sum + d.qualityScore, 0) / datasets.length)
      : 0;

    // Weekly window (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyInsights = await prisma.aiOutput.count({
      where: { orgId, createdAt: { gte: oneWeekAgo } }
    });

    res.json({
      success: true,
      data: {
        totalDatasets,
        totalProducts,
        totalPatients,
        pendingInsights,
        acceptedInsights,
        rejectedInsights,
        totalInsights: allInsights.length,
        weeklyInsights,
        avgQualityScore,
        systemStatus: 'Online'
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /v1/stats/data-readiness — real accumulated signal toward a legitimate
// future training set, as an alternative to the synthetic Kaggle data gated
// in data/DATA_PROVENANCE.md. Every number here comes from real patients
// using the product and real pharmacist review decisions — nothing simulated.
router.get('/data-readiness', async (req, res) => {
  try {
    const orgId = req.user!.orgId;

    const [
      totalPatients,
      profiledPatients,
      handScans,
      completedHandScans,
      biometricReadings,
      reviewedOutputs,
    ] = await Promise.all([
      prisma.patient.count({ where: { orgId } }),
      prisma.healthProfile.count({ where: { patient: { orgId } } }),
      prisma.handScan.count({ where: { patient: { orgId } } }),
      prisma.handScan.count({ where: { patient: { orgId }, analysisStatus: 'complete' } }),
      prisma.biometricReading.count({ where: { patient: { orgId } } }),
      prisma.aiOutput.findMany({
        where: { orgId, reviewStatus: { not: 'pending' } },
        select: { reviewStatus: true, content: true },
      }),
    ]);

    // Reviewed cases are the real ground truth: a licensed reviewer's accept/
    // modify/reject decision on a specific AI output. Break down by what the
    // AI predicted so we can see per-category coverage, not just a raw count.
    const byPrediction: Record<string, { accepted: number; modified: number; rejected: number }> = {};
    for (const output of reviewedOutputs) {
      let label = 'Unknown';
      try {
        const parsed = JSON.parse(output.content);
        label = parsed.prediction || parsed.headline || 'Unknown';
      } catch {
        // leave as Unknown if content isn't parseable JSON
      }
      if (!byPrediction[label]) byPrediction[label] = { accepted: 0, modified: 0, rejected: 0 };
      const bucket = output.reviewStatus as 'accepted' | 'modified' | 'rejected';
      if (bucket in byPrediction[label]) byPrediction[label][bucket]++;
    }

    res.json({
      success: true,
      data: {
        totalPatients,
        profiledPatients,
        handScans,
        completedHandScans,
        biometricReadings,
        reviewedCaseCount: reviewedOutputs.length,
        byPrediction,
      },
    });
  } catch (error) {
    console.error('Error fetching data readiness stats:', error);
    res.status(500).json({ error: 'Failed to fetch data readiness stats' });
  }
});

export default router;
