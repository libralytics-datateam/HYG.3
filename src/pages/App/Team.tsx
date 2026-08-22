import { Users, Plus, Shield } from 'lucide-react';

export default function Team() {
  const team = [
    { id: 'USR-001', name: 'Dr. Sarah Chen', role: 'Lead Clinician', email: 'sarah@libralytics.com', status: 'Active' },
    { id: 'USR-002', name: 'Dr. Marcus Webb', role: 'Pharmacist', email: 'marcus@libralytics.com', status: 'Active' },
    { id: 'USR-003', name: 'Alex Johnson', role: 'System Admin', email: 'alex@libralytics.com', status: 'Offline' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <Users className="text-teal" size={32} />
            Clinical Team
          </h1>
          <p className="text-muted mt-1">Manage clinician access and review permissions.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Invite Member
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg text-muted text-sm uppercase tracking-wider border-b border-border">
              <th className="p-4 font-bold">Name</th>
              <th className="p-4 font-bold">Role</th>
              <th className="p-4 font-bold">Email</th>
              <th className="p-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                <td className="p-4 text-text font-bold flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal/20 text-teal flex items-center justify-center text-xs">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {member.name}
                </td>
                <td className="p-4 text-muted flex items-center gap-2">
                  {member.role.includes('Admin') && <Shield size={14} className="text-gold" />}
                  {member.role}
                </td>
                <td className="p-4 text-muted">{member.email}</td>
                <td className="p-4">
                  <span className={`flex items-center gap-2 text-sm font-bold ${
                    member.status === 'Active' ? 'text-teal' : 'text-muted'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-teal' : 'bg-muted'}`}></div>
                    {member.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
