import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Brain, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/v1/patients/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setPatient(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted">Loading patient...</div>;
  if (!patient) return <div className="p-8 text-center text-red-400">Patient not found.</div>;

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 size={16} className="text-teal" />;
    if (status === 'rejected') return <XCircle size={16} className="text-red-400" />;
    return <Clock size={16} className="text-gold" />;
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/app/patients')}
        className="flex items-center gap-2 text-muted hover:text-teal transition-colors mb-6"
      >
        <ArrowLeft size={18} /> Back to Patients
      </button>

      {/* Header */}
      <div className="glass-panel p-6 mb-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-teal/20 text-teal flex items-center justify-center text-2xl font-bold">
          {`${patient.firstName} ${patient.lastName}`.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <User className="text-teal" size={28} />
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-muted mt-1">DOB: {patient.dob || '—'} &bull; {patient.email || '—'} &bull; {patient.phone || '—'}</p>
        </div>
        <span className="px-3 py-1 rounded text-xs font-bold bg-teal/20 text-teal uppercase">Active</span>
      </div>

      {/* AI Concepts */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
          <Brain className="text-gold" size={22} />
          AI Vitamin Concepts
        </h2>

        {patient.customVitaminConcepts.length === 0 ? (
          <p className="text-muted text-sm">No AI concepts generated yet for this patient.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {patient.customVitaminConcepts.map((concept: any) => {
              let skus: string[] = [];
              try { skus = JSON.parse(concept.recommendedSkus || '[]'); } catch (_) {}
              return (
                <div key={concept.id} className="border border-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted font-mono text-xs" title={concept.id}>{concept.id.substring(0, 8)}...</span>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {statusIcon(concept.status)}
                      <span className={
                        concept.status === 'approved' ? 'text-teal' :
                        concept.status === 'rejected' ? 'text-red-400' : 'text-gold'
                      }>
                        {concept.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  {concept.rationaleSummary && (
                    <p className="text-text text-sm">{concept.rationaleSummary}</p>
                  )}
                  {skus.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skus.map((sku: string) => (
                        <span key={sku} className="px-2 py-1 bg-teal/10 text-teal text-xs rounded-full border border-teal/20">{sku}</span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted">
                    Generated {new Date(concept.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
