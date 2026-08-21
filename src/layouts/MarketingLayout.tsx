import { Outlet, Link } from 'react-router-dom';
import { Activity, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import './MarketingLayout.css';

export default function MarketingLayout() {
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
          <Link to="/product">Product</Link>
          <Link to="/how-it-works">How it Works</Link>
          <Link to="/about">About</Link>
        </nav>
        <div className="auth-links">
          <Link to="/client/onboard" className="btn btn-primary">
            Get Started Free
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
              Pioneering medical-grade wearable intelligence to optimize your health outcomes and biometric recovery.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <strong>Product</strong>
              <Link to="/product">Features</Link>
              <Link to="/how-it-works">How it Works</Link>
              <Link to="/client/onboard">Get Started Free</Link>
            </div>
            <div className="footer-column">
              <strong>Company</strong>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="footer-column">
              <strong>Legal</strong>
              <Link to="/trust" className="flex items-center gap-2"><ShieldCheck size={16} /> Trust Center</Link>
              <Link to="/legal/privacy-policy" className="flex items-center gap-2"><FileText size={16} /> Privacy</Link>
              <Link to="/legal/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Libralytics Co., Ltd. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/legal/privacy-policy">Privacy Policy</Link>
            <Link to="/legal/terms">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
