import { Activity, Zap, RefreshCcw } from 'lucide-react';

export default function Models() {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <Zap className="text-gold" size={32} />
            Model Performance
          </h1>
          <p className="text-muted mt-1">Monitor Scikit-Learn Random Forest accuracy and data drifts.</p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2" disabled title="Retraining pipeline not yet built">
          <RefreshCcw size={18} />
          Retrain Model
        </button>
      </div>

      <div className="glass-panel p-4 mb-8 border border-gold/40 bg-gold/5 text-sm text-text">
        These metrics are illustrative placeholders, not a live evaluation. The underlying validation set has a known
        defect (see <code>data/faulty-valdation-set-f1-score-97.ipynb</code>) — treat any confidence scores from this
        model as unverified until that's resolved.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">F1 Score</span>
            <Activity size={20} className="text-teal" />
          </div>
          <div className="text-4xl font-bold text-text">0.94</div>
          <div className="text-xs text-muted">Illustrative — unverified</div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">Precision</span>
            <Activity size={20} className="text-teal" />
          </div>
          <div className="text-4xl font-bold text-text">0.92</div>
          <div className="text-xs text-muted">Illustrative — unverified</div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-muted text-sm font-bold uppercase tracking-wider">Recall</span>
            <Activity size={20} className="text-gold" />
          </div>
          <div className="text-4xl font-bold text-text">0.89</div>
          <div className="text-xs text-muted">Illustrative — unverified</div>
        </div>
      </div>

      <div className="glass-panel p-8">
        <h2 className="text-xl font-bold text-text mb-6">Active Pipeline</h2>
        <div className="flex flex-col gap-4 text-muted">
          <div className="flex justify-between border-b border-border pb-4">
            <span>Algorithm</span>
            <span className="font-bold text-text">Random Forest Classifier (Scikit-Learn)</span>
          </div>
          <div className="flex justify-between border-b border-border pb-4">
            <span>Training Dataset</span>
            <span className="font-bold text-text">Not tracked yet — no metrics endpoint wired up</span>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <span className="font-bold text-teal">Online & Serving</span>
          </div>
        </div>
      </div>
    </div>
  );
}
