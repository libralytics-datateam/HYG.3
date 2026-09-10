// The one shared shape every data source is described by — the abstraction
// decisions.md calls for, applied to data intake. See that file's
// "ProviderConnector interface" entry for the full rationale, including why
// the WHOOP/Fitbit OAuth *routes* were deliberately NOT collapsed into this.
//
// Two tiers of connector:
//   - descriptor-only (WHOOP, Fitbit): declares identity + consent scope for
//     the registry and the Connected Data Sources UI; its transport stays in
//     its own service file and its own bespoke OAuth routes.
//   - full (InBody and future cloud/direct providers): also implements the
//     token/key lifecycle and fetchLatest(), and is served by the generic
//     /v1/wearables/connectors/:provider/* routes.

export interface NormalizedReading {
  source: string;        // matches BiometricReading.source
  metricType: string;    // matches BiometricReading.metricType
  value: number;
  recordedAt: Date;
}

// What the patient is shown and agrees to at connect time. Stored verbatim
// in the data_source_consent audit row so "what did they actually consent
// to" is answerable later even if this copy changes.
export interface ConsentScope {
  dataTypes: string[];   // human-readable, e.g. ["Body fat %", "Skeletal muscle mass"]
  purpose: string;       // why HYG.3 uses it
  retention: string;     // how long it's kept
}

export type SyncMode = 'cloud' | 'direct' | 'manual-import';

export interface ProviderConnector {
  id: string;                        // 'whoop' | 'fitbit' | 'inbody' — matches WearableConnection.provider
  displayName: string;
  dataTypes: string[];               // short labels for the UI
  syncMode: SyncMode;
  consentScope: ConsentScope;
  /** Bespoke-OAuth providers (WHOOP, Fitbit) keep their own connect routes. */
  bespokeAuth: boolean;
  isConfigured(): boolean;           // env credentials present

  // --- Only implemented by full (non-bespokeAuth) connectors ---
  /** cloud/direct: validate a supplied credential (API key) and return what to persist. */
  connect?(patientId: string, credential: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }>;
  /** cloud/direct: pull the latest readings for a patient given the stored access token. */
  fetchLatest?(accessToken: string): Promise<NormalizedReading[]>;
  /** cloud/direct: best-effort revoke on the provider side. Never throws. */
  revoke?(accessToken: string): Promise<void>;
}

import { inbodyConnector } from './connectors/inbodyConnector';
import { whoopDescriptor } from './connectors/whoopConnector';
import { fitbitDescriptor } from './connectors/fitbitConnector';

const REGISTRY: ProviderConnector[] = [whoopDescriptor, fitbitDescriptor, inbodyConnector];

export function listConnectors(): ProviderConnector[] {
  return REGISTRY;
}

export function getConnector(id: string): ProviderConnector | undefined {
  return REGISTRY.find((c) => c.id === id);
}
