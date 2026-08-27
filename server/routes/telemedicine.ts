import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// POST /v1/telemedicine/request-review
// Body: { patientId: string, source: 'hand_scan' | 'wearable_trend', scanId?: string, reason?: string }
//
// A patient-initiated "talk to a pharmacist" request — the telemedicine-style
// counterpart to the passive pharmacist-review queue built for hand-scan
// (decisions.md, 2026-08-28). Two triggers:
//   - 'hand_scan': the patient's scan is already sitting in the review queue
//     (server/routes/handscan.ts) — this just flags it as patient-requested
//     so it doesn't wait behind lower-priority items.
//   - 'wearable_trend': the health chart on the dashboard noticed a concerning
//     WHOOP/hand-scan trend (e.g. low recovery) with no existing AiOutput to
//     flag — this creates one, reusing the same AiOutput + CustomVitaminConcept
//     pipeline as every other insight type rather than building a parallel
//     "consult request" mechanism. No DB schema change either way — the DB
//     role this app runs as can't ALTER/CREATE tables (see decisions.md).
router.post('/request-review', async (req, res) => {
  try {
    const { patientId, source, scanId, reason } = req.body as {
      patientId?: string; source?: string; scanId?: string; reason?: string;
    };

    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }
    if (source !== 'hand_scan' && source !== 'wearable_trend') {
      res.status(400).json({ error: "source must be 'hand_scan' or 'wearable_trend'" });
      return;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // hand_scan: try to flag the existing pending AiOutput for this scan
    // rather than creating a duplicate. content is a plain string column (no
    // JSON query support without table ownership — see decisions.md), so a
    // string `contains` match on the embedded handScanId is the pragmatic
    // way to find it, same tradeoff already made elsewhere in this app.
    if (source === 'hand_scan' && scanId) {
      const candidates = await prisma.aiOutput.findMany({
        where: {
          orgId: patient.orgId,
          type: 'hand_scan_vitamin_concept',
          reviewStatus: 'pending',
          content: { contains: scanId },
        },
        include: { customVitaminConcepts: true },
      });
      const match = candidates.find((c) => c.customVitaminConcepts.some((cvc) => cvc.patientId === patientId));

      if (match) {
        const parsed = JSON.parse(match.content);
        if (!parsed.patientRequestedAt) {
          parsed.patientRequestedAt = new Date().toISOString();
          await prisma.aiOutput.update({ where: { id: match.id }, data: { content: JSON.stringify(parsed) } });
        }
        res.json({ success: true, data: { flagged: true, aiOutputId: match.id } });
        return;
      }
      // No matching pending output (already reviewed, or this scan produced
      // none) — fall through and raise a standalone request instead so the
      // patient's ask is never silently dropped.
    }

    const headline = reason?.trim() || 'Patient requested a pharmacist review.';
    const content = {
      headline,
      fact: reason?.trim() || 'Patient tapped "Request Pharmacist Review" from their dashboard.',
      uncertainty: 'Patient-initiated request — not an AI-generated finding, no confidence score applies.',
      patientRequestedAt: new Date().toISOString(),
      _requestSource: source,
    };

    const aiOutput = await prisma.aiOutput.create({
      data: {
        orgId: patient.orgId,
        type: 'telemedicine_request',
        content: JSON.stringify(content),
        confidenceScore: 1,
        modelVersion: 'patient_requested',
        reviewStatus: 'pending',
      },
    });

    await prisma.customVitaminConcept.create({
      data: {
        patientId,
        status: 'pending_pharmacist_review',
        recommendedSkus: '[]',
        rationaleSummary: headline,
        aiOutputId: aiOutput.id,
      },
    });

    res.json({ success: true, data: { flagged: false, created: true, aiOutputId: aiOutput.id } });
  } catch (error) {
    console.error('Telemedicine request-review error:', error);
    res.status(500).json({ error: 'Failed to send review request' });
  }
});

export default router;
