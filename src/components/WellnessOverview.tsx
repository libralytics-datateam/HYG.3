import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Moon, Flame, Watch, Activity, Hand, ChevronRight, Sparkles } from 'lucide-react';
import './WellnessOverview.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

interface MetricSummary {
  metricType: string;
  latestValue: number;
  trend: 'up' | 'down' | 'flat' | null;
}

// The data-architecture map this component renders, worked out from the
// actual schema (server/services/biometrics.ts's real metricTypes) rather
// than assumed: WHOOP and Fitbit never measure the exact same thing the
// same way (different scales, different formulas), so nothing here is
// merged into one fabricated number. Instead, metrics that cover the same
// *theme* sit side by side, and metrics no other source has at all are
// called out as what's actually unique to that source.
const THEME_GROUPS: { key: string; labelKey: string; icon: any; metrics: string[] }[] = [
  { key: 'skinBeauty', labelKey: 'wellnessOverview.themeSkinBeauty', icon: Sparkles, metrics: ['skin_beauty_score', 'skin_hydration_score', 'skin_radiance_score', 'skin_vitality_score'] },
  { key: 'sleep', labelKey: 'wellnessOverview.themeSleep', icon: Moon, metrics: ['sleep_score', 'fitbit_sleep_efficiency'] },
  { key: 'cardio', labelKey: 'wellnessOverview.themeCardio', icon: Heart, metrics: ['hrv', 'fitbit_resting_hr'] },
  { key: 'activity', labelKey: 'wellnessOverview.themeActivity', icon: Flame, metrics: ['strain', 'fitbit_steps'] },
];

const UNIQUE_HIGHLIGHTS: { metricType: string; sourceKey: string; icon: any }[] = [
  { metricType: 'skin_beauty_score', sourceKey: 'wellnessOverview.sourceFaceScan', icon: Sparkles },
  { metricType: 'recovery_score', sourceKey: 'wearables.whoopName', icon: Watch },
  { metricType: 'antioxidant_score', sourceKey: 'clientDashboard.sourceHandScan', icon: Hand },
];

const METRIC_UNIT: Record<string, string> = {
  skin_beauty_score: '%', skin_hydration_score: '%',
  skin_radiance_score: '%', skin_vitality_score: '%',
  sleep_score: '%', fitbit_sleep_efficiency: '%',
  hrv: ' ms', fitbit_resting_hr: ' bpm',
  strain: '', fitbit_steps: '',
  recovery_score: '%', antioxidant_score: '',
};

export default function WellnessOverview({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<MetricSummary[] | null>(null);
  const [connected, setConnected] = useState<{ whoop: boolean; fitbit: boolean }>({ whoop: false, fitbit: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/wearables/biometric-summary?patientId=${patientId}`).then((r) => r.json()),
      fetch(`${API_URL}/wearables/status?patientId=${patientId}`).then((r) => r.json()),
    ])
      .then(([summaryJson, statusJson]) => {
        if (summaryJson.success) setMetrics(summaryJson.data.metrics);
        if (statusJson.success) {
          setConnected({ whoop: statusJson.data.whoop.connected, fitbit: statusJson.data.fitbit.connected });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [patientId]);

  const findMetric = (type: string) => metrics?.find((m) => m.metricType === type) || null;
  const scrollToDevices = () => document.getElementById('wearables-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (loading || !metrics || metrics.length === 0) return null;

  const activeThemes = THEME_GROUPS.filter((g) => g.metrics.some((m) => findMetric(m)));
  const activeHighlights = UNIQUE_HIGHLIGHTS.filter((h) => findMetric(h.metricType));
  if (activeThemes.length === 0 && activeHighlights.length === 0) return null;

  const missingSource = !connected.whoop ? 'whoop' : !connected.fitbit ? 'fitbit' : null;

  return (
    <div className="glass-panel wellness-overview">
      <h2 className="wellness-overview-title">{t('wellnessOverview.title')}</h2>
      <p className="text-muted text-sm wellness-overview-subtitle">{t('wellnessOverview.subtitle')}</p>

      {activeHighlights.length > 0 && (
        <div className="wellness-highlights">
          {activeHighlights.map((h) => {
            const metric = findMetric(h.metricType)!;
            const Icon = h.icon;
            return (
              <div key={h.metricType} className="wellness-highlight-card">
                <div className="wellness-highlight-header">
                  <Icon size={16} className="text-gold" />
                  <span className="wellness-highlight-tag">{t('wellnessOverview.onlyFrom', { source: t(h.sourceKey) })}</span>
                </div>
                <div className="wellness-highlight-value">
                  {metric.latestValue}{METRIC_UNIT[h.metricType]}
                </div>
                <div className="wellness-highlight-label">{t(`healthChart.metric.${h.metricType}`)}</div>
              </div>
            );
          })}
        </div>
      )}

      {activeThemes.length > 0 && (
        <div className="wellness-theme-list">
          {activeThemes.map((group) => {
            const GroupIcon = group.icon;
            const presentMetrics = group.metrics.filter((m) => findMetric(m));
            return (
              <div key={group.key} className="wellness-theme-row">
                <div className="wellness-theme-label">
                  <GroupIcon size={14} className="text-teal" />
                  {t(group.labelKey)}
                </div>
                <div className="wellness-theme-values">
                  {presentMetrics.map((m) => {
                    const metric = findMetric(m)!;
                    return (
                      <span key={m} className="wellness-theme-value-chip">
                        <span className="wellness-theme-value-number">{metric.latestValue}{METRIC_UNIT[m]}</span>
                        <span className="wellness-theme-value-name">{t(`healthChart.metric.${m}`)}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {missingSource && (
        <button className="wellness-overview-nudge" onClick={scrollToDevices}>
          <Activity size={14} className="text-muted shrink-0" />
          <span>{t('wellnessOverview.connectMore', { source: t(missingSource === 'whoop' ? 'wearables.whoopName' : 'wearables.fitbitName') })}</span>
          <ChevronRight size={14} className="text-muted shrink-0" />
        </button>
      )}
    </div>
  );
}
