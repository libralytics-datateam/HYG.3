import { Zap, Shield, Database, Activity, Calendar } from 'lucide-react';

function ComingSoonBadge() {
  return (
    <span className="inline-block bg-gold/20 text-gold text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
      Coming Soon
    </span>
  );
}

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
              <Calendar size={24} />
            </div>
            <h3>Wellness Check-ins &amp; Trends</h3>
            <p>A 30-second periodic check-in — how you feel, any symptoms, whether you followed your plan — builds a real trend over time, visible to you and your pharmacist. Direct self-report, not inferred from any other signal.</p>
          </div>

          <div className="bento-card glass-panel col-span-12">
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
            <ComingSoonBadge />
            <h3>Dynamic Vitamin Concepts</h3>
            <p>Gone are the days of static daily vitamins. Once a real, sourced product catalog and clinically-validated recommendation logic are in place, your formulation concept will adjust its baseline ingredient profile as your biometric data changes — heavy training weeks, illness, poor sleep. On our roadmap, not yet live.</p>
          </div>

        </div>
      </section>
    </div>
  );
}
