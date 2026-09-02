import { apiJson } from './client';
import type {
  BiometricMetricSummary,
  CheckInHistoryPoint,
  CheckInLatest,
  HandScanResult,
  PatientProfile,
  Recommendation,
  WearableStatus,
} from './types';

export async function onboardPatient(form: {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  healthGoals: string[];
  dietaryRestrictions: string[];
  pdpaConsent: boolean;
}): Promise<{ ok: true; patientId: string; name: string } | { ok: false; error: string; patientId?: string }> {
  const { ok, status, json } = await apiJson('/v1/onboard', { method: 'POST', body: JSON.stringify(form) });
  if (ok && json.success) return { ok: true, patientId: json.data.patientId, name: json.data.name };
  if (status === 409) return { ok: false, error: json.error || 'Already registered', patientId: json.patientId };
  return { ok: false, error: json.error || 'Registration failed' };
}

export async function fetchPatient(patientId: string): Promise<PatientProfile | null> {
  const { ok, json } = await apiJson(`/v1/onboard/${patientId}`);
  if (ok && json.success) return json.data;
  return null;
}

export async function fetchLatestRecommendation(patientId: string): Promise<Recommendation | null> {
  const { ok, json } = await apiJson(`/v1/recommendations/${patientId}/latest`);
  if (ok && json.success) return json.data;
  return null;
}

export async function fetchLatestCheckIn(patientId: string): Promise<CheckInLatest | null> {
  const { ok, json } = await apiJson(`/v1/checkins/${patientId}/latest`);
  if (ok && json.success) return json.data;
  return null;
}

export async function fetchCheckInHistory(patientId: string): Promise<CheckInHistoryPoint[]> {
  const { ok, json } = await apiJson(`/v1/checkins/${patientId}/history`);
  if (ok && json.success) return json.data.history;
  return [];
}

export async function submitCheckIn(body: {
  patientId: string;
  wellnessScore: number;
  symptoms: string[];
  adherence?: 'yes' | 'partial' | 'no';
}): Promise<{ ok: boolean; error?: string; recordedAt?: string }> {
  const { ok, json } = await apiJson('/v1/checkins', { method: 'POST', body: JSON.stringify(body) });
  if (ok && json.success) return { ok: true, recordedAt: json.data.recordedAt };
  return { ok: false, error: json.error || 'Failed to save check-in' };
}

export async function submitHandScan(body: {
  patientId: string;
  imageBase64: string;
  mimeType?: string;
}): Promise<{ ok: boolean; error?: string; data?: HandScanResult }> {
  const { ok, json } = await apiJson('/v1/analysis/hand-scan', { method: 'POST', body: JSON.stringify(body) });
  if (ok && json.success) return { ok: true, data: json.data };
  return { ok: false, error: json.error || 'Hand scan analysis failed' };
}

export async function requestPharmacistReview(body: {
  patientId: string;
  source: 'hand_scan' | 'wearable_trend';
  scanId?: string;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { ok, json } = await apiJson('/v1/telemedicine/request-review', { method: 'POST', body: JSON.stringify(body) });
  if (ok && json.success) return { ok: true };
  return { ok: false, error: json.error || 'Could not send your request' };
}

export async function fetchWearableStatus(patientId: string): Promise<WearableStatus | null> {
  const { ok, json } = await apiJson(`/v1/wearables/status?patientId=${patientId}`);
  if (ok && json.success) return json.data;
  return null;
}

export async function syncWhoop(patientId: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, json } = await apiJson('/v1/wearables/whoop/sync', { method: 'POST', body: JSON.stringify({ patientId }) });
  if (ok && json.success) return { ok: true };
  return { ok: false, error: json.error || 'Failed to sync WHOOP data' };
}

export async function disconnectWhoop(patientId: string): Promise<{ ok: boolean }> {
  const { ok } = await apiJson(`/v1/wearables/whoop?patientId=${patientId}`, { method: 'DELETE' });
  return { ok };
}

export function whoopConnectUrl(apiBase: string, patientId: string): string {
  return `${apiBase}/v1/wearables/whoop/connect?patientId=${patientId}`;
}

export async function fetchBiometricSummary(patientId: string): Promise<BiometricMetricSummary[]> {
  const { ok, json } = await apiJson(`/v1/wearables/biometric-summary?patientId=${patientId}`);
  if (ok && json.success) return json.data.metrics;
  return [];
}

export async function fetchHealthFlag(): Promise<{ whoopConfigured: boolean }> {
  const { ok, json } = await apiJson('/v1/health');
  if (ok) return { whoopConfigured: !!json.whoopConfigured };
  return { whoopConfigured: false };
}
