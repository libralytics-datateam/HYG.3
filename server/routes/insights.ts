import { Router } from 'express';
import { prisma } from '../db';
import { matchVitaminsToProducts } from '../services/productMatch';

const router = Router();

// Who's actually allowed to approve/reject/schedule clinical-adjacent AI
// output. requireAuth (applied to this whole router in index.ts) only
// proves *a* valid org member is calling — MVP-LAUNCH-CHECKLIST.md §1 flagged
// that as insufficient: any authenticated org member, regardless of role,
// could approve a hand-scan recommendation or a telemedicine session.
//
// The two roles actually seeded/live in production today — confirmed
// directly via a real login, not assumed — are exactly "Lead Clinician"
// (sarah@libralytics.com) and "Pharmacist" (marcus@libralytics.com); see
// server/prisma/seed.ts. (A second, unused seed.js referenced a different
// role set — 'org_admin'/'analyst' — that was never actually run against
// this database and had its own bug, a missing passwordHash; deleted rather
// than left around to mislead the next person who reads it.) Both of today's
// two real users are clinically-titled and already the ones doing every
// review in this app's own test suite, so gating to just one of them would
// have silently locked the other out of work they're already doing — not a
// real fix, just a differently-broken one. This gate is forward-looking: it
// stops a role that doesn't exist yet (front-desk, IT admin, a future sales
// analyst account) from being able to approve clinical content, which is
// the actual risk the checklist named.
const REVIEWER_ROLES = ['Lead Clinician', 'Pharmacist'];

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
//
// For type 'telemedicine_request', "accepted" doubles as scheduling the
// session — the pharmacist supplies scheduledAt (and optionally a note, e.g.
// a call link or instructions) in the same request, same pattern as
// 'modified' already requiring a note. See decisions.md's telemedicine
// session entry.
router.post('/:id/review', async (req, res) => {
  try {
    // Kept as an in-handler check rather than a separate requireRole(...)
    // middleware argument — chaining two independently-typed handlers on
    // one router.post() call made TypeScript fall back to a looser
    // Request<Record<string, string|string[]>> overload for this handler,
    // breaking every req.params.id / Prisma call below it. Same security
    // property either way: this runs before anything else in the handler.
    if (!REVIEWER_ROLES.includes(req.user!.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { id } = req.params;
    const { status, note, scheduledAt } = req.body; // status: 'accepted', 'rejected', 'modified'

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

    if (existing.type === 'telemedicine_request' && status === 'accepted') {
      const parsedDate = scheduledAt ? new Date(scheduledAt) : null;
      if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'A valid scheduledAt date/time is required to accept a telemedicine session' });
        return;
      }
      if (parsedDate.getTime() < Date.now() - 60_000) {
        res.status(400).json({ error: 'scheduledAt must be in the future' });
        return;
      }
    }

    // There's no dedicated review-note column on AiOutput — the DB role this
    // app runs as doesn't have ALTER privileges on tables it doesn't own
    // (confirmed directly: `prisma db push` fails with "must be owner of
    // table AiOutput"), so a new column isn't available without someone with
    // real DB ownership running that migration by hand. Instead, the note
    // (and, for telemedicine_request, the session schedule) is embedded into
    // the existing `content` JSON column, namespaced separately from
    // whatever the AI itself generated.
    let content = existing.content;
    if (status === 'modified') {
      const parsed = JSON.parse(existing.content);
      parsed.reviewNote = note.trim();
      parsed.reviewNoteAt = new Date().toISOString();
      content = JSON.stringify(parsed);
    } else if (existing.type === 'telemedicine_request') {
      const parsed = JSON.parse(existing.content);
      if (status === 'accepted') {
        parsed.sessionStatus = 'scheduled';
        parsed.scheduledAt = new Date(scheduledAt).toISOString();
        if (note?.trim()) parsed.sessionNote = note.trim();
      } else if (status === 'rejected') {
        parsed.sessionStatus = 'cancelled';
      }
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
          // Matched against the org's real Product catalog at approval time
          // (not scan time) so a product added to the catalog after the scan
          // but before review still gets picked up. `product` is null on
          // every vitamin unless a real catalog match exists — today that's
          // every vitamin, every time, since Product has 0 rows until a real
          // partner/CSV upload provides one (see server/routes/products.ts).
          const vitaminsWithProducts = await matchVitaminsToProducts(updatedOutput.orgId, raw.vitamins || []);

          await prisma.nutritionRecommendation.create({
            data: {
              patientId: concept.patientId,
              handScanId: raw.handScanId,
              source: 'hand_scan',
              detectedSignals: JSON.stringify(raw.signals || []),
              deficiencies: JSON.stringify(raw.deficiencies || []),
              foods: JSON.stringify(raw.foods || []),
              fruits: JSON.stringify(raw.fruits || []),
              vitamins: JSON.stringify(vitaminsWithProducts),
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

// POST /v1/ai/outputs/:id/session-status — mark an already-scheduled
// telemedicine session completed or cancelled after the fact. Separate from
// /review because scheduling (accept) and the session actually happening can
// be days apart — this doesn't touch reviewStatus, only the session state
// embedded in content (see /review above for how scheduling sets it).
router.post('/:id/session-status', async (req, res) => {
  try {
    if (!REVIEWER_ROLES.includes(req.user!.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { id } = req.params;
    const { sessionStatus } = req.body as { sessionStatus?: string };

    if (!['completed', 'cancelled'].includes(sessionStatus || '')) {
      res.status(400).json({ error: "sessionStatus must be 'completed' or 'cancelled'" });
      return;
    }

    const existing = await prisma.aiOutput.findUnique({ where: { id } });
    if (!existing || existing.orgId !== req.user!.orgId) {
      res.status(404).json({ error: 'Insight not found' });
      return;
    }
    if (existing.type !== 'telemedicine_request') {
      res.status(400).json({ error: 'Only telemedicine_request insights have a session status' });
      return;
    }

    const parsed = JSON.parse(existing.content);
    if (parsed.sessionStatus !== 'scheduled') {
      res.status(400).json({ error: 'Only a scheduled session can be marked completed or cancelled' });
      return;
    }
    parsed.sessionStatus = sessionStatus;
    parsed.sessionStatusUpdatedAt = new Date().toISOString();

    const updated = await prisma.aiOutput.update({
      where: { id },
      data: { content: JSON.stringify(parsed) },
    });

    res.json({ success: true, data: { id: updated.id, sessionStatus } });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Failed to update session status' });
  }
});

export default router;
