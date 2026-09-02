import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same normalization as src/lib/api.ts on the web side, so both clients can
// be pointed at the same VITE_API_URL-style value without callers caring.
//
// On web with no explicit override, default to the same-origin "/api"
// proxy (see /api/[...path].js) rather than localhost:3000 — a deployed
// web build has no way to reach a developer's local server, and hitting
// the real backend directly from the browser would need it to allow this
// deployment's origin in CORS_ORIGIN (server/index.ts), which nothing here
// can configure. The proxy sidesteps that: same-origin requests need no
// CORS at all.
const RAW_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  (Platform.OS === 'web' ? '/api' : 'http://localhost:3000');

export const API_BASE = RAW_BASE.replace(/\/+$/, '').replace(/\/v1$/, '');

export const PATIENT_ID_KEY = 'hyg3_patient_id';
export const PATIENT_NAME_KEY = 'hyg3_patient_name';

export async function getPatientId(): Promise<string | null> {
  return AsyncStorage.getItem(PATIENT_ID_KEY);
}

export async function setPatientId(id: string | null): Promise<void> {
  if (id) await AsyncStorage.setItem(PATIENT_ID_KEY, id);
  else await AsyncStorage.removeItem(PATIENT_ID_KEY);
}

export async function getPatientName(): Promise<string | null> {
  return AsyncStorage.getItem(PATIENT_NAME_KEY);
}

export async function setPatientName(name: string | null): Promise<void> {
  if (name) await AsyncStorage.setItem(PATIENT_NAME_KEY, name);
  else await AsyncStorage.removeItem(PATIENT_NAME_KEY);
}

// The patient portal this app ports has no session auth by design
// (hyg.3/prd.md Phase 3, server/routes/wearables.ts's header comment) — every
// consumer route is reached with patientId passed explicitly, same model
// used here as on web.
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export async function apiJson<T = any>(path: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; json: any }> {
  try {
    const res = await apiFetch(path, options);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  } catch (err) {
    return { ok: false, status: 0, json: { error: 'Could not reach the server' } };
  }
}
