import { Link as LinkIcon, Smartphone, Watch } from 'lucide-react';

export default function Integrations() {
  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in">
        <h1 className="hero-title">How It <span className="text-teal">Works</span></h1>
        <p className="hero-subtitle">
          Seamlessly connect your biometric hardware to HYG.3 in seconds. We support WHOOP, Apple Health, and clinical hand scanners.
        </p>
      </section>

      <section className="workflow-section animate-fade-in delay-200">
        <div className="bento-grid">
          
          <div className="bento-card glass-panel col-span-4" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="bento-icon mb-4">
              <Smartphone size={24} />
            </div>
            <h3>1. Create Account</h3>
            <p>Sign up and complete your baseline health profile. No credit card required.</p>
          </div>

          <div className="bento-card glass-panel col-span-4" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="bento-icon mb-4">
              <LinkIcon size={24} />
            </div>
            <h3>2. Connect Wearable</h3>
            <p>Authorize WHOOP or Apple Health via our secure OAuth 2.0 integration.</p>
          </div>

          <div className="bento-card glass-panel col-span-4" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="bento-icon mb-4">
              <Watch size={24} />
            </div>
            <h3>3. Receive Formulation</h3>
            <p>Our ML engine analyzes your data within minutes and outputs a clinical-grade vitamin concept.</p>
          </div>
          
        </div>
      </section>
    </div>
  );
}
