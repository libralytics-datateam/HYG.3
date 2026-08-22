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
            <p>Connect WHOOP, Apple Health, or physical clinic hand scanners directly into our HIPAA-compliant ingestion pipeline. Data flows into your patient profile automatically.</p>
          </div>

          <div className="bento-card glass-panel col-span-6">
            <div className="bento-icon">
              <Zap size={24} />
            </div>
            <h3>Random Forest Prediction Engine</h3>
            <p>Our proprietary Scikit-Learn models analyze physiological anomalies in real time. We map sleep disturbances, recovery scores, and resting heart rates to clinical micronutrient deficiencies.</p>
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
