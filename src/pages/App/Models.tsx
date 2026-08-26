import { useEffect, useState } from 'react';
import { Activity, Database, ScanLine, Users, ClipboardCheck, ShieldOff } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import ErrorBanner from '../../components/ErrorBanner';

interface DataReadiness {
  totalPatients: number;
  profiledPatients: number;
  handScans: number;
  completedHandScans: number;
  biometricReadings: number;
  reviewedCaseCount: number;
  byPrediction: Record<string, { accepted: number; modified: number; rejected: number }>;
}

// Minimum reviewed cases per predicted category before that category is even
// worth considering for a future retraining pass. Arbitrary but conservative —
// this is a floor, not a target; real model work needs clinical sign-off
// regardless of volume. See data/DATA_PROVENANCE.md.
const READINESS_FLOOR = 200;

export default function Models() {
  const [data, setData] = useState<DataReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/v1/stats/data-readiness')
      .then(r => r.json())
      .then(json => {
        if (json.success) setData(json.data);
        else setError(json.error || 'Failed to load data readiness stats.');
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load data readiness stats. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <Database className="text-gold" size={32} />
            Model &amp; Data Readiness
          </h1>
          <p className="text-muted mt-1">Real accumulated signal toward a legitimate future prediction model.</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="glass-panel p-4 mb-8 border border-red-500/50 bg-red-500/20 flex items-start gap-3">
        <ShieldOff size={20} className="text-red-400" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="font-bold text-text">Prediction endpoint is gated</div>
          <p className="text-sm text-muted mt-1">
            <code>POST /v1/ai/predict</code> returns 503. The previous model was trained on a synthetic Kaggle
            dataset with no clinical provenance and a publicly-documented faulty-validation issue — see{' '}
            <code>data/DATA_PROVENANCE.md</code> for the full assessment. This page tracks real progress toward
            data that could legitimately replace it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">Enrolled Patients</span>
            <Users size={20} className="text-teal" />
          </div>
          <div className="text-4xl font-bold text-text">{loading ? '—' : data?.totalPatients ?? 0}</div>
          <div className="text-xs text-muted">{loading ? '' : `${data?.profiledPatients ?? 0} with a health profile`}</div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">Hand Scans</span>
            <ScanLine size={20} className="text-teal" />
          </div>
          <div className="text-4xl font-bold text-text">{loading ? '—' : data?.handScans ?? 0}</div>
          <div className="text-xs text-muted">{loading ? '' : `${data?.completedHandScans ?? 0} completed analysis`}</div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">Biometric Readings</span>
            <Activity size={20} className="text-teal" />
          </div>
          <div className="text-4xl font-bold text-text">{loading ? '—' : data?.biometricReadings ?? 0}</div>
          <div className="text-xs text-muted">from wearables &amp; manual entry</div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">Reviewed Cases</span>
            <ClipboardCheck size={20} className="text-gold" />
          </div>
          <div className="text-4xl font-bold text-text">{loading ? '—' : data?.reviewedCaseCount ?? 0}</div>
          <div className="text-xs text-muted">real accept/modify/reject decisions</div>
        </div>
      </div>

      <div className="glass-panel p-8 mb-8">
        <h2 className="text-xl font-bold text-text mb-2">Why "Reviewed Cases" Is the Number That Matters</h2>
        <p className="text-muted mb-6">
          Every time a pharmacist accepts, modifies, or rejects an AI-generated insight, that's a real, licensed
          human judgment call — the same role a labeled clinical dataset would play. This is first-party ground
          truth, not a synthetic Kaggle download. Coverage below is broken down by what the AI predicted, since a
          future model needs enough reviewed examples <em>per category</em>, not just a large total.
        </p>
        {!loading && data && Object.keys(data.byPrediction).length > 0 ? (
          <div className="flex flex-col gap-3">
            {Object.entries(data.byPrediction).map(([label, counts]) => {
              const total = counts.accepted + counts.modified + counts.rejected;
              const pct = Math.min(100, Math.round((total / READINESS_FLOOR) * 100));
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-text">{label}</span>
                    <span className="text-muted">{total} / {READINESS_FLOOR}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-bg overflow-hidden">
                    <div className={`h-full ${pct >= 100 ? 'bg-teal' : 'bg-gold'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">No reviewed cases yet — this fills in as pharmacists review real AI Insights.</p>
        )}
      </div>

      <div className="glass-panel p-8">
        <h2 className="text-xl font-bold text-text mb-6">Path to a Real Model</h2>
        <div className="flex flex-col gap-4 text-muted">
          <div className="flex justify-between border-b border-border pb-4">
            <span>Current status</span>
            <span className="font-bold text-text">Data collection only — no model in production</span>
          </div>
          <div className="flex justify-between border-b border-border pb-4">
            <span>Floor before retraining is even considered</span>
            <span className="font-bold text-text">{READINESS_FLOOR} reviewed cases per category (illustrative floor, not a guarantee of viability)</span>
          </div>
          <div className="flex justify-between border-b border-border pb-4">
            <span>Still required regardless of volume</span>
            <span className="font-bold text-text">Explicit patient consent for research/training use, clinical validation, licensed specialist sign-off</span>
          </div>
          <div className="flex justify-between">
            <span>Full plan</span>
            <span className="font-bold text-teal">data/DATA_PROVENANCE.md</span>
          </div>
        </div>
      </div>
    </div>
  );
}
