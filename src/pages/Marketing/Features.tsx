import { Zap, Shield, Database, Activity } from 'lucide-react';

export default function Features() {
  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in">
        <h1 className="hero-title">Platform <span className="text-teal">Features</span></h1>
        <p className="hero-subtitle">
          Discover how HYG.3 integrates wearable biometric data, advanced Machine Learning, and clinical oversight.
        </p>
      </section>

      <section className="workflow-section animate-fade-in delay-200">
        <div className="bento-grid">
          
          <div className="bento-card glass-panel col-span-6">
            <div className="bento-icon">
              <Database size={24} />
            </div>
            <h3>Biometric Ingestion API</h3>
            <p>Connect WHOOP, or use a physical clinic hand scan — no wearable required. Data flows into your patient profile automatically.</p>
          </div>

          <div className="bento-card glass-panel col-span-6">
            <div className="bento-icon">
              <Zap size={24} />
            </div>
            <h3>Building Toward Real Prediction</h3>
            <p>We deliberately gated our first prediction model after finding its training data had no clinical provenance. Every pharmacist-reviewed case and connected wearable reading is now accumulating as real, first-party ground truth toward a model worth trusting.</p>
          </div>

          <div className="bento-card glass-panel col-span-12">
            <div className="bento-icon">
              <Shield size={24} />
            </div>
            <h3>Clinical Oversight Dashboard</h3>
            <p>Every AI recommendation is routed through our Pharmacist/Clinical review pipeline. Adjust doses, deny inappropriate recommendations, or approve them with a single click before the patient is notified.</p>
          </div>

          <div className="bento-card glass-panel col-span-12">
            <div className="bento-icon">
              <Activity size={24} />
            </div>
            <h3>Dynamic Vitamin Concepts</h3>
            <p>Gone are the days of static daily vitamins. As your biometric data changes (e.g. heavy training weeks, illness, poor sleep), your formulation concept adjusts its baseline ingredient profiles dynamically.</p>
          </div>

        </div>
      </section>
    </div>
  );
}
