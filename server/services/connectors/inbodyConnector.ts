// InBody — the third data source, and the first built directly as a full
// ProviderConnector rather than a bespoke-OAuth one-off (decisions.md).
//
// InBody devices push results to the InBody cloud (LookinBody Web / InBody
// Data). Integrators authenticate with an account API key, not a per-user
// OAuth dance — so this is syncMode 'cloud' with a single credential the
// patient (or clinic) pastes in once. There is no public, stable, universal
// InBody REST contract the way there is for WHOOP/Fitbit OAuth: the exact
// host and result-field names differ by regional deployment. So:
//   - INBODY_API_BASE is configurable (no hardcoded prod host).
//   - the result parser is defensive: it reads a set of candidate field
//     names for each metric and skips anything it can't find, rather than
//     assuming one exact shape (same honesty rule as fitbitService.ts).
// Until INBODY_API_KEY + INBODY_API_BASE are set, isConfigured() is false and
// the connect route reports "not configured" instead of pretending to work.

import type { ProviderConnector, NormalizedReading } from '../providerConnector';
import { WearableAuthError } from '../oauthCrypto';

const SOURCE = 'inbody';

function apiBase(): string {
  return (process.env.INBODY_API_BASE || '').replace(/\/$/, '');
}

function isConfigured(): boolean {
  return !!(process.env.INBODY_API_KEY && process.env.INBODY_API_BASE);
}

async function inbodyGet(accessToken: string, path: string): Promise<any> {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) {
    throw new WearableAuthError(res.status, `InBody API ${path} rejected the API key (${res.status})`);
  }
  if (!res.ok) throw new Error(`InBody API ${path} failed: ${res.status}`);
  return res.json();
}

// First non-null number among a list of candidate keys on an object.
function pick(obj: any, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
}

const METRIC_FIELDS: { metricType: string; keys: string[] }[] = [
  { metricType: 'inbody_body_fat_pct', keys: ['PBF', 'bodyFatPercentage', 'percentBodyFat', 'body_fat_percent'] },
  { metricType: 'inbody_skeletal_muscle_mass', keys: ['SMM', 'skeletalMuscleMass', 'skeletal_muscle_mass'] },
  { metricType: 'inbody_bmi', keys: ['BMI', 'bmi'] },
  { metricType: 'inbody_visceral_fat_level', keys: ['VFL', 'visceralFatLevel', 'visceral_fat_level'] },
  { metricType: 'inbody_basal_metabolic_rate', keys: ['BMR', 'basalMetabolicRate', 'basal_metabolic_rate'] },
];

export const inbodyConnector: ProviderConnector = {
  id: 'inbody',
  displayName: 'InBody',
  dataTypes: ['Body fat %', 'Skeletal muscle mass', 'BMI', 'Visceral fat level', 'Basal metabolic rate'],
  syncMode: 'cloud',
  bespokeAuth: false,
  consentScope: {
    dataTypes: ['Body fat percentage', 'Skeletal muscle mass', 'BMI', 'Visceral fat level', 'Basal metabolic rate'],
    purpose: 'Track your body-composition trend over time on your Progress tab. It is not used for any diagnosis and is never a direct add-to-cart trigger.',
    retention: 'Kept while InBody stays connected. Disconnecting stops new syncs; existing readings are removed on request.',
  },
  isConfigured,

  // The patient/clinic pastes their InBody account API key. We verify it with
  // a cheap authenticated call before persisting, so a bad key fails at
  // connect time, not silently at the first sync.
  async connect(_patientId: string, credential: string) {
    if (!isConfigured()) throw new Error('InBody is not configured on this server');
    if (!credential?.trim()) throw new Error('An InBody API key is required');
    await inbodyGet(credential.trim(), '/account'); // throws WearableAuthError on a bad key
    return {
      accessToken: credential.trim(),
      refreshToken: '', // no refresh concept for an account API key
      // Account keys don't expire like OAuth tokens; set a far-future sentinel
      // so the shared "refresh if expiring" path in routes is simply skipped.
      expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
    };
  },

  async fetchLatest(accessToken: string): Promise<NormalizedReading[]> {
    // Latest scan for the authenticated account. Candidate response shapes:
    // { data: [ { testDateTime, ...metrics } ] } or { results: [...] } or a
    // bare array — handle all three.
    const raw = await inbodyGet(accessToken, '/results?limit=1&order=desc');
    const rows: any[] = Array.isArray(raw) ? raw : raw?.data ?? raw?.results ?? [];
    const latest = rows[0];
    if (!latest) return [];

    const when = latest.testDateTime || latest.testDate || latest.measuredAt || latest.date;
    const recordedAt = when ? new Date(when) : new Date();
    if (Number.isNaN(recordedAt.getTime())) return [];

    // Metrics may sit at the top level or under a nested object.
    const bag = { ...(latest.results || latest.metrics || {}), ...latest };

    return METRIC_FIELDS
      .map(({ metricType, keys }) => {
        const value = pick(bag, keys);
        return value == null ? null : { source: SOURCE, metricType, value, recordedAt };
      })
      .filter((r): r is NormalizedReading => r != null);
  },

  async revoke(): Promise<void> {
    // An account API key isn't revocable per-connection from our side — it's
    // managed in the InBody account console. Local disconnect + consent
    // revocation is the meaningful action here; nothing to call upstream.
  },
};
