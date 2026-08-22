import { Router } from 'express';
import { runPrediction, PatientBiometrics } from '../services/mlService';
import { prisma } from '../db';

const router = Router();

router.post('/predict', async (req, res) => {
  try {
    const { patientId, ...biometrics } = req.body as PatientBiometrics & { patientId?: string };

    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    // Basic validation
    if (!biometrics || biometrics.age === undefined || biometrics.heartRate === undefined) {
       res.status(400).json({ error: 'Missing required biometric fields' });
       return;
    }

    const orgId = req.user!.orgId;
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });

    if (!patient || patient.orgId !== orgId) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const result = await runPrediction(biometrics);

    // Simulate finding a vitamin concept based on prediction
    const vitaminRecommendation = getVitaminConcept(result.prediction);

    // Save AI Output to Database
    const aiOutput = await prisma.aiOutput.create({
      data: {
        orgId,
        type: 'vitamin_concept',
        content: JSON.stringify(result),
        confidenceScore: result.confidence,
        modelVersion: 'rf-v1',
        reviewStatus: 'pending'
      }
    });

    // Save Custom Vitamin Concept to Database
    await prisma.customVitaminConcept.create({
      data: {
        patientId: patient.id,
        status: 'pending_pharmacist_review',
        recommendedSkus: JSON.stringify(vitaminRecommendation.ingredients),
        rationaleSummary: vitaminRecommendation.reasoning,
        aiOutputId: aiOutput.id
      }
    });

    res.json({
      success: true,
      prediction: result.prediction,
      confidence: result.confidence,
      mapped_features: result.mapped_features,
      recommendation: vitaminRecommendation
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Failed to run prediction engine' });
  }
});

// A dummy mapping function for demonstration purposes
function getVitaminConcept(prediction: string) {
  const concepts: Record<string, any> = {
    'Vitamin D': {
      name: 'Sunlight Optimizer Blend',
      ingredients: ['Vitamin D3 5000 IU', 'Vitamin K2 100mcg', 'Magnesium Glycinate 200mg'],
      reasoning: 'Your biometrics suggest limited sun exposure and possible bone/immune health compromise.'
    },
    'Vitamin B12': {
      name: 'Neuro-Energy Complex',
      ingredients: ['Methylcobalamin 1000mcg', 'Folate 400mcg'],
      reasoning: 'Fatigue patterns in your sleep and heart rate data suggest a B12 deficiency.'
    },
    'Iron': {
      name: 'Oxygen Transport Formula',
      ingredients: ['Iron Bisglycinate 25mg', 'Vitamin C 500mg'],
      reasoning: 'Metrics align with poor oxygen transport and low energy.'
    },
    'Calcium': {
      name: 'Bone Density Fortifier',
      ingredients: ['Calcium Citrate 500mg', 'Vitamin D3 1000 IU'],
      reasoning: 'Potential bone mineral density issues.'
    }
  };

  return concepts[prediction] || {
    name: 'General Wellness Blend',
    ingredients: ['Multivitamin', 'Omega-3 1000mg'],
    reasoning: 'No specific critical deficiency detected. Maintaining baseline health.'
  };
}

export default router;
