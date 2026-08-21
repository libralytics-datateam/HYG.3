import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, CheckCircle2, XCircle, ArrowLeft, TrendingUp, AlertTriangle, Database } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  useEffect(() => {
    fetchInsights();
  }, [id]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/v1/ai/outputs`);
      const json = await res.json();
      if (json.success) {
        const found = json.data.find((i: any) => i.id === id);
        setInsight(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'accepted' | 'rejected') => {
    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/v1/ai/outputs/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewerId: 'mock-reviewer-id' })
      });
      if (res.ok) {
        navigate('/app/ai-insights');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading insight details...</div>;
  }

  if (!insight) {
    return <div className="p-8 text-center text-red-400">Insight not found.</div>;
  }

  const statusBadge =
    insight.status === 'pending' ? 'bg-gold/20 text-gold' :
    insight.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-teal/20 text-teal';

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
              <span className="text-text font-bold font-mono">hyg-v1</span>
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

      {/* Rationale */}
      {insight.rationaleSummary && (
        <div className="glass-panel p-6 mb-6">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Formulation Rationale</h2>
          <p className="text-text text-sm leading-relaxed">{insight.rationaleSummary}</p>
        </div>
      )}

      {/* Review actions */}
      {insight.status === 'pending' && (
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={() => handleReview('rejected')}
            disabled={submitting}
            className="btn bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 flex items-center gap-2"
          >
            <XCircle size={18} /> Reject Insight
          </button>
          <button
            onClick={() => handleReview('accepted')}
            disabled={submitting}
            className="btn btn-primary flex items-center gap-2"
          >
            <CheckCircle2 size={18} /> Approve Insight
          </button>
        </div>
      )}
    </div>
  );
}
