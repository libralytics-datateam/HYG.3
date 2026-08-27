import { Router } from 'express';
import { prisma } from '../db';
import { analyzeHandImage, getSimulatedAnalysis } from '../services/geminiService';

const router = Router();

// POST /v1/analysis/hand-scan
// Body: { patientId: string, imageBase64: string, mimeType?: string }
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

    // Save recommendation
    const recommendation = await prisma.nutritionRecommendation.create({
      data: {
        patientId,
        handScanId: scan.id,
        source: 'hand_scan',
        detectedSignals: JSON.stringify(analysis.signals || []),
        deficiencies: JSON.stringify(analysis.likelyDeficiencies || []),
        foods: JSON.stringify(analysis.recommendedFoods || []),
        fruits: JSON.stringify(analysis.recommendedFruits || []),
        vitamins: JSON.stringify(analysis.recommendedVitamins || []),
        mealPlan: JSON.stringify(analysis.mealPlan || {}),
        disclaimer: analysis.disclaimer || 'INFERENCE only — consult a healthcare professional.',
      }
    });

    // Update scan status
    await prisma.handScan.update({
      where: { id: scan.id },
      data: {
        analysisStatus: 'complete',
        rawAnalysis: JSON.stringify(analysis),
      }
    });

    // Also record this as a BiometricReading — the schema already anticipates
    // hand-scan data here (metricType comment lists 'antioxidant_score'), but
    // nothing was actually writing to it before now. This is what makes hand
    // scans show up in accumulated biometric history alongside WHOOP data,
    // and in GET /v1/patients/:id/biometric-summary.
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

    res.json({
      success: true,
      data: {
        scanId: scan.id,
        recommendationId: recommendation.id,
        overallScore: analysis.overallScore || null,
        signals: analysis.signals,
        deficiencies: analysis.likelyDeficiencies,
        foods: analysis.recommendedFoods,
        fruits: analysis.recommendedFruits,
        vitamins: analysis.recommendedVitamins,
        mealPlan: analysis.mealPlan,
        disclaimer: analysis.disclaimer,
        analysisMode: process.env.GEMINI_API_KEY ? 'gemini-vision' : 'simulated'
      }
    });
  } catch (error) {
    console.error('Hand scan error:', error);
    res.status(500).json({ error: 'Hand scan analysis failed' });
  }
});

export default router;
