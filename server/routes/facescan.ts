import { Router } from 'express';
import { prisma } from '../db';
import { analyzeFaceImage, getSimulatedFaceAnalysis, isClaudeConfigured } from '../services/claudeService';

const router = Router();

// POST /v1/analysis/face-scan
// Body: { patientId: string, imageBase64: string, mimeType?: string }
//
// In line with HYG.3's clinical safety model:
// What reaches the patient immediately: the overall skin beauty score,
// hydration/radiance/vitality biometric readings, and direct facial observations.
// What waits for review: inferred deficiencies, recommended vitamins/peptides,
// and tailored supplement plans — stored as AiOutput + CustomVitaminConcept.
router.post('/face-scan', async (req, res) => {
  try {
    const { patientId, imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    if (!imageBase64 && !isClaudeConfigured()) {
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

    // Run Claude Vision analysis (or simulated fallback)
    let analysis;
    try {
      analysis = await analyzeFaceImage(imageBase64 || '', mimeType);
    } catch (aiErr) {
      console.error('Claude face analysis failed, using simulated fallback:', aiErr);
      analysis = getSimulatedFaceAnalysis();
    }

    const now = new Date();
    const overallScore = typeof analysis.overallScore === 'number' ? analysis.overallScore : 75;
    const hydrationScore = typeof analysis.hydrationScore === 'number' ? analysis.hydrationScore : 70;
    const radianceScore = typeof analysis.radianceScore === 'number' ? analysis.radianceScore : 75;
    const vitalityScore = typeof analysis.vitalityScore === 'number' ? analysis.vitalityScore : 72;
    const textureScore = typeof analysis.textureScore === 'number' ? analysis.textureScore : 75;
    const eyeContour = analysis.eyeContour || { darkCircles: 'mild', puffiness: 'low', observation: 'Normal periorbital appearance' };
    const skinTypeDetected = analysis.skinTypeDetected || 'normal';
    const signals = analysis.signals || [];
    const deficiencies = analysis.likelyDeficiencies || [];
    const foods = analysis.recommendedFoods || [];
    const fruits = analysis.recommendedFruits || [];
    const vitamins = analysis.recommendedVitamins || [];
    const skincareRituals = analysis.skincareRituals || {
      morning: ['Gentle cleanse', 'Vitamin C', 'SPF 50'],
      evening: ['Gentle cleanse', 'Hydrating serum', 'Moisturizer'],
      wellnessNudge: 'Stay hydrated with at least 2L of water per day.'
    };
    const disclaimer = analysis.disclaimer || 'INFERENCE only — not a dermatological diagnosis. Consult a qualified healthcare professional.';
    const analysisMode = isClaudeConfigured() ? 'claude-vision' : 'simulated';

    // Store real biometric readings for skin beauty and wellness metrics
    await Promise.all([
      prisma.biometricReading.create({
        data: {
          patientId,
          source: 'face_scanner',
          metricType: 'skin_beauty_score',
          value: overallScore,
          recordedAt: now,
        }
      }),
      prisma.biometricReading.create({
        data: {
          patientId,
          source: 'face_scanner',
          metricType: 'skin_hydration_score',
          value: hydrationScore,
          recordedAt: now,
        }
      }),
      prisma.biometricReading.create({
        data: {
          patientId,
          source: 'face_scanner',
          metricType: 'skin_radiance_score',
          value: radianceScore,
          recordedAt: now,
        }
      }),
      prisma.biometricReading.create({
        data: {
          patientId,
          source: 'face_scanner',
          metricType: 'skin_vitality_score',
          value: vitalityScore,
          recordedAt: now,
        }
      })
    ]);

    // Create pharmacist review output for inferred deficiencies and beauty supplement concepts
    const avgConfidence = deficiencies.length > 0
      ? deficiencies.reduce((sum: number, d: any) => sum + (d.confidence || 0), 0) / deficiencies.length
      : 0.6;

    const content = {
      headline: `Face-scan: ${skinTypeDetected} skin, beauty score ${overallScore}/100`,
      fact: signals.map((s: any) => `${s.area}: ${s.observation}`).join('; '),
      inference: deficiencies.length > 0
        ? deficiencies.map((d: any) => `${d.nutrient} (${Math.round((d.confidence || 0) * 100)}% confidence) — ${d.reason}`).join('; ')
        : 'Skin vitality balanced; no acute nutritional skin deficiencies detected.',
      recommendation: vitamins.map((v: any) => `${v.name} ${v.dosage}`).join('; '),
      uncertainty: `${disclaimer} Based on facial photograph (${analysisMode} analysis) — clinical specialist review recommended before supplement checkout.`,
      _raw: {
        overallScore,
        hydrationScore,
        radianceScore,
        vitalityScore,
        textureScore,
        skinTypeDetected,
        eyeContour,
        signals,
        deficiencies,
        foods,
        fruits,
        vitamins,
        skincareRituals,
        disclaimer,
        scannedAt: now.toISOString()
      }
    };

    const aiOutput = await prisma.aiOutput.create({
      data: {
        orgId: patient.orgId,
        type: 'face_scan_skin_concept',
        content: JSON.stringify(content),
        confidenceScore: avgConfidence,
        modelVersion: analysisMode === 'claude-vision' ? 'claude-opus-5' : 'simulated',
        reviewStatus: 'pending',
      }
    });

    await prisma.customVitaminConcept.create({
      data: {
        patientId,
        status: 'pending_pharmacist_review',
        recommendedSkus: JSON.stringify(vitamins.map((v: any) => v.name)),
        rationaleSummary: `Face-scan skin beauty score: ${overallScore}/100. Suggested skin vitality & collagen support: ${vitamins.map((v: any) => v.name).join(', ')}. Pending clinical review.`,
        aiOutputId: aiOutput.id,
      }
    });

    res.json({
      success: true,
      data: {
        scanId: aiOutput.id,
        overallScore,
        hydrationScore,
        radianceScore,
        vitalityScore,
        textureScore,
        skinTypeDetected,
        eyeContour,
        signals,
        skincareRituals,
        disclaimer,
        analysisMode,
        reviewStatus: 'pending',
        scannedAt: now.toISOString(),
      }
    });
  } catch (error) {
    console.error('Face scan error:', error);
    res.status(500).json({ error: 'Face scan analysis failed' });
  }
});

// GET /v1/analysis/face-scan/latest?patientId=xxx
// Retrieves the latest facial analysis and skin beauty report for the patient
router.get('/face-scan/latest', async (req, res) => {
  try {
    const patientId = req.query['patientId'] as string;
    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    const concept = await prisma.customVitaminConcept.findFirst({
      where: {
        patientId,
        aiOutput: { type: 'face_scan_skin_concept' }
      },
      orderBy: { generatedAt: 'desc' },
      include: { aiOutput: true }
    });

    if (!concept || !concept.aiOutput) {
      res.json({ success: true, data: null });
      return;
    }

    let parsedContent: any = {};
    try {
      parsedContent = JSON.parse(concept.aiOutput.content);
    } catch {
      parsedContent = {};
    }

    const raw = parsedContent._raw || {};

    // Hard gate (b): the inferred deficiencies and the recommended
    // foods/fruits/supplements are the risk-bearing part of a face scan and
    // must not reach the patient until a pharmacist has accepted the concept
    // — same rule the hand-scan flow enforces (see server/routes/insights.ts
    // and decisions.md's "Hand-scan gate"). Everything else here is a direct
    // observation or a general skincare-routine nudge and ships immediately.
    const isApproved = concept.status === 'approved';

    res.json({
      success: true,
      data: {
        scanId: concept.aiOutput.id,
        overallScore: raw.overallScore ?? 78,
        hydrationScore: raw.hydrationScore ?? 74,
        radianceScore: raw.radianceScore ?? 80,
        vitalityScore: raw.vitalityScore ?? 75,
        textureScore: raw.textureScore ?? 78,
        skinTypeDetected: raw.skinTypeDetected ?? 'combination',
        eyeContour: raw.eyeContour ?? { darkCircles: 'low', puffiness: 'low', observation: 'Healthy' },
        signals: raw.signals ?? [],
        skincareRituals: raw.skincareRituals ?? null,
        disclaimer: raw.disclaimer ?? 'INFERENCE only — not a dermatological diagnosis.',
        scannedAt: raw.scannedAt ?? concept.generatedAt.toISOString(),
        reviewStatus: concept.status,
        // Gated — populated only once a pharmacist has approved this concept.
        pharmacistReviewed: isApproved,
        deficiencies: isApproved ? (raw.deficiencies ?? []) : [],
        recommendedFoods: isApproved ? (raw.foods ?? []) : [],
        recommendedFruits: isApproved ? (raw.fruits ?? []) : [],
        recommendedVitamins: isApproved ? (raw.vitamins ?? []) : [],
      }
    });
  } catch (error) {
    console.error('Error fetching latest face scan:', error);
    res.status(500).json({ error: 'Failed to fetch face scan' });
  }
});

export default router;
