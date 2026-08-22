import { Lock, Server, FileText } from 'lucide-react';

export default function TrustCenter() {
  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in">
        <h1 className="hero-title">Trust <span className="text-teal">Center</span></h1>
        <p className="hero-subtitle">
          Your biometric data is sensitive. We treat it with the highest clinical and cryptographic standards.
        </p>
      </section>

      <section className="workflow-section animate-fade-in delay-200">
        <div className="bento-grid">
          
          <div className="bento-card glass-panel col-span-4" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="bento-icon mb-4">
              <Lock size={24} />
            </div>
            <h3>End-to-End Encryption</h3>
            <p>All data in transit and at rest is secured using AES-256 encryption. We never sell your biometric data to third parties.</p>
          </div>

          <div className="bento-card glass-panel col-span-4" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="bento-icon mb-4">
              <Server size={24} />
            </div>
            <h3>HIPAA Compliance</h3>
            <p>Our infrastructure is fully HIPAA compliant. Access to PHI is strictly audited and limited to reviewing clinicians.</p>
          </div>

          <div className="bento-card glass-panel col-span-4" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="bento-icon mb-4">
              <FileText size={24} />
            </div>
            <h3>Data Portability</h3>
            <p>You own your data. Export your biometric inferences, clinical reviews, and formulations in standard CSV or JSON formats at any time.</p>
          </div>
          
        </div>
      </section>
    </div>
  );
}
