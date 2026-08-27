import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, CheckCircle2, XCircle, ArrowLeft, TrendingUp, AlertTriangle, Database, Pencil } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import ErrorBanner from '../../components/ErrorBanner';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  sales_trend: <TrendingUp size={18} className="text-teal" />,
  anomaly: <AlertTriangle size={18} className="text-gold" />,
  data_quality: <Database size={18} className="text-teal" />,
  vitamin_concept: <Brain size={18} className="text-teal" />,
};

const TYPE_LABELS: Record<string, string> = {
  sales_trend: 'Sales Trend',
  anomaly: 'Anomaly Detection',
  data_quality: 'Data Quality',
  vitamin_concept: 'Vitamin Concept',
};

export default function AiInsightsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [modifyNote, setModifyNote] = useState('');

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

  const handleReview = async (status: 'accepted' | 'rejected' | 'modified', note?: string) => {
    try {
      setSubmitting(true);
      setReviewError('');
      const res = await apiFetch(`/v1/ai/outputs/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ status, note })
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

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading insight details...</div>;
  }

  if (error || !insight) {
    return <div className="p-8 text-center text-red-400">{error || 'Insight not found.'}</div>;
  }

  const statusBadge =
    insight.status === 'pending' ? 'bg-gold/20 text-gold' :
    insight.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
    insight.status === 'modified' ? 'bg-blue-500/20 text-blue-400' : 'bg-teal/20 text-teal';

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
          {insight.status}
        </span>
      </div>

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

      {/* Review actions */}
      {insight.status === 'pending' && (
        <>
          {reviewError && <ErrorBanner message={reviewError} />}

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
            <XCircle size={18} /> Reject Insight
          </button>
          <button
            onClick={() => setShowModifyForm(true)}
            disabled={submitting || showModifyForm}
            className="btn bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 flex items-center gap-2"
          >
            <Pencil size={18} /> Request Modification
          </button>
          <button
            onClick={() => handleReview('accepted')}
            disabled={submitting}
            className="btn btn-primary flex items-center gap-2"
          >
            <CheckCircle2 size={18} /> Approve Insight
          </button>
          </div>
        </>
      )}
    </div>
  );
}
