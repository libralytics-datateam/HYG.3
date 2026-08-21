import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Database, Brain, FileBarChart, ShieldAlert, Building2, Users, Layers, LogOut, UserRound } from 'lucide-react';
import './AppLayout.css';

export default function AppLayout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'active' : '';
  const isParentActive = (path: string) => location.pathname.startsWith(path) && location.pathname !== '/app' ? 'active' : '';

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <Link to="/app" className="logo">
            <Activity size={24} />
            HYG.3
          </Link>
          <span className="badge">Internal</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/app" className={isActive('/app')}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/app/datasets" className={isParentActive('/app/datasets')}>
            <Database size={20} />
            Datasets
          </Link>
          <Link to="/app/ai-insights" className={isParentActive('/app/ai-insights')}>
            <Brain size={20} />
            AI Insights
          </Link>
          <Link to="/app/patients" className={isParentActive('/app/patients')}>
            <UserRound size={20} />
            Patients
          </Link>
          <Link to="/app/reports" className={isParentActive('/app/reports')}>
            <FileBarChart size={20} />
            Reports
          </Link>
          <div style={{ marginTop: '24px', marginBottom: '8px', paddingLeft: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
            Admin
          </div>
          <Link to="/app/audit" className={isParentActive('/app/audit')}>
            <ShieldAlert size={20} />
            Audit Logs
          </Link>
          <Link to="/app/organization" className={isParentActive('/app/organization')}>
            <Building2 size={20} />
            Organization
          </Link>
          <Link to="/app/team" className={isParentActive('/app/team')}>
            <Users size={20} />
            Team
          </Link>
          <Link to="/app/models" className={isParentActive('/app/models')}>
            <Layers size={20} />
            Models
          </Link>
        </nav>
        <div className="sidebar-footer">
          <Link to="/" className="logout">
            <LogOut size={20} />
            Logout
          </Link>
        </div>
      </aside>
      <main className="app-main animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
