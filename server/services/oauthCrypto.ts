// Shared OAuth "state" signing + token-at-rest encryption, used by every
// wearable provider (whoopService.ts, fitbitService.ts, ...). Provider-
// agnostic on purpose: the same patientId-in-state trust model and the same
// AES-256-GCM-at-rest requirement apply regardless of which third party the
// token belongs to, so this used to be duplicated per-provider and now isn't.

import crypto from 'crypto';

// --- OAuth "state" signing ---
// This app already trusts a client-supplied patientId directly for every
// other consumer route (no session/auth on the Phase 1 patient flow — see
// prd.md Phase 3), so using it as the OAuth state param is consistent with
// that existing trust model, not a new weakness. It IS still worth signing
// so a caller can't just edit the state query param on the callback URL to
// attach a stolen authorization to an arbitrary other patientId.
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

// --- Token encryption at rest ---
// schema.prisma's WearableConnection comment says "encrypted in real
// scenario" — that scenario is now real, since these are live per-patient
// OAuth tokens granting access to actual biometric health data, not a
// shared API key like GEMINI_API_KEY. Derives the encryption key from
// JWT_SECRET (scrypt) instead of requiring yet another secret to configure.
// One key for every provider — the DEK is the same, only the ciphertext differs.
// Salt stays "hyg3-whoop-token-v1" (not renamed to something provider-
// generic) on purpose: it was already live encrypting real WHOOP tokens
// before this file existed, and changing the salt changes the derived key,
// which would make any already-stored ciphertext permanently undecryptable.
// Reusing the same key for Fitbit tokens too isn't a security weakness —
// AES-GCM already uses a fresh random IV per encryption — it's just a label
// that predates this refactor.
let cachedEncryptionKey: Buffer | null = null;
function getEncryptionKey(): Buffer {
  if (!cachedEncryptionKey) {
    cachedEncryptionKey = crypto.scryptSync(getStateSecret(), 'hyg3-whoop-token-v1', 32);
  }
  return cachedEncryptionKey;
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

// Thrown by a provider's authenticated GET helper so route handlers can tell
// "the token is dead, the user needs to reconnect" (401/403) apart from a
// transient failure (network blip, 5xx, rate limit) — the old whoopGet()
// just threw a generic Error, which meant a sync that failed for either
// reason showed the same unhelpful "failed, try again" message even when
// retrying could never work without a fresh authorization.
export class WearableAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'WearableAuthError';
  }
}
