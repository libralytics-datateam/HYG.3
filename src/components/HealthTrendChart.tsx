import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Moon, Flame, Activity, Hand, RefreshCw, PhoneCall, CheckCircle2, Footprints } from 'lucide-react';
import ErrorBanner from './ErrorBanner';
import './HealthTrendChart.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

interface HistoryPoint { value: number; recordedAt: string }
interface MetricSummary {
  metricType: string;
  latestValue: number;
  latestRecordedAt: string;
  trend: 'up' | 'down' | 'flat' | null;
  readingCount: number;
  history: HistoryPoint[];
}

// Which metrics this chart knows how to plot, in display priority order.
// `threshold` is only set where WHOOP (or our own scan score) publishes a
// well-known guidance band — strain and HRV are highly individual with no
// universal "low" number, so deliberately no threshold claim is made for
// them (same honesty-over-completeness call as elsewhere in this app; see
// decisions.md / data/DATA_PROVENANCE.md).
const METRIC_META: Record<string, { icon: any; unit: string; threshold: number | null }> = {
  recovery_score: { icon: Heart, unit: '%', threshold: 34 },
  sleep_score: { icon: Moon, unit: '%', threshold: 50 },
  antioxidant_score: { icon: Hand, unit: '', threshold: 34 },
  strain: { icon: Flame, unit: '', threshold: null },
  hrv: { icon: Activity, unit: 'ms', threshold: null },
  // Fitbit — no WHOOP-equivalent published guidance band exists for any of
  // these (Fitbit's own "healthy range" varies by metric and isn't a single
  // published number the way WHOOP's recovery/sleep bands are), so no
  // threshold for any of them — same honesty rule as strain/hrv above,
  // not an oversight. See server/services/fitbitService.ts.
  fitbit_sleep_efficiency: { icon: Moon, unit: '%', threshold: null },
  fitbit_resting_hr: { icon: Heart, unit: ' bpm', threshold: null },
  fitbit_steps: { icon: Footprints, unit: '', threshold: null },
};
const METRIC_ORDER = [
  'recovery_score', 'sleep_score', 'antioxidant_score', 'strain', 'hrv',
  'fitbit_sleep_efficiency', 'fitbit_resting_hr', 'fitbit_steps',
];

const VBW = 600;
const VBH = 160;
const PAD_Y = 14;
const PAD_X = 8;

function scoreColor(value: number, threshold: number | null): string {
  if (threshold == null) return 'var(--teal)';
  if (value < threshold) return '#f87171';
  if (value < threshold * 1.7) return 'var(--gold)';
  return 'var(--teal)';
}

