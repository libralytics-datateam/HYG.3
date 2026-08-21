import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in" style={{ paddingBottom: '40px' }}>
        <h1 className="hero-title">Free During <span className="text-teal">Beta</span></h1>
        <p className="hero-subtitle">
          Join our early access program and experience the future of personalized wellness intelligence at no cost.
        </p>
      </section>

      <section className="workflow-section animate-fade-in delay-200" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '0' }}>
        <div className="bento-card glass-panel flex flex-col justify-between" style={{ border: '1px solid var(--teal)' }}>
          <div>
            <div className="inline-block bg-teal text-bg text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">Beta Access</div>
            <h3 className="text-2xl font-bold mb-2">Pioneer Plan</h3>
            <p className="text-muted mb-6">Full access to our hand scanning and biometric analysis features.</p>
            <div className="text-4xl font-bold text-teal mb-6">$0<span className="text-lg text-muted font-normal">/mo</span></div>
            
            <ul className="flex flex-col gap-3 mb-8">
              <li className="flex gap-2 items-center"><CheckCircle2 size={18} className="text-teal" /> Unlimited Hand Scans</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={18} className="text-teal" /> Personalized Nutrition Intelligence</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={18} className="text-teal" /> Custom Meal Plans</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={18} className="text-teal" /> Wearable Data Integration (Coming Soon)</li>
            </ul>
          </div>
          <Link to="/client/onboard" className="btn btn-primary w-full">Get Started Free</Link>
        </div>
      </section>
    </div>
  );
}
