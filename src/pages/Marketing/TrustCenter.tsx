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
            <h3>Encryption in Transit, and Where It Matters Most at Rest</h3>
            <p>All traffic is encrypted in transit (TLS). Connected wearable credentials (e.g. WHOOP OAuth tokens) are encrypted at rest with AES-256-GCM. We never sell your biometric data to third parties.</p>
          </div>

          <div className="bento-card glass-panel col-span-4" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="bento-icon mb-4">
              <Server size={24} />
            </div>
            <h3>Built for Thailand's PDPA</h3>
            <p>We operate under Thailand's Personal Data Protection Act (PDPA), not HIPAA — this is a Thai platform, and we don't claim a US compliance framework that doesn't apply here. Formal legal/DPA sign-off is in progress ahead of handling real, non-synthetic patient data.</p>
          </div>

          <div className="bento-card glass-panel col-span-4" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="bento-icon mb-4">
              <FileText size={24} />
            </div>
            <h3>Data Portability</h3>
            <p>Clinical teams can export insight and review data in JSON from the admin dashboard today. Self-serve export for individual patients is on our roadmap, not yet built.</p>
          </div>
          
        </div>
      </section>
    </div>
  );
}