export default function HealthTrendChart({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<MetricSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [requestError, setRequestError] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/wearables/biometric-summary?patientId=${patientId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const available: MetricSummary[] = json.data.metrics.filter((m: MetricSummary) => METRIC_META[m.metricType]);
          setMetrics(available);
          const first = METRIC_ORDER.find((m) => available.some((a) => a.metricType === m));
          if (first) setActive(first);
        } else {
          setError(json.error || t('healthChart.loadFailed'));
        }
      })
      .catch((err) => {
        console.error(err);
        setError(t('healthChart.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  const current = metrics?.find((m) => m.metricType === active) || null;
  const meta = active ? METRIC_META[active] : null;

  const coords = useMemo(() => {
    if (!current || current.history.length === 0) return [];
    const values = current.history.map((h) => h.value);
    const min = Math.min(...values, meta?.threshold ?? Infinity);
    const max = Math.max(...values, meta?.threshold ?? -Infinity);
    const range = max - min || 1;
    const usableW = VBW - PAD_X * 2;
    const usableH = VBH - PAD_Y * 2;
    const stepX = current.history.length > 1 ? usableW / (current.history.length - 1) : 0;
    return current.history.map((h, i) => ({
      x: PAD_X + i * stepX,
      y: PAD_Y + usableH - ((h.value - min) / range) * usableH,
      ...h,
    }));
  }, [current, meta]);

  const thresholdY = useMemo(() => {
    if (!current || !meta?.threshold || coords.length === 0) return null;
    const values = current.history.map((h) => h.value);
    const min = Math.min(...values, meta.threshold);
    const max = Math.max(...values, meta.threshold);
    const range = max - min || 1;
    const usableH = VBH - PAD_Y * 2;
    return PAD_Y + usableH - ((meta.threshold - min) / range) * usableH;
  }, [current, meta, coords.length]);

  const isConcerning = !!(current && meta?.threshold != null && current.latestValue < meta.threshold);

  const recentAvg = useMemo(() => {
    if (!current) return null;
    const recent = current.history.slice(-3);
    if (recent.length === 0) return null;
    return recent.reduce((s, r) => s + r.value, 0) / recent.length;
  }, [current]);

  const pathD = coords.length > 1 ? coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ') : '';
  const areaD = coords.length > 1
    ? `${pathD} L ${coords[coords.length - 1]!.x.toFixed(1)} ${VBH - PAD_Y} L ${coords[0]!.x.toFixed(1)} ${VBH - PAD_Y} Z`
    : '';

  const handlePointer = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || coords.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (coords.length - 1));
    setHoverIdx(Math.max(0, Math.min(coords.length - 1, idx)));
  };

  const handleRequestReview = async () => {
    if (!current || !meta) return;
    setRequesting(true);
    setRequestError('');
    const label = t(`healthChart.metric.${active}`);
    const avgText = recentAvg != null ? Math.round(recentAvg) : current.latestValue;
    const reason = t('healthChart.requestReason', { label, value: avgText, unit: meta.unit, threshold: meta.threshold });
    try {
      const res = await fetch(`${API_URL}/telemedicine/request-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, source: 'wearable_trend', reason }),
      });
      const json = await res.json();
      if (json.success) setRequested(true);
      else setRequestError(json.error || t('healthChart.requestFailed'));
    } catch (err) {
      console.error(err);
      setRequestError(t('healthChart.requestFailed'));
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel wearable-card-loading">
        <RefreshCw className="animate-spin text-teal" size={18} />
        <span className="text-muted text-sm">{t('healthChart.loading')}</span>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!metrics || metrics.length === 0 || !active || !current || !meta) return null;

  const hovered = hoverIdx != null ? coords[hoverIdx] : null;
  const trendColor = current.trend === 'up' ? 'var(--teal)' : current.trend === 'down' ? '#f87171' : 'var(--muted)';

  return (
    <div className="glass-panel health-chart-card">
      <div className="health-chart-header">
        <h2 className="health-chart-title">{t('healthChart.title')}</h2>
        <p className="text-muted text-sm">{t('healthChart.subtitle')}</p>
      </div>

      {/* Metric tabs — only ones the patient actually has data for */}
      <div className="health-chart-tabs">
        {METRIC_ORDER.filter((m) => metrics.some((a) => a.metricType === m)).map((m) => {
          const Icon = METRIC_META[m]!.icon;
          return (
            <button
              key={m}
              className={`health-chart-tab${m === active ? ' is-active' : ''}`}
              onClick={() => { setActive(m); setHoverIdx(null); setRequested(false); setRequestError(''); }}
            >
              <Icon size={14} /> {t(`healthChart.metric.${m}`)}
            </button>
          );
        })}
      </div>

      <div className="health-chart-current">
        <span className="health-chart-value" style={{ color: scoreColor(current.latestValue, meta.threshold) }}>
          {current.latestValue}{meta.unit}
        </span>
        <span className="health-chart-updated">
          {t('healthChart.lastReading', { date: new Date(current.latestRecordedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) })}
        </span>
        {current.trend && (
          <span className="health-chart-trend" style={{ color: trendColor }}>
            {current.trend === 'up' ? '▲' : current.trend === 'down' ? '▼' : '—'} {t(`healthChart.trend.${current.trend}`)}
          </span>
        )}
      </div>

      {coords.length > 1 ? (
        <div className="health-chart-svg-wrap">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VBW} ${VBH}`}
            className="health-chart-svg"
            onMouseMove={(e) => handlePointer(e.clientX)}
            onMouseLeave={() => setHoverIdx(null)}
            onTouchStart={(e) => handlePointer(e.touches[0]!.clientX)}
            onTouchMove={(e) => handlePointer(e.touches[0]!.clientX)}
            onTouchEnd={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id={`hc-fill-${active}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={scoreColor(current.latestValue, meta.threshold)} stopOpacity="0.22" />
                <stop offset="100%" stopColor={scoreColor(current.latestValue, meta.threshold)} stopOpacity="0" />
              </linearGradient>
            </defs>

            {thresholdY != null && (
              <>
                <line x1={PAD_X} y1={thresholdY} x2={VBW - PAD_X} y2={thresholdY} stroke="#f87171" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="4 4" />
                <text x={VBW - PAD_X} y={thresholdY - 4} textAnchor="end" className="health-chart-threshold-label">
                  {t('healthChart.thresholdLabel', { value: meta.threshold })}
                </text>
              </>
            )}

            <path d={areaD} fill={`url(#hc-fill-${active})`} stroke="none" />
            <path d={pathD} fill="none" stroke={scoreColor(current.latestValue, meta.threshold)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {hovered && (
              <line x1={hovered.x} y1={PAD_Y} x2={hovered.x} y2={VBH - PAD_Y} stroke="var(--border)" strokeWidth={1} />
            )}

            {coords.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 4 : 3}
                fill={i === hoverIdx || i === coords.length - 1 ? scoreColor(current.latestValue, meta.threshold) : 'transparent'}
                stroke={i === coords.length - 1 ? 'var(--bg)' : 'none'} strokeWidth={2} />
            ))}
          </svg>

          {/* x-axis: first / last date only — recessive, no per-point labels */}
          <div className="health-chart-xaxis">
            <span>{new Date(coords[0]!.recordedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
            <span>{new Date(coords[coords.length - 1]!.recordedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
          </div>

          {hovered && (
            <div className="health-chart-tooltip" style={{ left: `${(hovered.x / VBW) * 100}%` }}>
              <strong>{hovered.value}{meta.unit}</strong>
              <span>{new Date(hovered.recordedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted text-sm health-chart-nopoints">{t('healthChart.needMorePoints')}</p>
      )}

      {isConcerning && (
        <div className="health-chart-alert">
          <p className="text-sm">
            {t('healthChart.alertBody', {
              label: t(`healthChart.metric.${active}`),
              value: recentAvg != null ? Math.round(recentAvg) : current.latestValue,
              unit: meta.unit,
              threshold: meta.threshold,
            })}
          </p>
          {requestError && <ErrorBanner message={requestError} />}
          {requested ? (
            <span className="health-chart-requested">
              <CheckCircle2 size={15} /> {t('healthChart.requestSent')}
            </span>
          ) : (
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={handleRequestReview} disabled={requesting}>
              <PhoneCall size={14} /> {requesting ? t('healthChart.requesting') : t('healthChart.requestReviewCta')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
