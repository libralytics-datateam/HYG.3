import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Brain, CheckCircle2, Clock, XCircle, Activity, TrendingUp, TrendingDown, Minus, Watch, ScanLine, Calendar, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import ErrorBanner from '../../components/ErrorBanner';
import Sparkline from '../../components/Sparkline';

const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  recovery_score: { label: 'Recovery', unit: '%' },
  sleep_score: { label: 'Sleep Performance', unit: '%' },
  strain: { label: 'Strain', unit: '' },
  hrv: { label: 'HRV', unit: 'ms' },
  antioxidant_score: { label: 'Hand-Scan Wellness Score', unit: '' },
  wellness_score: { label: 'Self-Reported Wellness', unit: '/5' },
  adherence_score: { label: 'Plan Adherence', unit: '%' },
  fitbit_sleep_efficiency: { label: 'Sleep Efficiency (Fitbit)', unit: '%' },
  fitbit_resting_hr: { label: 'Resting HR (Fitbit)', unit: ' bpm' },
  fitbit_steps: { label: 'Steps (Fitbit)', unit: '' },
};

const SYMPTOM_LABELS: Record<string, string> = {
  fatigue: 'Fatigue',
  poor_sleep: 'Poor Sleep',
  muscle_weakness: 'Muscle Weakness',
  joint_pain: 'Joint Pain',
  low_mood: 'Low Mood',
  poor_concentration: 'Poor Concentration',
  digestive_issues: 'Digestive Issues',
  skin_issues: 'Skin Issues',
};

const SOURCE_ICON: Record<string, any> = {
  whoop: Watch,
  fitbit: Watch,
  hand_scanner: ScanLine,
  self_report: Calendar,
};

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [biometrics, setBiometrics] = useState<any>(null);
  const [biometricsError, setBiometricsError] = useState('');

  useEffect(() => {
    apiFetch(`/v1/patients/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setPatient(json.data);
        else setError(json.error || 'Patient not found.');
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load patient. Please try again.');
      })
      .finally(() => setLoading(false));

    apiFetch(`/v1/patients/${id}/biometric-summary`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setBiometrics(json.data);
        else setBiometricsError(json.error || 'Failed to load biometric summary.');
      })
      .catch((err) => {
        console.error(err);
        setBiometricsError('Failed to load biometric summary.');
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted">Loading patient...</div>;
  if (error || !patient) return <div className="p-8 text-center text-red-400">{error || 'Patient not found.'}</div>;

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 size={16} className="text-teal" />;
    if (status === 'rejected') return <XCircle size={16} className="text-red-400" />;
    return <Clock size={16} className="text-gold" />;
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/app/patients')}
        className="flex items-center gap-2 text-muted hover:text-teal transition-colors mb-6"
      >
        <ArrowLeft size={18} /> Back to Patients
      </button>

      {/* Header */}
      <div className="glass-panel p-6 mb-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-teal/20 text-teal flex items-center justify-center text-2xl font-bold">
          {`${patient.firstName} ${patient.lastName}`.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <User className="text-teal" size={28} />
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-muted mt-1">DOB: {patient.dob || '—'} &bull; {patient.email || '—'} &bull; {patient.phone || '—'}</p>
        </div>
        <span className="px-3 py-1 rounded text-xs font-bold bg-teal/20 text-teal uppercase">Active</span>
      </div>

      {/* Biometric Signal — real accumulated data from hand scans + connected wearables.
          No recommendation logic here, just accurate accumulated signal (see
          mvp-roadmap.md Phase 5 / decisions.md for why the two are kept separate). */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
          <Activity className="text-teal" size={22} />
          Biometric Signal
        </h2>

        {biometricsError && <ErrorBanner message={biometricsError} />}

        {!biometrics ? (
          <p className="text-muted text-sm">Loading...</p>
        ) : biometrics.totalReadings === 0 ? (
          <p className="text-muted text-sm">No biometric readings yet — none from a hand scan or a connected wearable.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {biometrics.metrics
                .filter((m: any) => !m.metricType.startsWith('symptom_'))
                .map((m: any) => {
                  const meta = METRIC_LABELS[m.metricType] ?? { label: m.metricType, unit: '' };
                  const SrcIcon = SOURCE_ICON[m.latestSource] ?? Activity;
                  const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus;
                  return (
                    <div key={m.metricType} className="p-4 bg-bg rounded-lg border border-border">
                      <div className="flex items-center justify-between text-xs text-muted uppercase tracking-wider font-bold mb-2">
                        <span>{meta.label}</span>
                        <SrcIcon size={13} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-text">{m.latestValue}{meta.unit}</span>
                        {m.trend && (
                          <TrendIcon
                            size={16}
                            className={m.trend === 'up' ? 'text-teal' : m.trend === 'down' ? 'text-red-400' : 'text-muted'}
                          />
                        )}
                      </div>
                      <div className="text-xs text-muted mt-1 mb-2">
                        {m.readingCount} reading{m.readingCount === 1 ? '' : 's'} &bull; last {new Date(m.latestRecordedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      {m.history?.length >= 2 && <Sparkline history={m.history} width={140} height={32} />}
                    </div>
                  );
                })}
            </div>

            {/* Symptoms currently reported (most recent self check-in only) */}
            {(() => {
              const activeSymptoms = biometrics.metrics.filter(
                (m: any) => m.metricType.startsWith('symptom_') && m.latestValue === 1
              );
              return activeSymptoms.length > 0 ? (
                <div className="mb-4">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Currently Reported Symptoms
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeSymptoms.map((m: any) => {
                      const key = m.metricType.replace('symptom_', '');
                      return (
                        <span key={m.metricType} className="flex items-center gap-1 px-2 py-1 bg-gold/10 text-gold text-xs font-bold rounded-full border border-gold/20">
                          <AlertCircle size={12} /> {SYMPTOM_LABELS[key] ?? key}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            <div className="text-xs text-muted">
              {biometrics.totalReadings} total readings from {biometrics.sources.join(', ')}, since {new Date(biometrics.earliestReadingAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.
            </div>
          </>
        )}
      </div>

      {/* AI Concepts */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
          <Brain className="text-gold" size={22} />
          AI Vitamin Concepts
        </h2>

        {patient.customVitaminConcepts.length === 0 ? (
          <p className="text-muted text-sm">No AI concepts generated yet for this patient.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {patient.customVitaminConcepts.map((concept: any) => {
              let skus: string[] = [];
              try { skus = JSON.parse(concept.recommendedSkus || '[]'); } catch (_) {}
              return (
                <div key={concept.id} className="border border-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted font-mono text-xs" title={concept.id}>{concept.id.substring(0, 8)}...</span>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {statusIcon(concept.status)}
                      <span className={
                        concept.status === 'approved' ? 'text-teal' :
                        concept.status === 'rejected' ? 'text-red-400' : 'text-gold'
                      }>
                        {concept.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  {concept.rationaleSummary && (
                    <p className="text-text text-sm">{concept.rationaleSummary}</p>
                  )}
                  {skus.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skus.map((sku: string) => (
                        <span key={sku} className="px-2 py-1 bg-teal/10 text-teal text-xs rounded-full border border-teal/20">{sku}</span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted">
                    Generated {new Date(concept.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
