// Per-data-source consent, recorded as an auditable event (hard gate d:
// "consent is per data source, at connection time, revocable independently").
//
// Storage shape mirrors the increment-1 disclaimer_acknowledgement decision
// and the §12 telemedicine_request pattern: a `data_source_consent` AiOutput
// row, patient-linked via a CustomVitaminConcept, content =
//   { provider, consentScope, grantedAt, revokedAt? }
// This lands consent in the same audit-visible store as reviewer/
// recommendation data with zero schema change (WearableConnection has no
// spare column). GET /v1/ai/outputs filters these out of the review queue.

import { prisma } from '../db';
import type { ConsentScope } from './providerConnector';

const TYPE = 'data_source_consent';

interface ConsentRecord {
  provider: string;
  granted: boolean;
  grantedAt: string;
  revokedAt: string | null;
  consentScope: ConsentScope | null;
}

async function rowsFor(patientId: string) {
  return prisma.customVitaminConcept.findMany({
    where: { patientId, aiOutput: { type: TYPE } },
    include: { aiOutput: true },
    orderBy: { generatedAt: 'desc' },
  });
}

function parse(content: string): any {
  try { return JSON.parse(content); } catch { return {}; }
}

// The current consent state for one provider (latest row wins).
export async function getConsent(patientId: string, provider: string): Promise<ConsentRecord | null> {
  const rows = await rowsFor(patientId);
  for (const r of rows) {
    if (!r.aiOutput) continue;
    const c = parse(r.aiOutput.content);
    if (c.provider !== provider) continue;
    return {
      provider,
      granted: !c.revokedAt,
      grantedAt: c.grantedAt || r.aiOutput.createdAt.toISOString(),
      revokedAt: c.revokedAt || null,
      consentScope: c.consentScope || null,
    };
  }
  return null;
}

export async function listConsents(patientId: string): Promise<Record<string, ConsentRecord>> {
  const rows = await rowsFor(patientId);
  const out: Record<string, ConsentRecord> = {};
  for (const r of rows) {
    if (!r.aiOutput) continue;
    const c = parse(r.aiOutput.content);
    if (!c.provider || out[c.provider]) continue; // first (newest) per provider
    out[c.provider] = {
      provider: c.provider,
      granted: !c.revokedAt,
      grantedAt: c.grantedAt || r.aiOutput.createdAt.toISOString(),
      revokedAt: c.revokedAt || null,
      consentScope: c.consentScope || null,
    };
  }
  return out;
}

// Write a fresh consent grant. If an active (non-revoked) grant for this
// exact provider already exists, this is a no-op — re-connecting the same
// source doesn't stack rows. Connecting provider A never touches provider B.
export async function recordConsent(
  patientId: string,
  provider: string,
  consentScope: ConsentScope,
): Promise<{ created: boolean; grantedAt: string }> {
  const current = await getConsent(patientId, provider);
  if (current?.granted) return { created: false, grantedAt: current.grantedAt };

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new Error('Patient not found');

  const grantedAt = new Date().toISOString();
  const aiOutput = await prisma.aiOutput.create({
    data: {
      orgId: patient.orgId,
      type: TYPE,
      content: JSON.stringify({ provider, consentScope, grantedAt }),
      confidenceScore: 1,
      modelVersion: 'n/a',
      reviewStatus: 'logged',
    },
  });
  await prisma.customVitaminConcept.create({
    data: {
      patientId,
      status: 'logged',
      recommendedSkus: '[]',
      rationaleSummary: `Data-source consent granted for "${provider}".`,
      aiOutputId: aiOutput.id,
    },
  });
  return { created: true, grantedAt };
}

// Stamp revokedAt on the active grant for one provider. Independent of every
// other provider's consent.
export async function revokeConsent(patientId: string, provider: string): Promise<boolean> {
  const rows = await rowsFor(patientId);
  for (const r of rows) {
    if (!r.aiOutput) continue;
    const c = parse(r.aiOutput.content);
    if (c.provider !== provider || c.revokedAt) continue;
    c.revokedAt = new Date().toISOString();
    await prisma.aiOutput.update({ where: { id: r.aiOutput.id }, data: { content: JSON.stringify(c) } });
    return true;
  }
  return false;
}
