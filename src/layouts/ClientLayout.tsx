import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, Camera, LayoutDashboard, LogOut } from 'lucide-react';
import './ClientLayout.css';

export default function ClientLayout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';
  const patientName = localStorage.getItem('hyg3_patient_name');

  // Hide nav on onboarding and scanner pages (full-screen)
  const hideNav = location.pathname.includes('/onboard') || location.pathname.includes('/scan');

  return (
    <div className="client-layout">
      {!hideNav && (
        <header className="client-header">
          <div className="logo">
            <Link to="/client/dashboard">
              <Activity size={24} />
              HYG.3
            </Link>
          </div>
          <nav className="client-nav">
            <Link to="/client/dashboard" className={isActive('/client/dashboard')}>
              <LayoutDashboard size={18} />
              My Report
            </Link>
            <Link to="/client/scan" className={isActive('/client/scan')}>
              <Camera size={18} />
              Scan Hand
            </Link>
          </nav>
          <div className="client-profile">
            {patientName && (
              <span className="text-muted text-sm" style={{ marginRight: '12px' }}>
                {patientName.split(' ')[0]}
              </span>
            )}
            <button
              className="logout"
              onClick={() => {
                localStorage.removeItem('hyg3_patient_id');
                localStorage.removeItem('hyg3_patient_name');
                window.location.href = '/client/onboard';
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </header>
      )}
      <main className="client-main animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
