import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, Camera, LayoutDashboard, LogOut } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './ClientLayout.css';

export default function ClientLayout() {
  const { t } = useTranslation();
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
              {t('clientLayout.myReport')}
            </Link>
            <Link to="/client/scan" className={isActive('/client/scan')}>
              <Camera size={18} />
              {t('clientLayout.scanHand')}
            </Link>
          </nav>
          <div className="client-profile">
            <LanguageSwitcher />
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
              {t('clientLayout.signOut')}
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
