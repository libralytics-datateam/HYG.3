// WHOOP as a registry descriptor. WHOOP's OAuth transport lives in
// ../whoopService.ts and its connect/callback/sync/disconnect routes stay in
// routes/wearables.ts — see decisions.md for why those weren't folded in
// here. This descriptor exists so the registry, the Connected Data Sources
// UI, and the per-source consent mechanism have one place to read WHOOP's
// identity and consent scope from.

import type { ProviderConnector } from '../providerConnector';
import { isWhoopConfigured } from '../whoopService';

export const whoopDescriptor: ProviderConnector = {
  id: 'whoop',
  displayName: 'WHOOP',
  dataTypes: ['Recovery score', 'Sleep performance', 'Strain', 'Heart rate variability'],
  syncMode: 'cloud',
  bespokeAuth: true,
  consentScope: {
    dataTypes: ['Recovery score', 'Sleep performance', 'Strain', 'Heart rate variability (HRV)'],
    purpose: 'Show your recovery and sleep trends on your dashboard and flag when a metric drifts below its guidance range.',
    retention: 'Kept while WHOOP stays connected. Disconnecting stops new syncs; existing readings are removed on request.',
  },
  isConfigured: isWhoopConfigured,
};
