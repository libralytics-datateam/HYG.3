import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './MarketingLayout.css';

export default function MarketingLayout() {
  const { t } = useTranslation();

  return (
    <div className="marketing-layout">
      <header className="marketing-header">
        <div className="logo">
          <Link to="/">
            <Activity className="logo-icon" size={32} />
            HYG.3
          </Link>
        </div>
        <nav className="marketing-nav">
          <Link to="/product">{t('nav.product')}</Link>
          <Link to="/how-it-works">{t('nav.howItWorks')}</Link>
          <Link to="/about">{t('nav.about')}</Link>
        </nav>
        <div className="auth-links">
          <LanguageSwitcher />
          <Link to="/login" className="nav-login-link">{t('nav.login')}</Link>
          <Link to="/client/onboard" className="btn btn-primary">
            {t('nav.getStarted')}
            <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </Link>
        </div>
      </header>

      <main className="marketing-main animate-fade-in">
        <Outlet />
      </main>

      <footer className="marketing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo flex items-center gap-2">
              <Activity size={24} color="var(--gold)" />
              <span className="text-xl font-bold tracking-widest text-text">HYG.3</span>
            </div>
            <p className="text-muted" style={{ maxWidth: '300px', marginTop: '16px' }}>
              {t('footer.tagline')}
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <strong>{t('footer.product')}</strong>
              <Link to="/product">{t('footer.features')}</Link>
              <Link to="/how-it-works">{t('nav.howItWorks')}</Link>
              <Link to="/client/onboard">{t('nav.getStarted')}</Link>
            </div>
            <div className="footer-column">
              <strong>{t('footer.company')}</strong>
              <Link to="/about">{t('footer.aboutUs')}</Link>
              <Link to="/contact">{t('footer.contact')}</Link>
              <Link to="/login">{t('nav.login')}</Link>
            </div>
            <div className="footer-column">
              <strong>{t('footer.legal')}</strong>
              <Link to="/trust" className="flex items-center gap-2"><ShieldCheck size={16} /> {t('footer.trustCenter')}</Link>
              <Link to="/legal/privacy-policy" className="flex items-center gap-2"><FileText size={16} /> {t('footer.privacy')}</Link>
              <Link to="/legal/terms">{t('footer.terms')}</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Libralytics Co., Ltd. {t('footer.rights')}</p>
          <div className="flex gap-4">
            <Link to="/legal/privacy-policy">{t('footer.privacy')}</Link>
            <Link to="/legal/terms">{t('footer.terms')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
