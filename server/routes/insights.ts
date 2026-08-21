import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /v1/ai/outputs (List all pending and recent AI insights for Admin)
router.get('/', async (req, res) => {
  try {
    const insights = await prisma.aiOutput.findMany({
      include: {
        customVitaminConcepts: {
          include: {
            patient: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedInsights = insights.map(insight => {
      const concept = insight.customVitaminConcepts[0];
      const predictionData = JSON.parse(insight.content);

      return {
        id: insight.id,
        patientId: concept?.patientId || 'Unknown',
        patientName: concept?.patient ? `${concept.patient.firstName} ${concept.patient.lastName}` : 'Unknown',
        prediction: predictionData.prediction || predictionData.headline || 'Unknown',
        headline: predictionData.headline || predictionData.prediction || '',
        type: insight.type,
        confidence: insight.confidenceScore,
        status: insight.reviewStatus,
        date: insight.createdAt,
        conceptId: concept?.id,
        rationaleSummary: concept?.rationaleSummary || null,
        content: predictionData
      };
    });

    res.json({ success: true, data: formattedInsights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// POST /v1/ai/outputs/:id/review (Approve or Reject an AI Insight)
router.post('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewerId } = req.body; // status: 'accepted', 'rejected'

    if (!['accepted', 'rejected', 'modified'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const updatedOutput = await prisma.aiOutput.update({
      where: { id },
      data: {
        reviewStatus: status,
        reviewedById: reviewerId
      },
      include: {
        customVitaminConcepts: true
      }
    });

    // Also update the associated CustomVitaminConcept status
    if (updatedOutput.customVitaminConcepts.length > 0) {
      await prisma.customVitaminConcept.updateMany({
        where: { aiOutputId: id },
        data: {
          status: status === 'accepted' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending_pharmacist_review'
        }
      });
    }

    res.json({ success: true, data: updatedOutput });
  } catch (error) {
    console.error('Error reviewing insight:', error);
    res.status(500).json({ error: 'Failed to review insight' });
  }
});

export default router;
