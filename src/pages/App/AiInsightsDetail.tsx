import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, CheckCircle2, XCircle, ArrowLeft, TrendingUp, AlertTriangle, Database, Pencil, PhoneCall, BellRing, Calendar, Ban } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import ErrorBanner from '../../components/ErrorBanner';
import { useAuth } from '../../context/AuthContext';

// Must match server/routes/insights.ts's REVIEWER_ROLES exactly — the
// backend is the real enforcement (this is just so a non-reviewer isn't
// shown action buttons that would only ever 403), so keeping these two
// lists in sync matters more than usual.
const REVIEWER_ROLES = ['Lead Clinician', 'Pharmacist'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  sales_trend: <TrendingUp size={18} className="text-teal" />,
  anomaly: <AlertTriangle size={18} className="text-gold" />,
  data_quality: <Database size={18} className="text-teal" />,
  vitamin_concept: <Brain size={18} className="text-teal" />,
  hand_scan_vitamin_concept: <Brain size={18} className="text-teal" />,
  telemedicine_request: <PhoneCall size={18} className="text-gold" />,
};

const TYPE_LABELS: Record<string, string> = {
  sales_trend: 'Sales Trend',
  anomaly: 'Anomaly Detection',
  data_quality: 'Data Quality',
  vitamin_concept: 'Vitamin Concept',
  hand_scan_vitamin_concept: 'Hand-Scan Recommendation',
  telemedicine_request: 'Pharmacist Review Request',
};

