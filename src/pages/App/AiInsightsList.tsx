import { Link } from 'react-router-dom';
import { Brain, Filter, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import ErrorBanner from '../../components/ErrorBanner';

export default function AiInsightsList() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch('/v1/ai/outputs');
      const json = await res.json();
      if (json.success) {
        setInsights(json.data);
      } else {
        setError(json.error || 'Failed to load insights.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <Brain className="text-teal" size={32} />
            AI Insights
          </h1>
          <p className="text-muted mt-1">Review Machine Learning predictions and approve clinical formulations.</p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2">
          <Filter size={18} />
          Filter
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg text-muted text-sm uppercase tracking-wider border-b border-border">
              <th className="p-4 font-bold">Insight ID</th>
              <th className="p-4 font-bold">Patient ID</th>
              <th className="p-4 font-bold">Prediction</th>
              <th className="p-4 font-bold">Confidence</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  <RefreshCw className="animate-spin inline mr-2" size={18} />
                  Loading Insights...
                </td>
              </tr>
            ) : insights.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  No AI Insights found.
                </td>
              </tr>
            ) : (
              insights.map((insight) => (
                <tr key={insight.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                  <td className="p-4 text-muted font-mono text-xs" title={insight.id}>{insight.id.substring(0,8)}...</td>
                  <td className="p-4 text-text font-bold">{insight.patientName}</td>
                  <td className="p-4 text-text">{insight.prediction}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-bg overflow-hidden">
                        <div className="h-full bg-teal" style={{ width: `${insight.confidence * 100}%` }}></div>
                      </div>
                      <span className="text-sm text-muted">{Math.round(insight.confidence * 100)}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      insight.status === 'pending' ? 'bg-gold/20 text-gold' :
                      insight.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      insight.status === 'modified' ? 'bg-blue-500/20 text-blue-400' : 'bg-teal/20 text-teal'
                    }`}>
                      {insight.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link to={`/app/ai-insights/${insight.id}`} className="text-teal hover:text-gold transition-colors font-bold text-sm">Review &rarr;</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
