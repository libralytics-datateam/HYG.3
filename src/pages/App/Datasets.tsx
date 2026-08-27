import { Database, Upload, RefreshCw, X, FileText, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import ErrorBanner from '../../components/ErrorBanner';

interface Dataset {
  id: string;
  name: string;
  type: string;
  rowCount: number;
  qualityScore: number;
  qualityLabel: string;
  lastUpdated: string;
  orgName: string;
}

const TYPE_LABELS: Record<string, string> = {
  sales_export: 'Sales Export',
  api_stream: 'API Stream',
  catalog: 'Catalog',
};

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'sales_export' });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [lastInsightGenerated, setLastInsightGenerated] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/v1/datasets');
      const json = await res.json();
      if (json.success) setDatasets(json.data);
      else setError(json.error || 'Failed to load datasets.');
    } catch (err) {
      console.error(err);
      setError('Failed to load datasets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    setFormError('');
    try {
      const body = new FormData();
      body.append('name', form.name);
      body.append('type', form.type);
      if (file) body.append('file', file);

      const res = await apiFetch('/v1/datasets', { method: 'POST', body });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', type: 'sales_export' });
        setFile(null);
        setLastInsightGenerated(!!json.insightGenerated);
        await fetchDatasets();
      } else {
        setFormError(json.error || 'Failed to register dataset.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Failed to register dataset. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const qualityColor = (score: number) =>
    score >= 80 ? 'text-teal' : score >= 60 ? 'text-gold' : 'text-red-400';

  const qualityBarColor = (score: number) =>
    score >= 80 ? 'bg-teal' : score >= 60 ? 'bg-gold' : 'bg-red-500';

  const qualityBadge = (label: string) => {
    if (label === 'Good') return 'bg-teal/20 text-teal';
    if (label === 'Fair') return 'bg-gold/20 text-gold';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <Database className="text-teal" size={32} />
            Datasets
          </h1>
          <p className="text-muted mt-1">
            Ingested supplement sales, catalog, and operational data sources.
          </p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Upload size={18} />
          Register Dataset
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {lastInsightGenerated && (
        <div className="glass-panel p-4 mb-6 flex items-center gap-3 border border-teal/40 bg-teal/5">
          <Sparkles size={20} className="text-teal" style={{ flexShrink: 0 }} />
          <span className="text-text text-sm">
            A real sales trend insight was computed from your upload — check{' '}
            <Link to="/app/ai-insights" className="text-teal font-bold underline">AI Insights</Link>.
          </span>
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg text-muted text-sm uppercase tracking-wider border-b border-border">
              <th className="p-4 font-bold">Name</th>
              <th className="p-4 font-bold">Type</th>
              <th className="p-4 font-bold">Rows</th>
              <th className="p-4 font-bold">Data Quality</th>
              <th className="p-4 font-bold">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">
                  <RefreshCw className="animate-spin inline mr-2" size={18} />
                  Loading datasets...
                </td>
              </tr>
            ) : datasets.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">
                  No datasets registered yet.
                </td>
              </tr>
            ) : (
              datasets.map((ds) => (
                <tr
                  key={ds.id}
                  className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-bold text-text">{ds.name}</div>
                    <div className="text-xs text-muted font-mono">{ds.id.substring(0, 8)}...</div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 rounded bg-bg text-muted border border-border font-bold uppercase tracking-wide">
                      {TYPE_LABELS[ds.type] ?? ds.type}
                    </span>
                  </td>
                  <td className="p-4 text-text font-mono">
                    {ds.rowCount.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 rounded-full bg-bg overflow-hidden">
                        <div
                          className={`h-full ${qualityBarColor(ds.qualityScore)} transition-all`}
                          style={{ width: `${ds.qualityScore}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${qualityColor(ds.qualityScore)}`}>
                        {ds.qualityScore}%
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${qualityBadge(ds.qualityLabel)}`}>
                        {ds.qualityLabel}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-muted text-sm">
                    {new Date(ds.lastUpdated).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Register Dataset Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-panel p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text">Register Dataset</h2>
              <button
                className="text-muted hover:text-text transition-colors"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wider">
                  Dataset Name
                </label>
                <input
                  className="w-full bg-bg border border-border rounded p-3 text-text focus:outline-none focus:border-teal"
                  placeholder="e.g. Supplement Sales — Q4 2026"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wider">
                  Type
                </label>
                <select
                  className="w-full bg-bg border border-border rounded p-3 text-text focus:outline-none focus:border-teal"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="sales_export">Sales Export</option>
                  <option value="catalog">Catalog</option>
                  <option value="api_stream">API Stream</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wider">
                  CSV File (optional)
                </label>
                <label className="w-full flex items-center gap-3 bg-bg border border-border rounded p-3 text-muted cursor-pointer hover:border-teal transition-colors">
                  <FileText size={18} className="text-teal" style={{ flexShrink: 0 }} />
                  <span className="text-sm truncate">{file ? file.name : 'Choose a CSV to compute real row count, quality score, and trends'}</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <p className="text-xs text-muted mt-2">Without a file, the dataset is registered with a 0 quality score, same as before.</p>
              </div>

              {formError && <p className="text-xs text-red-400">{formError}</p>}

              <div className="flex justify-end gap-3 mt-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowModal(false); setFormError(''); setFile(null); }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreate}
                  disabled={submitting || !form.name.trim()}
                >
                  {submitting ? 'Registering...' : 'Register Dataset'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
