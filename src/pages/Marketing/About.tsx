import { Users } from 'lucide-react';

export default function About() {
  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in">
        <h1 className="hero-title">About <span className="text-teal">Libralytics</span></h1>
        <p className="hero-subtitle">
          Pioneering the shift from reactive symptom treatment to proactive, data-driven wellness optimization.
        </p>
      </section>

      <section className="workflow-section animate-fade-in delay-200">
        <div className="bento-grid">
          <div className="bento-card glass-panel col-span-12">
            <div className="bento-icon mb-4">
              <Users size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-text">Our Mission</h2>
            <p className="text-muted leading-relaxed mb-6">
              Founded at the intersection of data science and clinical nutrition, Libralytics Co., Ltd. was built on a simple premise: the human body generates millions of data points every day, yet we still prescribe supplements based on population averages.
            </p>
            <p className="text-muted leading-relaxed">
              We believe that true wellness requires precision. By leveraging wearable biometric data and advanced Machine Learning models, HYG.3 provides clinical-grade, dynamically adjusting vitamin concepts tailored exactly to what your body needs today.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
