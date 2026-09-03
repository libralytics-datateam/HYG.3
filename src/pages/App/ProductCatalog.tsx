import { Pill, Upload, RefreshCw, X, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import ErrorBanner from '../../components/ErrorBanner';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  dosageForm: string;
  ingredients: string[];
  price: number | null;
  currency: string | null;
  purchaseUrl: string | null;
}

export default function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [lastUploadSummary, setLastUploadSummary] = useState<{ totalRows: number; inserted: number; skipped: number } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/v1/products');
      const json = await res.json();
      if (json.success) setProducts(json.data);
      else setError(json.error || 'Failed to load product catalog.');
    } catch (err) {
      console.error(err);
      setError('Failed to load product catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setSubmitting(true);
    setFormError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await apiFetch('/v1/products/upload', { method: 'POST', body });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowModal(false);
        setFile(null);
        setLastUploadSummary(json.data);
        await fetchProducts();
      } else {
        setFormError(json.error || 'Failed to upload catalog.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Failed to upload catalog. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <Pill className="text-teal" size={32} />
            Product Catalog
          </h1>
          <p className="text-muted mt-1">
            Real SKUs matched against AI-suggested vitamins at approval time — see server/services/productMatch.ts.
            Nothing here is seeded; this is empty until a real catalog is uploaded.
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Upload size={18} />
          Upload Catalog
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {lastUploadSummary && (
        <div className="glass-panel p-4 mb-6 border border-teal/40 bg-teal/5 text-sm text-text">
          Uploaded {lastUploadSummary.totalRows} row{lastUploadSummary.totalRows === 1 ? '' : 's'} —{' '}
          <span className="text-teal font-bold">{lastUploadSummary.inserted} added</span>
          {lastUploadSummary.skipped > 0 && (
            <span className="text-gold"> · {lastUploadSummary.skipped} skipped (missing required fields)</span>
          )}
          .
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg text-muted text-sm uppercase tracking-wider border-b border-border">
                <th className="p-4 font-bold">SKU</th>
                <th className="p-4 font-bold">Name</th>
                <th className="p-4 font-bold">Category</th>
                <th className="p-4 font-bold">Dosage Form</th>
                <th className="p-4 font-bold">Price</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">
                    <RefreshCw className="animate-spin inline mr-2" size={18} />
                    Loading catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">
                    No products in the catalog yet. Upload a real CSV to start matching AI recommendations to actual SKUs.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                    <td className="p-4 text-muted font-mono text-xs">{p.sku}</td>
                    <td className="p-4">
                      <div className="font-bold text-text">{p.name}</div>
                      {p.ingredients.length > 0 && (
                        <div className="text-xs text-muted mt-1">{p.ingredients.join(', ')}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-1 rounded bg-bg text-muted border border-border font-bold uppercase tracking-wide">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 text-text text-sm">{p.dosageForm}</td>
                    <td className="p-4 text-text text-sm">
                      {p.price != null ? `${p.price.toLocaleString()} ${p.currency || ''}`.trim() : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="glass-panel p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text">Upload Product Catalog</h2>
              <button className="text-muted hover:text-text transition-colors" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wider">CSV File</label>
                <label className="w-full flex items-center gap-3 bg-bg border border-border rounded p-3 text-muted cursor-pointer hover:border-teal transition-colors">
                  <FileText size={18} className="text-teal" style={{ flexShrink: 0 }} />
                  <span className="text-sm truncate">{file ? file.name : 'Choose a CSV'}</span>
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
                <p className="text-xs text-muted mt-2">
                  Required columns: <span className="font-mono">sku, name, category, dosageForm</span>. Optional:{' '}
                  <span className="font-mono">ingredients</span> (semicolon-separated), <span className="font-mono">price, currency, purchaseUrl</span>.
                </p>
              </div>

              {formError && <p className="text-xs text-red-400">{formError}</p>}

              <div className="flex justify-end gap-3 mt-2">
                <button className="btn btn-secondary" onClick={() => { setShowModal(false); setFormError(''); setFile(null); }}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUpload} disabled={submitting || !file}>
                  {submitting ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
