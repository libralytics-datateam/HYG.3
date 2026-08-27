// Real WHOOP OAuth 2.0 + API v2 client. Built against WHOOP's public developer
// docs (https://developer.whoop.com/docs) as of this session — third-party API
// shapes can drift, so if this starts failing against a live account, check
// the current docs before assuming the code is wrong.
//
// Needs a real WHOOP developer app to do anything: register one at
// https://developer.whoop.com, then set WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET,
// and WHOOP_REDIRECT_URI (must exactly match the redirect URI registered on
// the WHOOP app) as real secrets. Until those are set, isWhoopConfigured()
// returns false and the connect route redirects to a "not configured" state
// instead of silently failing.

import crypto from 'crypto';

const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer/v2';

// offline is required to receive a refresh_token, not just an access_token.
const SCOPES = [
  'read:recovery',
  'read:cycles',
  'read:sleep',
  'read:workout',
  'read:profile',
  'read:body_measurement',
  'offline',
].join(' ');

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export function isWhoopConfigured(): boolean {
  return !!(process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET);
}

function getRedirectUri(): string {
  return process.env.WHOOP_REDIRECT_URI || 'http://localhost:3000/v1/wearables/whoop/callback';
}

// --- OAuth "state" signing ---
// This app already trusts a client-supplied patientId directly for every
// other consumer route (no session/auth on the Phase 1 patient flow — see
// prd.md Phase 3), so using it as the OAuth state param is consistent with
// that existing trust model, not a new weakness. It IS still worth signing
// so a caller can't just edit the state query param on the callback URL to
// attach a stolen WHOOP authorization to an arbitrary other patientId.
function getStateSecret(): string {
  return process.env.JWT_SECRET || 'dev-only-insecure-secret';
}

export function signState(patientId: string): string {
  const sig = crypto.createHmac('sha256', getStateSecret()).update(patientId).digest('hex').slice(0, 16);
  return `${patientId}.${sig}`;
}

export function verifyState(state: string): string | null {
  const [patientId, sig] = (state || '').split('.');
  if (!patientId || !sig) return null;
  const expected = crypto.createHmac('sha256', getStateSecret()).update(patientId).digest('hex').slice(0, 16);
  return sig === expected ? patientId : null;
}

export function getAuthorizationUrl(patientId: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.WHOOP_CLIENT_ID || '',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    state: signState(patientId),
  });
  return `${WHOOP_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.WHOOP_CLIENT_ID || '',
      client_secret: process.env.WHOOP_CLIENT_SECRET || '',
      redirect_uri: getRedirectUri(),
    }),
  });
  if (!res.ok) throw new Error(`WHOOP token exchange failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID || '',
      client_secret: process.env.WHOOP_CLIENT_SECRET || '',
      scope: SCOPES,
    }),
  });
  if (!res.ok) throw new Error(`WHOOP token refresh failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

async function whoopGet(accessToken: string, path: string): Promise<any> {
  const res = await fetch(`${WHOOP_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`WHOOP API ${path} failed: ${res.status}`);
  return res.json();
}

export const fetchLatestRecovery = (accessToken: string) => whoopGet(accessToken, '/recovery?limit=1');
export const fetchLatestSleep = (accessToken: string) => whoopGet(accessToken, '/activity/sleep?limit=1');
export const fetchLatestCycle = (accessToken: string) => whoopGet(accessToken, '/cycle?limit=1');

// Revokes the token on WHOOP's side (DELETE /v2/user/access), not just
// locally. Without this, "disconnecting" in-app would leave the token
// live and valid at WHOOP indefinitely — a real gap, not a nice-to-have.
export async function revokeAccess(accessToken: string): Promise<void> {
  const res = await fetch(`${WHOOP_API_BASE}/user/access`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 204 on success. Don't throw on failure — the local disconnect should
  // still proceed even if WHOOP's side errors (e.g. token already expired).
  if (!res.ok && res.status !== 404) {
    console.error(`WHOOP revoke access returned ${res.status}`);
  }
}

// --- Token encryption at rest ---
// schema.prisma's WearableConnection comment says "encrypted in real
// scenario" — that scenario is now real, since these are live per-patient
// OAuth tokens granting access to actual biometric health data, not a
// shared API key like GEMINI_API_KEY. Derives the encryption key from
// JWT_SECRET (scrypt) instead of requiring yet another secret to configure.
function getEncryptionKey(): Buffer {
  return crypto.scryptSync(getStateSecret(), 'hyg3-whoop-token-v1', 32);
}

export function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString('base64')).join('.');
}

export function decryptToken(ciphertext: string): string {
  const [ivB64, tagB64, dataB64] = ciphertext.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted token');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}
