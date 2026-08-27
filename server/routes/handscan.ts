import { Router } from 'express';
import { prisma } from '../db';
import { analyzeHandImage, getSimulatedAnalysis } from '../services/geminiService';

const router = Router();

// POST /v1/analysis/hand-scan
// Body: { patientId: string, imageBase64: string, mimeType?: string }
//
// GATED as of 2026-08-28 — see decisions.md "Recommendation Engine Scoping".
// This used to create a NutritionRecommendation directly, visible to the
// patient immediately, with zero human review. That's exactly what the
// scoping doc classifies as Tier B (a specific vitamin+dosage suggestion)
// and Tier C (an inferred deficiency) simultaneously — the same category
// of risk data/DATA_PROVENANCE.md gated the old prediction model for, just
// in a pathway that investigation never looked at. Confirmed with the user
// before changing this (2026-08-28): gate it, reuse the existing
// pharmacist review pipeline rather than build a second one.
//
// What still reaches the patient immediately: the overall wellness score
// and the raw visual signals (nail/palm/skin observations) — direct
// observations, not inferred health claims. What now waits for review:
// likely deficiencies, recommended foods/fruits/vitamins, and the meal
// plan — all only become visible (as a NutritionRecommendation) once a
// pharmacist accepts the corresponding AiOutput.
router.post('/hand-scan', async (req, res) => {
  try {
    const { patientId, imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    if (!imageBase64 && !process.env.GEMINI_API_KEY) {
      // Allow demo mode with no image — use simulated analysis
    } else if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // Create scan record
    const scan = await prisma.handScan.create({
      data: {
        patientId,
        imageRef: imageBase64 ? `sha256:${Buffer.from(imageBase64.substring(0, 32)).toString('hex')}` : 'demo',
        analysisStatus: 'processing',
      }
    });

    // Run Gemini Vision analysis (or simulated fallback)
    let analysis;
    try {
      analysis = await analyzeHandImage(imageBase64 || '', mimeType);
    } catch (aiErr) {
      console.error('Gemini analysis failed, using simulated fallback:', aiErr);
      analysis = getSimulatedAnalysis();
    }

    const signals = analysis.signals || [];
    const deficiencies = analysis.likelyDeficiencies || [];
    const foods = analysis.recommendedFoods || [];
    const fruits = analysis.recommendedFruits || [];
    const vitamins = analysis.recommendedVitamins || [];
    const mealPlan = analysis.mealPlan || {};
    const disclaimer = analysis.disclaimer || 'INFERENCE only — consult a healthcare professional.';
    const analysisMode = process.env.GEMINI_API_KEY ? 'gemini-vision' : 'simulated';

    // Update scan status — the raw analysis is kept here regardless of
    // review outcome, as the actual record of what the model produced.
    await prisma.handScan.update({
      where: { id: scan.id },
      data: {
        analysisStatus: 'complete',
        rawAnalysis: JSON.stringify(analysis),
      }
    });

    // Real biometric signal — a holistic visual score, not a specific
    // clinical claim, so this still reaches the patient immediately (same
    // treatment as WHOOP's recovery_score etc).
    if (typeof analysis.overallScore === 'number') {
      await prisma.biometricReading.create({
        data: {
          patientId,
          source: 'hand_scanner',
          metricType: 'antioxidant_score',
          value: analysis.overallScore,
          recordedAt: scan.scannedAt,
        }
      });
    }

    // Everything below (deficiencies, foods, vitamins, meal plan) goes
    // through the same AiOutput + CustomVitaminConcept pharmacist-review
    // pipeline already built and verified for other insight types —
    // deliberately not a second review mechanism.
    const avgConfidence = deficiencies.length > 0
      ? deficiencies.reduce((sum: number, d: any) => sum + (d.confidence || 0), 0) / deficiencies.length
      : 0.5;

    const content = {
      headline: deficiencies.length > 0
        ? `Hand-scan: possible ${deficiencies.map((d: any) => d.nutrient).join(', ')}`
        : 'Hand-scan: no specific deficiencies flagged',
      fact: signals.length > 0
        ? signals.map((s: any) => `${s.area}: ${s.observation}`).join('; ')
        : 'No specific visual signals detected.',
      inference: deficiencies.length > 0
        ? deficiencies.map((d: any) => `${d.nutrient} (${Math.round((d.confidence || 0) * 100)}% confidence) — ${d.reason}`).join('; ')
        : 'No specific deficiencies inferred from this scan.',
      recommendation: vitamins.length > 0
        ? vitamins.map((v: any) => `${v.name} ${v.dosage}`).join('; ')
        : 'No specific supplement recommended.',
      uncertainty: `${disclaimer} Based on a single hand-scan image (${analysisMode} analysis), not a lab-confirmed result — pharmacist judgment required before this reaches the patient.`,
      // Preserved verbatim so an approval can reconstruct the patient-facing
      // NutritionRecommendation without re-running analysis. Namespaced (_raw)
      // so it doesn't collide with the fact/inference/recommendation/uncertainty
      // fields above, same pattern as the reviewNote key added for §8's Modify action.
      _raw: { handScanId: scan.id, signals, deficiencies, foods, fruits, vitamins, mealPlan, disclaimer },
    };

    const aiOutput = await prisma.aiOutput.create({
      data: {
        orgId: patient.orgId,
        type: 'hand_scan_vitamin_concept',
        content: JSON.stringify(content),
        confidenceScore: avgConfidence,
        modelVersion: analysisMode === 'gemini-vision' ? 'gemini-1.5-flash' : 'simulated',
        reviewStatus: 'pending',
      }
    });

    // Don't fabricate SKU codes against an empty Product catalog (see
    // decisions.md's Phase 5 data-layer entry) — store the actual
    // suggested vitamin names, not invented catalog codes.
    await prisma.customVitaminConcept.create({
      data: {
        patientId,
        status: 'pending_pharmacist_review',
        recommendedSkus: JSON.stringify(vitamins.map((v: any) => v.name)),
        rationaleSummary: deficiencies.length > 0
          ? `Hand-scan suggests possible ${deficiencies.map((d: any) => d.nutrient).join(', ')} based on visual signals — pending pharmacist review before reaching the patient.`
          : 'Hand-scan analysis complete, no specific deficiencies flagged — pending pharmacist review.',
        aiOutputId: aiOutput.id,
      }
    });

    res.json({
      success: true,
      data: {
        scanId: scan.id,
        overallScore: analysis.overallScore || null,
        signals,
        disclaimer,
        analysisMode,
        reviewStatus: 'pending',
      }
    });
  } catch (error) {
    console.error('Hand scan error:', error);
    res.status(500).json({ error: 'Hand scan analysis failed' });
  }
});

export default router;
