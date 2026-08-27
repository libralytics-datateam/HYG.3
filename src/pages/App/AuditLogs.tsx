import { ShieldCheck, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import ErrorBanner from '../../components/ErrorBanner';

interface AuditEntry {
  id: string;
  prediction: string;
  status: string;
  confidence: number;
  date: string;
  patientName: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function actionIcon(status: string) {
  if (status === 'accepted') return <CheckCircle2 size={16} className="text-teal" />;
  if (status === 'rejected') return <XCircle size={16} className="text-red-400" />;
  return <Clock size={16} className="text-gold" />;
}

function actionLabel(status: string) {
  if (status === 'accepted') return 'Insight Approved';
  if (status === 'rejected') return 'Insight Rejected';
  if (status === 'modified') return 'Insight Modified';
  return 'Insight Generated';
}

function actionBadge(status: string) {
  if (status === 'accepted') return 'bg-teal/20 text-teal';
  if (status === 'rejected') return 'bg-red-500/20 text-red-400';
  if (status === 'modified') return 'bg-blue-500/20 text-blue-400';
  return 'bg-gold/20 text-gold';
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/v1/ai/outputs')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          // Show all insights as audit trail — ordered by date desc
          setLogs(json.data);
        } else {
          setError(json.error || 'Failed to load audit trail.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load audit trail. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const reviewed = logs.filter(l => l.status !== 'pending');
  const pending = logs.filter(l => l.status === 'pending');

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <ShieldCheck className="text-teal" size={32} />
            Audit Logs
          </h1>
          <p className="text-muted mt-1">
            Full AI output trail — every insight generated, reviewed, and actioned.
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="px-3 py-1.5 rounded glass-panel text-muted">
            <span className="text-teal font-bold">{reviewed.length}</span> Reviewed
          </span>
          <span className="px-3 py-1.5 rounded glass-panel text-muted">
            <span className="text-gold font-bold">{pending.length}</span> Pending
          </span>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Reviewed entries */}
      {reviewed.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
            Review Actions
          </h2>
          <div className="glass-panel overflow-hidden mb-8">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg text-muted text-sm uppercase tracking-wider border-b border-border">
                  <th className="p-4 font-bold">Insight ID</th>
                  <th className="p-4 font-bold">Subject</th>
                  <th className="p-4 font-bold">Action</th>
                  <th className="p-4 font-bold">Confidence</th>
                  <th className="p-4 font-bold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                    <td className="p-4 text-muted font-mono text-xs" title={log.id}>
                      {log.id.substring(0, 8)}…
                    </td>
                    <td className="p-4">
                      <div className="text-text font-bold text-sm">{log.prediction}</div>
                      <div className="text-xs text-muted">{log.patientName}</div>
                    </td>
                    <td className="p-4">
                      <span className={`flex items-center gap-2 w-fit px-2 py-1 rounded text-xs font-bold ${actionBadge(log.status)}`}>
                        {actionIcon(log.status)}
                        {actionLabel(log.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-2 rounded-full bg-bg overflow-hidden">
                          <div className="h-full bg-teal" style={{ width: `${log.confidence * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted">{Math.round(log.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted text-sm text-right">
                      {timeAgo(log.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {/* All generated (pending too) */}
      <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
        All Generated Insights
      </h2>
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg text-muted text-sm uppercase tracking-wider border-b border-border">
              <th className="p-4 font-bold">Insight ID</th>
              <th className="p-4 font-bold">Subject</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Generated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted">
                  <RefreshCw className="animate-spin inline mr-2" size={18} />
                  Loading audit trail...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={`all-${log.id}`} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                  <td className="p-4 text-muted font-mono text-xs" title={log.id}>
                    {log.id.substring(0, 8)}…
                  </td>
                  <td className="p-4">
                    <div className="text-text text-sm font-bold">{log.prediction}</div>
                    <div className="text-xs text-muted">{log.patientName}</div>
                  </td>
                  <td className="p-4">
                    <span className={`flex items-center gap-2 w-fit px-2 py-1 rounded text-xs font-bold ${actionBadge(log.status)}`}>
                      {actionIcon(log.status)}
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4 text-muted text-sm text-right">
                    {timeAgo(log.date)}
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
