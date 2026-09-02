export interface RecommendationFoodItem {
  name: string;
  benefit: string;
}

export interface RecommendationDeficiency {
  nutrient: string;
  reason: string;
  confidence: number; // 0..1
}

export interface RecommendationVitamin {
  name: string;
  dosage: string;
  reason: string;
}

export interface MealPlan {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snack?: string;
}

export interface Recommendation {
  id: string;
  source: 'hand_scan' | 'device' | 'combined' | string;
  createdAt: string;
  scanDate: string | null;
  signals: { area: string; observation: string }[];
  deficiencies: RecommendationDeficiency[];
  foods: RecommendationFoodItem[];
  fruits: RecommendationFoodItem[];
  vitamins: RecommendationVitamin[];
  mealPlan: MealPlan;
  disclaimer: string;
}

export interface CheckInLatest {
  recordedAt: string;
  wellnessScore: number;
  symptoms: string[];
  adherence: 'yes' | 'partial' | 'no' | null;
}

export interface CheckInHistoryPoint {
  value: number;
  recordedAt: string;
}

export interface HandScanResult {
  scanId: string;
  overallScore: number | null;
  signals: { area: string; observation: string }[];
  disclaimer: string;
  analysisMode: 'gemini-vision' | 'simulated' | string;
  reviewStatus: 'pending' | string;
}

export interface WearableStatus {
  whoopConfigured: boolean;
  connected: boolean;
  lastSyncedAt: string | null;
}

export interface BiometricHistoryPoint {
  value: number;
  recordedAt: string;
}

export interface BiometricMetricSummary {
  metricType: string;
  latestValue: number;
  latestRecordedAt: string;
  trend: 'up' | 'down' | 'flat' | null;
  readingCount: number;
  history: BiometricHistoryPoint[];
}

export interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  healthProfile?: {
    age: number;
    gender: string;
    heightCm: number;
    weightKg: number;
    healthGoals: string; // JSON-encoded string[]
    dietaryRestrictions: string; // JSON-encoded string[]
  } | null;
}
