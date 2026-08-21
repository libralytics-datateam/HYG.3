import './Home.css';
import { Link } from 'react-router-dom';
import { Activity, Zap, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in">
        <div className="hero-badge">
          <Sparkles size={16} /> V2.0 Wearable Intelligence
        </div>
        <h1 className="hero-title">
          Wellness <span className="text-teal">Before</span> Illness
        </h1>
        <p className="hero-subtitle">
          Vitamin & Supplement Intelligence powered by AI and wearable biometric data. 
          Stop guessing with generic formulas, start knowing what your body needs.
        </p>
        <div className="hero-actions">
          <Link to="/product" className="btn btn-primary">Explore Platform</Link>
          <Link to="/how-it-works" className="btn btn-secondary">How It Works</Link>
        </div>
      </section>

      <section className="workflow-section animate-fade-in delay-200">
        <h2 className="section-title">The Intelligence Loop</h2>
        <div className="bento-grid">
          
          <div className="bento-card glass-panel col-span-8">
            <div className="bento-icon">
              <Activity size={24} />
            </div>
            <h3>1. Deep Biometric Integration</h3>
            <p>Connect your WHOOP and advanced biometric hand scanners to pull continuous heart rate variability, sleep patterns, and recovery metrics in real time. We analyze your baseline automatically.</p>
          </div>

          <div className="bento-card glass-panel col-span-4">
            <div className="bento-icon">
              <Zap size={24} />
            </div>
            <h3>2. AI Insights</h3>
            <p>Our machine learning engine predicts micro-nutrient deficiencies before they become illnesses, analyzing millions of data points to find your exact vitamin needs.</p>
          </div>

          <div className="bento-card glass-panel col-span-4">
            <div className="bento-icon">
              <ShieldCheck size={24} />
            </div>
            <h3>3. Clinical Review</h3>
            <p>Automated is great, but verified is better. Certified clinical professionals verify every AI recommendation before it reaches your dashboard.</p>
          </div>

          <div className="bento-card glass-panel col-span-8">
            <div className="bento-icon">
              <TrendingUp size={24} />
            </div>
            <h3>4. Tailored Action</h3>
            <p>Receive dynamically adjusting supplement formulations designed exclusively for your biometric profile. As your body changes, so does your formulation, optimizing your long-term health trajectory.</p>
          </div>
          
        </div>
      </section>
    </div>
  );
}
