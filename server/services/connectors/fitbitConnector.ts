// Fitbit as a registry descriptor — same rationale as whoopConnector.ts.
// Transport in ../fitbitService.ts; routes stay in routes/wearables.ts.

import type { ProviderConnector } from '../providerConnector';
import { isFitbitConfigured } from '../fitbitService';

export const fitbitDescriptor: ProviderConnector = {
  id: 'fitbit',
  displayName: 'Fitbit',
  dataTypes: ['Sleep efficiency', 'Resting heart rate', 'Daily steps'],
  syncMode: 'cloud',
  bespokeAuth: true,
  consentScope: {
    dataTypes: ['Sleep efficiency', 'Resting heart rate', 'Daily steps'],
    purpose: 'Show your sleep and activity trends on your dashboard alongside any other connected source.',
    retention: 'Kept while Fitbit stays connected. Disconnecting stops new syncs; existing readings are removed on request.',
  },
  isConfigured: isFitbitConfigured,
};
