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
        // Surfaced so the queue can show urgency without the frontend needing
        // to know the content JSON's internal shape — set either when a
        // patient taps "Request Pharmacist Review" on a pending hand-scan, or
        // immediately on a telemedicine_request (patient-initiated, no scan
        // behind it). See server/routes/telemedicine.ts.
        patientRequestedAt: predictionData.patientRequestedAt || null,
        content: predictionData
      };
    });

    // Patient-requested items surface first (oldest request first among
    // them), everything else stays newest-first behind them.
    formattedInsights.sort((a, b) => {
      if (a.patientRequestedAt && b.patientRequestedAt) {
        return new Date(a.patientRequestedAt).getTime() - new Date(b.patientRequestedAt).getTime();
      }
      if (a.patientRequestedAt) return -1;
      if (b.patientRequestedAt) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    res.json({ success: true, data: formattedInsights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// POST /v1/ai/outputs/:id/review (Approve, Reject, or request Modification of an AI Insight)
router.post('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body; // status: 'accepted', 'rejected', 'modified'

    if (!['accepted', 'rejected', 'modified'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    if (status === 'modified' && !note?.trim()) {
      res.status(400).json({ error: 'A note explaining what needs to change is required for "modified"' });
      return;
    }

    const existing = await prisma.aiOutput.findUnique({ where: { id } });
    if (!existing || existing.orgId !== req.user!.orgId) {
      res.status(404).json({ error: 'Insight not found' });
      return;
    }

    // There's no dedicated review-note column on AiOutput — the DB role this
    // app runs as doesn't have ALTER privileges on tables it doesn't own
    // (confirmed directly: `prisma db push` fails with "must be owner of
    // table AiOutput"), so a new column isn't available without someone with
    // real DB ownership running that migration by hand. Instead, the note is
    // embedded into the existing `content` JSON column under a `reviewNote`
    // key, namespaced separately from whatever the AI itself generated.
    let content = existing.content;
    if (status === 'modified') {
      const parsed = JSON.parse(existing.content);
      parsed.reviewNote = note.trim();
      parsed.reviewNoteAt = new Date().toISOString();
      content = JSON.stringify(parsed);
    }

    // reviewedById always comes from the authenticated session, never the client —
    // this is the audit trail's attribution and must not be spoofable.
    const updatedOutput = await prisma.aiOutput.update({
      where: { id },
      data: {
        reviewStatus: status,
        reviewedById: req.user!.id,
        content
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

    // Hand-scan outputs only become visible to the patient once approved —
    // this is the actual gate (server/routes/handscan.ts stopped creating
    // NutritionRecommendation directly for exactly this reason). Build it
    // now from the raw data preserved in content._raw at scan time.
    if (status === 'accepted' && updatedOutput.type === 'hand_scan_vitamin_concept') {
      const concept = updatedOutput.customVitaminConcepts[0];
      const raw = JSON.parse(updatedOutput.content)._raw;
      if (concept && raw) {
        const alreadyExists = await prisma.nutritionRecommendation.findUnique({
          where: { handScanId: raw.handScanId },
        });
        if (!alreadyExists) {
          await prisma.nutritionRecommendation.create({
            data: {
              patientId: concept.patientId,
              handScanId: raw.handScanId,
              source: 'hand_scan',
              detectedSignals: JSON.stringify(raw.signals || []),
              deficiencies: JSON.stringify(raw.deficiencies || []),
              foods: JSON.stringify(raw.foods || []),
              fruits: JSON.stringify(raw.fruits || []),
              vitamins: JSON.stringify(raw.vitamins || []),
              mealPlan: JSON.stringify(raw.mealPlan || {}),
              disclaimer: raw.disclaimer || 'INFERENCE only — consult a healthcare professional.',
            }
          });
        }
      }
    }

    res.json({ success: true, data: updatedOutput });
  } catch (error) {
    console.error('Error reviewing insight:', error);
    res.status(500).json({ error: 'Failed to review insight' });
  }
});

export default router;
