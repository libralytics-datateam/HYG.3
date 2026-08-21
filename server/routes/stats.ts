import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /v1/stats/overview — live KPI counts for the Dashboard
router.get('/overview', async (_req, res) => {
  try {
    const [
      totalDatasets,
      totalProducts,
      totalPatients,
      allInsights,
      datasets
    ] = await Promise.all([
      prisma.dataset.count(),
      prisma.product.count(),
      prisma.patient.count(),
      prisma.aiOutput.findMany({ select: { reviewStatus: true } }),
      prisma.dataset.findMany({ select: { qualityScore: true } })
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
      where: { createdAt: { gte: oneWeekAgo } }
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

export default router;
