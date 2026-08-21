import { FileText, Download, TrendingUp, Database, Brain, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface WeeklySummary {
  weeklyInsights: number;
  totalDatasets: number;
  pendingInsights: number;
  acceptedInsights: number;
  rejectedInsights: number;
  totalInsights: number;
  avgQualityScore: number;
}

export default function Reports() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/v1/stats/overview`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setSummary(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const exportJSON = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <FileText className="text-teal" size={32} />
            Reports
          </h1>
          <p className="text-muted mt-1">
            Operational summaries for partner IT and admin teams.
          </p>
        </div>
      </div>

      {/* Weekly Summary Card */}
      <div className="glass-panel p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-text">Weekly Operational Summary</h2>
            <p className="text-muted text-sm mt-1">
              {formatDate(weekStart)} — {formatDate(today)}
            </p>
          </div>
          <button
            className="btn btn-secondary flex items-center gap-2"
            onClick={() => summary && exportJSON(summary, `hyg3-weekly-${today.toISOString().split('T')[0]}.json`)}
            disabled={loading || !summary}
          >
            <Download size={16} />
            Export JSON
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-8">Loading summary...</div>
        ) : summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2 p-4 bg-bg rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider">
                <Brain size={14} className="text-teal" />
                AI Insights (7d)
              </div>
              <div className="text-3xl font-bold text-text">{summary.weeklyInsights}</div>
              <div className="text-xs text-muted">Generated this week</div>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-bg rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 size={14} className="text-teal" />
                Review Rate
              </div>
              <div className="text-3xl font-bold text-teal">
                {summary.totalInsights > 0
                  ? Math.round(((summary.acceptedInsights + summary.rejectedInsights) / summary.totalInsights) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-muted">
                {summary.acceptedInsights} accepted / {summary.rejectedInsights} rejected
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-bg rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider">
                <Database size={14} className="text-teal" />
                Datasets Active
              </div>
              <div className="text-3xl font-bold text-text">{summary.totalDatasets}</div>
              <div className="text-xs text-muted">Ingested data sources</div>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-bg rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider">
                <TrendingUp size={14} className="text-teal" />
                Avg Quality Score
              </div>
              <div
                className="text-3xl font-bold"
                style={{
                  color: summary.avgQualityScore >= 80
                    ? 'var(--teal)'
                    : summary.avgQualityScore >= 60
                    ? 'var(--gold)'
                    : '#f87171'
                }}
              >
                {summary.avgQualityScore}%
              </div>
              <div className="text-xs text-muted">Across all datasets</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted py-8">No data available.</div>
        )}
      </div>

      {/* Static report archive */}
      <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Report Archive</h2>
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg text-muted text-sm uppercase tracking-wider border-b border-border">
              <th className="p-4 font-bold">Report Name</th>
              <th className="p-4 font-bold">Period</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Export</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                name: 'Supplement Sales Intelligence — Q3 2025',
                period: 'Jul – Sep 2025',
                status: 'Available',
              },
              {
                name: 'Data Quality Assessment — Catalog 2025',
                period: 'Aug 2025',
                status: 'Available',
              },
              {
                name: 'AI Insight Review Summary — Pilot Month 1',
                period: 'Jul 2026',
                status: 'Available',
              },
            ].map((rep, i) => (
              <tr
                key={i}
                className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors"
              >
                <td className="p-4 text-text font-bold flex items-center gap-3">
                  <FileText className="text-muted" size={18} />
                  {rep.name}
                </td>
                <td className="p-4 text-muted text-sm">{rep.period}</td>
                <td className="p-4">
                  <span className="bg-teal/20 text-teal text-xs font-bold px-2 py-1 rounded">
                    {rep.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    className="p-2 hover:bg-bg rounded text-teal hover:text-gold transition-colors"
                    title="Export"
                    onClick={() => summary && exportJSON({ report: rep.name, ...summary }, `${rep.name.toLowerCase().replace(/\s+/g, '-')}.json`)}
                  >
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
