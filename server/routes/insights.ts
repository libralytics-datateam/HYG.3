import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /v1/ai/outputs (List all pending and recent AI insights for Admin)
router.get('/', async (req, res) => {
  try {
    const insights = await prisma.aiOutput.findMany({
      where: { orgId: req.user!.orgId },
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
        modelVersion: insight.modelVersion,
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
    const { status } = req.body; // status: 'accepted', 'rejected', 'modified'

    if (!['accepted', 'rejected', 'modified'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const existing = await prisma.aiOutput.findUnique({ where: { id } });
    if (!existing || existing.orgId !== req.user!.orgId) {
      res.status(404).json({ error: 'Insight not found' });
      return;
    }

    // reviewedById always comes from the authenticated session, never the client —
    // this is the audit trail's attribution and must not be spoofable.
    const updatedOutput = await prisma.aiOutput.update({
      where: { id },
      data: {
        reviewStatus: status,
        reviewedById: req.user!.id
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
