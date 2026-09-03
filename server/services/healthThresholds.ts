// Single source of truth (server-side) for which biometric metrics have a
// real, citable "low" guidance number, and what it is. Only WHOOP's own
// published bands (recovery, sleep) and our own hand-scan wellness score use
// the same 0-100 "higher is better" scale close enough to justify reusing
// WHOOP's band — everything else (strain, hrv, every Fitbit metric) has no
// universal "low" number, so it deliberately has none here either. Same
// values as src/components/HealthTrendChart.tsx's METRIC_META on the
// frontend — that copy exists because the browser can't import server code,
// not because the numbers are allowed to drift; change both together.
export const HEALTH_THRESHOLDS: Record<string, { threshold: number; unit: string }> = {
  recovery_score: { threshold: 34, unit: '%' },
  sleep_score: { threshold: 50, unit: '%' },
  antioxidant_score: { threshold: 34, unit: '' },
};

export function recentAverage(history: { value: number }[], n = 3): number | null {
  const recent = history.slice(-n);
  if (recent.length === 0) return null;
  return recent.reduce((s, r) => s + r.value, 0) / recent.length;
}
