import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Database, Brain, FileBarChart, ShieldAlert, Layers, LogOut, UserRound, Menu, X, Pill } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path ? 'active' : '';
  const isParentActive = (path: string) => location.pathname.startsWith(path) && location.pathname !== '/app' ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeNav = () => setMobileNavOpen(false);

  return (
    <div className="app-layout">
      <div className="app-mobile-bar">
        <div className="app-mobile-bar-logo">
          <Activity size={22} />
          HYG.3
        </div>
        <button className="app-mobile-bar-toggle" onClick={() => setMobileNavOpen(o => !o)} aria-label="Toggle menu">
          {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <div className={`app-sidebar-backdrop ${mobileNavOpen ? 'is-open' : ''}`} onClick={closeNav} />
      <aside className={`app-sidebar ${mobileNavOpen ? 'is-open' : ''}`} onClick={closeNav}>
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
          <Link to="/app/products" className={isParentActive('/app/products')}>
            <Pill size={20} />
            Product Catalog
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
          <Link to="/app/models" className={isParentActive('/app/models')}>
            <Layers size={20} />
            Models
          </Link>
        </nav>
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user" title={user.email}>
              <div className="sidebar-user-name">{user.email}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          )}
          <button onClick={handleLogout} className="logout">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
      <main className="app-main animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
