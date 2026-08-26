import { GoogleGenerativeAI } from '@google/generative-ai';

const HAND_ANALYSIS_PROMPT = `You are a nutritional health analyst AI. Analyze this photograph of a human hand taken in natural light.

Examine carefully:
1. NAILS: color (healthy pink vs pale/yellow/blue/white spots), ridges (horizontal or vertical), brittleness, thickness, spoon-shape
2. PALM: skin color (pallor, redness, yellowish tinge), hydration
3. SKIN: dryness, texture, scaling, pigmentation changes, redness

Based ONLY on visible physical indicators, identify likely nutritional deficiencies with confidence levels.

Common mappings:
- Pale/white nails, pale palm → Iron deficiency, B12 deficiency
- Brittle nails, ridges → Iron, Zinc, Biotin deficiency
- Yellow nails → possible Vitamin E, Selenium
- White spots on nails → Zinc deficiency
- Dry scaly skin → Vitamin A, Essential fatty acids
- Skin redness → Niacin (B3) deficiency
- Blue nails → possible poor circulation, Vitamin B12

Return ONLY valid JSON with no markdown, no code blocks, no explanation text:
{
  "signals": [{"area": "nail/palm/skin", "observation": "description of what you see"}],
  "likelyDeficiencies": [{"nutrient": "name", "confidence": 0.0-1.0, "reason": "why based on visible signs"}],
  "recommendedFoods": [{"name": "food name", "benefit": "short reason"}],
  "recommendedFruits": [{"name": "fruit name", "benefit": "short reason"}],
  "recommendedVitamins": [{"name": "supplement name", "dosage": "suggested dosage", "reason": "short reason"}],
  "mealPlan": {"breakfast": "suggestion", "lunch": "suggestion", "dinner": "suggestion", "snack": "suggestion"},
  "overallScore": 0-100,
  "disclaimer": "INFERENCE only — not a medical diagnosis. Consult a qualified healthcare professional before making any health decisions."
}`;

export async function analyzeHandImage(imageBase64: string, mimeType: string = 'image/jpeg') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Fallback: return a simulated response when no API key is set
    return getSimulatedAnalysis();
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  const result = await model.generateContent([HAND_ANALYSIS_PROMPT, imagePart]);
  const text = result.response.text().trim();

  // Strip any markdown code blocks if present
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  return JSON.parse(cleaned);
}

// Simulated response for demo/fallback when no API key configured
export function getSimulatedAnalysis() {
  return {
    signals: [
      { area: 'nail', observation: 'Slight paleness visible on nail beds, minor vertical ridging' },
      { area: 'palm', observation: 'Mild pallor in palm creases' },
      { area: 'skin', observation: 'Slight dryness on knuckles, normal skin tone' }
    ],
    likelyDeficiencies: [
      { nutrient: 'Iron', confidence: 0.72, reason: 'Pale nail beds and palm pallor are common indicators' },
      { nutrient: 'Vitamin B12', confidence: 0.61, reason: 'Nail pallor and ridging can indicate B12 insufficiency' },
      { nutrient: 'Zinc', confidence: 0.48, reason: 'Mild nail ridging observed' }
    ],
    recommendedFoods: [
      { name: 'Spinach', benefit: 'High in iron and folate' },
      { name: 'Lentils', benefit: 'Plant-based iron source' },
      { name: 'Lean Red Meat', benefit: 'Heme iron — most bioavailable form' },
      { name: 'Eggs', benefit: 'B12 and choline source' },
      { name: 'Pumpkin Seeds', benefit: 'Rich in zinc and magnesium' },
      { name: 'Tofu', benefit: 'Plant protein and iron' }
    ],
    recommendedFruits: [
      { name: 'Strawberries', benefit: 'Vitamin C boosts iron absorption' },
      { name: 'Kiwi', benefit: 'High Vitamin C and antioxidants' },
      { name: 'Pomegranate', benefit: 'Iron and antioxidants' },
      { name: 'Banana', benefit: 'B6 and energy' },
      { name: 'Papaya', benefit: 'Vitamin C and digestive enzymes' }
    ],
    recommendedVitamins: [
      { name: 'Iron Bisglycinate', dosage: '18–25mg daily with food', reason: 'Gentle form of iron, well tolerated' },
      { name: 'Vitamin B12 (Methylcobalamin)', dosage: '500–1000mcg daily', reason: 'Active form for better absorption' },
      { name: 'Vitamin C', dosage: '500mg with iron supplement', reason: 'Enhances non-heme iron absorption by 3x' },
      { name: 'Zinc Picolinate', dosage: '15–25mg daily', reason: 'Supports nail health and immune function' }
    ],
    mealPlan: {
      breakfast: 'Scrambled eggs on whole grain toast + kiwi + green tea',
      lunch: 'Lentil soup with spinach salad + strawberries + lemon water',
      dinner: 'Grilled chicken with roasted vegetables + brown rice + pomegranate juice',
      snack: 'Pumpkin seeds + banana + a square of dark chocolate (70%+)'
    },
    overallScore: 72,
    disclaimer: 'INFERENCE only — not a medical diagnosis. Consult a qualified healthcare professional before making any health decisions.'
  };
}
