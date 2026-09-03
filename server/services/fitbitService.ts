// Real Fitbit OAuth 2.0 + Web API client, mirroring whoopService.ts's shape
// and honesty rules.
//
// The OAuth flow below (authorize/token/refresh/revoke URLs, Basic-Auth
// client credentials, form-encoded grant params) is Fitbit's stable, long-
// documented Web API OAuth contract (https://dev.fitbit.com/build/reference/web-api/authorization/)
// and is NOT a guess.
//
// The per-metric data endpoints ARE a best effort from public docs, same
// caveat as whoopService.ts's header: verify against a live account before
// trusting field names in production. Fitbit has no WHOOP-equivalent single
// "recovery"/"strain" score, so this maps to Fitbit's closest real metrics
// instead of inventing an equivalent:
//   - sleep efficiency (0-100%)   -> metricType 'fitbit_sleep_efficiency'
//   - resting heart rate (bpm)    -> metricType 'fitbit_resting_hr'
//   - daily steps                 -> metricType 'fitbit_steps'
// These are deliberately NOT stored under WHOOP's metricType names
// ('sleep_score', 'strain', 'hrv') even though they're loosely analogous —
// they're different measurements with different scales, and conflating them
// would silently corrupt a patient's trend line if they ever switch devices
// or connect both. See server/routes/wearables.ts's sync handler.
//
// Needs a real Fitbit developer app to do anything: register one at
// https://dev.fitbit.com/apps/new (OAuth 2.0 Application Type: "Server"),
// then set FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, and FITBIT_REDIRECT_URI
// (must exactly match the redirect URI registered on the Fitbit app) as real
// secrets. Until those are set, isFitbitConfigured() returns false and the
// connect route redirects to a "not configured" state instead of failing.

import { signState, verifyState, WearableAuthError } from './oauthCrypto';

export { signState, verifyState };

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_REVOKE_URL = 'https://api.fitbit.com/oauth2/revoke';
const FITBIT_API_BASE = 'https://api.fitbit.com';

const SCOPES = ['activity', 'heartrate', 'profile', 'sleep'].join(' ');

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id?: string;
}

export function isFitbitConfigured(): boolean {
  return !!(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET);
}

function getRedirectUri(): string {
  return process.env.FITBIT_REDIRECT_URI || 'http://localhost:3000/v1/wearables/fitbit/callback';
}

function basicAuthHeader(): string {
  const id = process.env.FITBIT_CLIENT_ID || '';
  const secret = process.env.FITBIT_CLIENT_SECRET || '';
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
}

export function getAuthorizationUrl(patientId: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.FITBIT_CLIENT_ID || '',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    state: signState(patientId),
  });
  return `${FITBIT_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      client_id: process.env.FITBIT_CLIENT_ID || '',
      grant_type: 'authorization_code',
      redirect_uri: getRedirectUri(),
      code,
    }),
  });
  if (!res.ok) throw new Error(`Fitbit token exchange failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Fitbit token refresh failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

async function fitbitGet(accessToken: string, path: string): Promise<any> {
  const res = await fetch(`${FITBIT_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401 || res.status === 403) {
    throw new WearableAuthError(res.status, `Fitbit API ${path} rejected the access token (${res.status})`);
  }
  if (!res.ok) throw new Error(`Fitbit API ${path} failed: ${res.status}`);
  return res.json();
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC — see header caveat re: per-account timezone
}

// GET /1.2/user/-/sleep/date/{date}.json — today's sleep log(s). Unverified
// exact response shape (see header); expects { sleep: [{ efficiency, ... }] }.
export const fetchTodaySleep = (accessToken: string) =>
  fitbitGet(accessToken, `/1.2/user/-/sleep/date/${todayISODate()}.json`);

// GET /1/user/-/activities/heart/date/{date}/1d.json — resting heart rate.
// Unverified exact response shape; expects
// { 'activities-heart': [{ value: { restingHeartRate } }] }.
export const fetchTodayHeartRate = (accessToken: string) =>
  fitbitGet(accessToken, `/1/user/-/activities/heart/date/${todayISODate()}/1d.json`);

// GET /1/user/-/activities/date/{date}.json — daily activity summary (steps).
// Unverified exact response shape; expects { summary: { steps } }.
export const fetchTodayActivity = (accessToken: string) =>
  fitbitGet(accessToken, `/1/user/-/activities/date/${todayISODate()}.json`);

// Revokes the token on Fitbit's side, not just locally — same reasoning as
// whoopService.ts's revokeAccess.
export async function revokeAccess(accessToken: string): Promise<void> {
  const res = await fetch(FITBIT_REVOKE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({ token: accessToken }),
  });
  if (!res.ok && res.status !== 404) {
    console.error(`Fitbit revoke access returned ${res.status}`);
  }
}

export { encryptToken, decryptToken } from './oauthCrypto';
