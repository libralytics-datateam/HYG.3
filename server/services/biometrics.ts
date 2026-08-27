import { prisma } from '../db';

// Shared by both the pharmacist-side summary (routes/patients.ts, authenticated,
// org-scoped) and the patient-side summary (routes/wearables.ts, unauthenticated,
// patientId-scoped per the Phase 1 consumer model) — same computation, same
// response shape, so a chart built against one matches the other exactly.
export async function buildBiometricSummary(patientId: string) {
  const readings = await prisma.biometricReading.findMany({
    where: { patientId },
    orderBy: { recordedAt: 'desc' },
  });

  const byType = new Map<string, typeof readings>();
  for (const r of readings) {
    const list = byType.get(r.metricType) ?? [];
    list.push(r);
    byType.set(r.metricType, list);
  }

  const metrics = [...byType.entries()].map(([metricType, list]) => {
    const latest = list[0]!;
    const previous = list[1];
    let trend: 'up' | 'down' | 'flat' | null = null;
    if (previous) {
      trend = latest.value > previous.value ? 'up' : latest.value < previous.value ? 'down' : 'flat';
    }
    // Oldest-to-newest, capped to the most recent 20 points — enough for a
    // real trend chart without an unbounded payload as reading history grows.
    const history = list
      .slice(0, 20)
      .map((r) => ({ value: r.value, recordedAt: r.recordedAt }))
      .reverse();

    return {
      metricType,
      latestValue: latest.value,
      latestRecordedAt: latest.recordedAt,
      latestSource: latest.source,
      previousValue: previous?.value ?? null,
      trend,
      readingCount: list.length,
      history,
    };
  });

  const sources = [...new Set(readings.map((r) => r.source))];

  return {
    totalReadings: readings.length,
    sources,
    earliestReadingAt: readings.length ? readings[readings.length - 1]!.recordedAt : null,
    latestReadingAt: readings.length ? readings[0]!.recordedAt : null,
    metrics,
  };
}