export default function AiInsightsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canReview = !!user && REVIEWER_ROLES.includes(user.role);
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [modifyNote, setModifyNote] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [sessionActionError, setSessionActionError] = useState('');
  const [sessionSubmitting, setSessionSubmitting] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, [id]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/v1/ai/outputs');
      const json = await res.json();
      if (json.success) {
        const found = json.data.find((i: any) => i.id === id);
        if (found) setInsight(found);
        else setError('Insight not found.');
      } else {
        setError(json.error || 'Failed to load insight.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load insight. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'accepted' | 'rejected' | 'modified', note?: string, scheduledAtValue?: string) => {
    try {
      setSubmitting(true);
      setReviewError('');
      const res = await apiFetch(`/v1/ai/outputs/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ status, note, scheduledAt: scheduledAtValue })
      });
      if (res.ok) {
        navigate('/app/ai-insights');
      } else {
        const json = await res.json().catch(() => ({}));
        setReviewError(json.error || 'Failed to submit review. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setReviewError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSessionStatus = async (sessionStatus: 'completed' | 'cancelled') => {
    try {
      setSessionSubmitting(true);
      setSessionActionError('');
      const res = await apiFetch(`/v1/ai/outputs/${id}/session-status`, {
        method: 'POST',
        body: JSON.stringify({ sessionStatus })
      });
      if (res.ok) {
        fetchInsights();
      } else {
        const json = await res.json().catch(() => ({}));
        setSessionActionError(json.error || 'Failed to update the session. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setSessionActionError('Failed to update the session. Please try again.');
    } finally {
      setSessionSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading insight details...</div>;
  }

  if (error || !insight) {
    return <div className="p-8 text-center text-red-400">{error || 'Insight not found.'}</div>;
  }

  // Same reasoning as AiInsightsList.tsx: reviewStatus alone can't
  // distinguish a scheduled session from a completed or later-cancelled one.
  const displayStatus = insight.type === 'telemedicine_request' && insight.content?.sessionStatus
    ? insight.content.sessionStatus
    : insight.status;
  const statusBadge =
    displayStatus === 'pending' || displayStatus === 'requested' ? 'bg-gold/20 text-gold' :
    displayStatus === 'rejected' || displayStatus === 'cancelled' ? 'bg-red-500/20 text-red-400' :
    displayStatus === 'modified' ? 'bg-blue-500/20 text-blue-400' :
    displayStatus === 'completed' ? 'bg-bg text-muted border border-border' : 'bg-teal/20 text-teal';

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button onClick={() => navigate('/app/ai-insights')} className="flex items-center gap-2 text-muted hover:text-teal transition-colors mb-6">
        <ArrowLeft size={18} /> Back to Insights
      </button>

      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {TYPE_ICONS[insight.type] ?? <Brain size={18} className="text-teal" />}
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {TYPE_LABELS[insight.type] ?? insight.type}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-text">
            {insight.headline || insight.prediction}
          </h1>
          <p className="text-muted text-sm">Patient record: {insight.patientName}</p>
        </div>
        <span className={`px-3 py-1 rounded text-sm font-bold uppercase ${statusBadge}`}>
          {displayStatus}
        </span>
      </div>

      {/* Patient explicitly asked for this — surfaced above everything else,
          same as the queue-list badge (AiInsightsList.tsx) and the sort order
          the backend already applies (server/routes/insights.ts). */}
      {insight.content?.patientRequestedAt && (
        <div className="glass-panel p-4 mb-6 border border-gold/40 bg-gold/5 flex items-center gap-3">
          <BellRing size={18} className="text-gold shrink-0" />
          <p className="text-text text-sm">
            <span className="font-bold text-gold">Patient requested this review</span>
            {' — '}{new Date(insight.content.patientRequestedAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* Telemedicine session status — shown once a session exists (scheduled,
          completed, or cancelled). Scheduling itself happens via the Accept
          flow below (a session is created by accepting with a date/time);
          this panel is for what happens after that decision. */}
      {insight.type === 'telemedicine_request' && insight.content?.sessionStatus && insight.content.sessionStatus !== 'requested' && (
        <div className={`glass-panel p-6 mb-6 border ${
          insight.content.sessionStatus === 'scheduled' ? 'border-teal/30' :
          insight.content.sessionStatus === 'completed' ? 'border-border' : 'border-red-500/30'
        }`}>
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar size={14} /> Telemedicine Session
          </h2>
          {insight.content.sessionStatus === 'scheduled' && insight.content.scheduledAt && (
            <>
              <p className="text-text text-lg font-bold">
                {new Date(insight.content.scheduledAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
              </p>
              {insight.content.sessionNote && <p className="text-muted text-sm mt-2">{insight.content.sessionNote}</p>}
              {sessionActionError && <div className="mt-3"><ErrorBanner message={sessionActionError} /></div>}
              {canReview && (
                <div className="flex gap-3 mt-4">
                  <button
                    className="btn btn-primary btn-sm flex items-center gap-2"
                    disabled={sessionSubmitting}
                    onClick={() => handleSessionStatus('completed')}
                  >
                    <CheckCircle2 size={14} /> Mark Session Completed
                  </button>
                  <button
                    className="btn bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 btn-sm flex items-center gap-2"
                    disabled={sessionSubmitting}
                    onClick={() => handleSessionStatus('cancelled')}
                  >
                    <Ban size={14} /> Cancel Session
                  </button>
                </div>
              )}
            </>
          )}
          {insight.content.sessionStatus === 'completed' && (
            <p className="text-teal text-sm font-bold flex items-center gap-2"><CheckCircle2 size={16} /> Session completed</p>
          )}
          {insight.content.sessionStatus === 'cancelled' && (
            <p className="text-red-400 text-sm font-bold flex items-center gap-2"><Ban size={16} /> Session cancelled</p>
          )}
        </div>
      )}

      {/* Key detail panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass-panel p-6">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Confidence Score</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 rounded-full bg-bg overflow-hidden">
              <div className="h-full bg-teal transition-all" style={{ width: `${insight.confidence * 100}%` }} />
            </div>
            <span className="text-2xl font-bold text-teal">{Math.round(insight.confidence * 100)}%</span>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Model Information</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Model Version</span>
              <span className="text-text font-bold font-mono">{insight.modelVersion || 'unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Generated On</span>
              <span className="text-text font-bold">{new Date(insight.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Type</span>
              <span className="text-text font-bold">{TYPE_LABELS[insight.type] ?? insight.type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FACT / INFERENCE / RECOMMENDATION / UNCERTAINTY — required labeling per prd.md §6.4 */}
      {insight.content && (insight.content.fact || insight.content.inference || insight.content.recommendation || insight.content.uncertainty) && (
        <div className="glass-panel p-6 mb-6 flex flex-col gap-4">
          {insight.content.fact && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal block mb-1">Fact</span>
              <p className="text-text text-sm leading-relaxed">{insight.content.fact}</p>
            </div>
          )}
          {insight.content.inference && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gold block mb-1">Inference</span>
              <p className="text-text text-sm leading-relaxed">{insight.content.inference}</p>
            </div>
          )}
          {insight.content.recommendation && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal block mb-1">Recommendation</span>
              <p className="text-text text-sm leading-relaxed">{insight.content.recommendation}</p>
            </div>
          )}
          {insight.content.uncertainty && (
            <div className="p-3 rounded bg-bg border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">Uncertainty</span>
              <p className="text-muted text-sm leading-relaxed">{insight.content.uncertainty}</p>
            </div>
          )}
        </div>
      )}

      {/* Supporting detail from content */}
      {insight.content && (
        <div className="glass-panel p-6 mb-6">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Supporting Data</h2>
          <div className="flex flex-col gap-3">
            {insight.content.period && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Period</span>
                <span className="text-text font-bold">{insight.content.period}</span>
              </div>
            )}
            {insight.content.change && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Change</span>
                <span className="text-teal font-bold">{insight.content.change}</span>
              </div>
            )}
            {insight.content.value && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Observed Value</span>
                <span className="text-gold font-bold">{insight.content.value}</span>
              </div>
            )}
            {insight.content.expected && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Expected</span>
                <span className="text-text font-bold">{insight.content.expected}</span>
              </div>
            )}
            {insight.content.affected_rows && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Affected Rows</span>
                <span className="text-text font-bold">
                  {insight.content.affected_rows.toLocaleString()} / {insight.content.total_rows?.toLocaleString()}
                </span>
              </div>
            )}
            {insight.content.confidence_reason && (
              <div className="mt-2 p-3 rounded bg-bg border border-border text-sm text-muted">
                <span className="text-xs font-bold uppercase tracking-wider text-teal block mb-1">Evidence Basis</span>
                {insight.content.confidence_reason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviewer's modification note, if this insight was sent back for changes */}
      {insight.content?.reviewNote && (
        <div className="glass-panel p-6 mb-6 border border-blue-500/30">
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Pencil size={14} /> Reviewer Note — Changes Requested
          </h2>
          <p className="text-text text-sm leading-relaxed">{insight.content.reviewNote}</p>
          {insight.content.reviewNoteAt && (
            <p className="text-muted text-xs mt-2">{new Date(insight.content.reviewNoteAt).toLocaleString()}</p>
          )}
        </div>
      )}

      {/* Rationale */}
      {insight.rationaleSummary && (
        <div className="glass-panel p-6 mb-6">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Formulation Rationale</h2>
          <p className="text-text text-sm leading-relaxed">{insight.rationaleSummary}</p>
        </div>
      )}

      {/* Review actions — gated to reviewer roles (server/routes/insights.ts
          enforces this for real; this just avoids showing a button that
          would only ever come back 403). */}
      {insight.status === 'pending' && !canReview && (
        <div className="glass-panel p-4 text-sm text-muted flex items-center gap-2">
          <AlertTriangle size={16} className="text-gold shrink-0" />
          Only a Lead Clinician or Pharmacist can review this insight. {user ? `Your role (${user.role}) doesn't have review permissions.` : ''}
        </div>
      )}
      {insight.status === 'pending' && canReview && (
        <>
          {reviewError && <ErrorBanner message={reviewError} />}

          {insight.type === 'telemedicine_request' && showScheduleForm && (
            <div className="glass-panel p-6 mb-4">
              <label className="text-sm font-bold text-text block mb-2">
                When is the session?
              </label>
              <input
                type="datetime-local"
                className="w-full bg-bg border border-border rounded p-3 text-sm text-text"
                value={scheduledAt}
                min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <label className="text-sm font-bold text-text block mb-2 mt-4">
                Note for the patient (optional) — e.g. a call link or instructions
              </label>
              <textarea
                className="w-full bg-bg border border-border rounded p-3 text-sm text-text"
                rows={2}
                placeholder="e.g. We'll call the number on file at the scheduled time."
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-3">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setShowScheduleForm(false); setScheduledAt(''); setSessionNote(''); }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex items-center gap-2 btn-sm"
                  disabled={submitting || !scheduledAt}
                  onClick={() => handleReview('accepted', sessionNote, new Date(scheduledAt).toISOString())}
                >
                  <Calendar size={14} /> Confirm Schedule
                </button>
              </div>
            </div>
          )}

          {showModifyForm && (
            <div className="glass-panel p-6 mb-4">
              <label className="text-sm font-bold text-text block mb-2">
                What needs to change before this can be approved?
              </label>
              <textarea
                className="w-full bg-bg border border-border rounded p-3 text-sm text-text"
                rows={3}
                placeholder="e.g. Dosage looks too high given the patient's weight — recheck before this goes out."
                value={modifyNote}
                onChange={(e) => setModifyNote(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-3">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setShowModifyForm(false); setModifyNote(''); }}
                >
                  Cancel
                </button>
                <button
                  className="btn flex items-center gap-2 btn-sm"
                  style={{ background: 'rgba(96,165,250,0.2)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.5)' }}
                  disabled={submitting || !modifyNote.trim()}
                  onClick={() => handleReview('modified', modifyNote)}
                >
                  <Pencil size={14} /> Submit for Modification
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={() => handleReview('rejected')}
            disabled={submitting}
            className="btn bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 flex items-center gap-2"
          >
            <XCircle size={18} /> {insight.type === 'telemedicine_request' ? 'Decline Request' : 'Reject Insight'}
          </button>
          {insight.type !== 'telemedicine_request' && (
            <button
              onClick={() => setShowModifyForm(true)}
              disabled={submitting || showModifyForm}
              className="btn bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 flex items-center gap-2"
            >
              <Pencil size={18} /> Request Modification
            </button>
          )}
          {insight.type === 'telemedicine_request' ? (
            <button
              onClick={() => setShowScheduleForm(true)}
              disabled={submitting || showScheduleForm}
              className="btn btn-primary flex items-center gap-2"
            >
              <Calendar size={18} /> Schedule Session
            </button>
          ) : (
            <button
              onClick={() => handleReview('accepted')}
              disabled={submitting}
              className="btn btn-primary flex items-center gap-2"
            >
              <CheckCircle2 size={18} /> Approve Insight
            </button>
          )}
          </div>
        </>
      )}
    </div>
  );
}
