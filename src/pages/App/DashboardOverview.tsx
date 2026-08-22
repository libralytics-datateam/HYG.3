import { Activity, Database, AlertCircle, CheckCircle2, TrendingUp, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface Stats {
  totalDatasets: number;
  totalProducts: number;
  totalPatients: number;
  pendingInsights: number;
  acceptedInsights: number;
  rejectedInsights: number;
  totalInsights: number;
  weeklyInsights: number;
  avgQualityScore: number;
  systemStatus: string;
}

interface RecentInsight {
  id: string;
  patientName: string;
  prediction: string;
  confidence: number;
  status: string;
  date: string;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInsights, setRecentInsights] = useState<RecentInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/v1/stats/overview').then(r => r.json()),
      apiFetch('/v1/ai/outputs').then(r => r.json()),
    ])
      .then(([statsJson, insightsJson]) => {
        if (statsJson.success) setStats(statsJson.data);
        if (insightsJson.success) setRecentInsights(insightsJson.data.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const qualityColor = (score: number) =>
    score >= 80 ? 'var(--teal)' : score >= 60 ? 'var(--gold)' : '#f87171';

  const statusBadge = (status: string) => {
    if (status === 'pending') return 'bg-gold/20 text-gold';
    if (status === 'rejected') return 'bg-red-500/20 text-red-400';
    return 'bg-teal/20 text-teal';
  };

  const insightTypeLabel = (prediction: string) => prediction || 'Unknown';

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text">Operational Overview</h1>
          <p className="text-muted mt-1">Phase 1 — Supplement & Vitamin Intelligence Dashboard</p>
        </div>
        <Link to="/app/ai-insights" className="btn btn-primary">
          Review Pending Insights
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">Pending Reviews</span>
            <AlertCircle size={20} className="text-gold" />
          </div>
          <div className="text-4xl font-bold text-text">
            {loading ? '—' : stats?.pendingInsights ?? 0}
          </div>
          <div className="text-xs text-muted">Requires admin sign-off</div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">Active Datasets</span>
            <Database size={20} className="text-teal" />
          </div>
          <div className="text-4xl font-bold text-text">
            {loading ? '—' : stats?.totalDatasets ?? 0}
          </div>
          <div className="text-xs text-teal">
            {loading ? '' : `${stats?.totalProducts ?? 0} catalog products`}
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">Avg Data Quality</span>
            <Activity size={20} className="text-teal" />
          </div>
          <div
            className="text-4xl font-bold"
            style={{ color: loading ? 'var(--text)' : qualityColor(stats?.avgQualityScore ?? 0) }}
          >
            {loading ? '—' : `${stats?.avgQualityScore ?? 0}%`}
          </div>
          <div className="text-xs text-muted">Across all ingested datasets</div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">System Status</span>
            <CheckCircle2 size={20} className="text-teal" />
          </div>
          <div className="text-4xl font-bold text-text">
            {loading ? '—' : stats?.systemStatus ?? 'Online'}
          </div>
          <div className="text-xs text-muted">
            {loading ? '' : `${stats?.weeklyInsights ?? 0} insights generated this week`}
          </div>
        </div>
      </div>

      {/* Insight Review Summary Bar */}
      {!loading && stats && stats.totalInsights > 0 && (
        <div className="glass-panel p-6 mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} />
              AI Insight Review Summary
            </h2>
            <span className="text-xs text-muted">{stats.totalInsights} total outputs</span>
          </div>
          <div className="flex gap-2 h-2 rounded-full overflow-hidden bg-bg">
            <div
              className="h-full bg-teal transition-all"
              style={{ width: `${(stats.acceptedInsights / stats.totalInsights) * 100}%` }}
              title={`Accepted: ${stats.acceptedInsights}`}
            />
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${(stats.pendingInsights / stats.totalInsights) * 100}%` }}
              title={`Pending: ${stats.pendingInsights}`}
            />
            <div
              className="h-full bg-red-500/70 transition-all"
              style={{ width: `${(stats.rejectedInsights / stats.totalInsights) * 100}%` }}
              title={`Rejected: ${stats.rejectedInsights}`}
            />
          </div>
          <div className="flex gap-6 mt-3 text-xs text-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal inline-block" /> Accepted ({stats.acceptedInsights})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold inline-block" /> Pending ({stats.pendingInsights})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/70 inline-block" /> Rejected ({stats.rejectedInsights})</span>
          </div>
        </div>
      )}

      {/* Recent AI Insights */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-text">Recent AI Insights</h2>
        <Link to="/app/ai-insights" className="text-teal text-sm hover:text-gold transition-colors">
          View all →
        </Link>
      </div>
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg text-muted text-sm uppercase tracking-wider border-b border-border">
              <th className="p-4 font-bold">Insight Type</th>
              <th className="p-4 font-bold">Subject</th>
              <th className="p-4 font-bold">Confidence</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">Loading...</td>
              </tr>
            ) : recentInsights.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">No insights generated yet.</td>
              </tr>
            ) : (
              recentInsights.map((insight) => (
                <tr key={insight.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                  <td className="p-4 text-text font-bold flex items-center gap-2">
                    <Package size={16} className="text-muted" />
                    {insightTypeLabel(insight.prediction)}
                  </td>
                  <td className="p-4 text-muted text-sm">{insight.patientName}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-bg overflow-hidden">
                        <div className="h-full bg-teal" style={{ width: `${insight.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted">{Math.round(insight.confidence * 100)}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${statusBadge(insight.status)}`}>
                      {insight.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/app/ai-insights/${insight.id}`}
                      className="text-teal hover:text-gold transition-colors font-bold text-sm"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
