import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, UserPlus, Activity } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import ErrorBanner from '../../components/ErrorBanner';

export default function Patients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/v1/patients')
      .then(r => r.json())
      .then(json => {
        if (json.success) setPatients(json.data);
        else setError(json.error || 'Failed to load patients.');
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load patients. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <Users className="text-teal" size={32} />
            Patients
          </h1>
          <p className="text-muted mt-1">Enrolled clients and their AI-generated vitamin concepts.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <UserPlus size={18} />
          Enroll Patient
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Search */}
      <div className="glass-panel p-4 mb-6 flex items-center gap-3">
        <Search size={18} className="text-muted" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-text placeholder-muted focus:outline-none text-sm"
        />
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg text-muted text-sm uppercase tracking-wider border-b border-border">
              <th className="p-4 font-bold">Patient</th>
              <th className="p-4 font-bold">Date of Birth</th>
              <th className="p-4 font-bold">Contact</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">
                  <Activity className="animate-spin inline mr-2" size={18} />
                  Loading patients...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">
                  {search ? `No patients matching "${search}"` : 'No patients enrolled yet.'}
                </td>
              </tr>
            ) : (
              filtered.map((patient) => (
                <tr key={patient.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal/20 text-teal flex items-center justify-center text-sm font-bold">
                        {patient.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-text font-bold">{patient.name}</div>
                        <div className="text-xs text-muted font-mono" title={patient.id}>{patient.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted">{patient.dob || '—'}</td>
                  <td className="p-4 text-muted text-sm">{patient.email || '—'}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-teal/20 text-teal uppercase">
                      {patient.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/app/patients/${patient.id}`}
                      className="text-teal hover:text-gold transition-colors font-bold text-sm"
                    >
                      View &rarr;
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
