import { colors } from '../theme/tokens';

// Mirrors hyg.3/src/components/HealthTrendChart.tsx's METRIC_META exactly —
// same metric keys, units and guidance thresholds (or deliberately none for
// strain/HRV, which have no universal "low" number — see that file's
// comment and data/DATA_PROVENANCE.md).
export const METRIC_META: Record<string, { unit: string; threshold: number | null }> = {
  recovery_score: { unit: '%', threshold: 34 },
  sleep_score: { unit: '%', threshold: 50 },
  antioxidant_score: { unit: '', threshold: 34 },
  strain: { unit: '', threshold: null },
  hrv: { unit: 'ms', threshold: null },
};

export const METRIC_ORDER = ['recovery_score', 'sleep_score', 'antioxidant_score', 'strain', 'hrv'];

export function scoreColor(value: number, threshold: number | null): string {
  if (threshold == null) return colors.teal;
  if (value < threshold) return colors.danger;
  if (value < threshold * 1.7) return colors.gold;
  return colors.teal;
}

export function trendColor(trend: 'up' | 'down' | 'flat' | null): string {
  if (trend === 'up') return colors.teal;
  if (trend === 'down') return colors.danger;
  return colors.muted;
}

export function trendArrow(trend: 'up' | 'down' | 'flat' | null): string {
  if (trend === 'up') return '▲';
  if (trend === 'down') return '▼';
  return '—';
}
