export default function Terms() {
  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
        <h1 className="hero-title">Terms of <span className="text-gold">Service</span></h1>
        <p className="text-muted mt-4">Last Updated: August 12, 2026</p>
      </section>

      <section className="workflow-section animate-fade-in delay-200">
        <div className="glass-panel p-8" style={{ width: '100%' }}>
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4 text-text">1. Acceptance of Terms</h2>
            <p className="text-muted mb-6">
              By accessing and using HYG.3, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-text">2. Not Medical Advice</h2>
            <p className="text-muted mb-6">
              The AI-generated vitamin concepts and physiological predictions provided by HYG.3 are for informational and wellness optimization purposes only. They do not constitute professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-text">3. Subscription and Billing</h2>
            <p className="text-muted mb-6">
              Services are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis (monthly or annually) depending on the type of subscription plan you select.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-text">4. Limitation of Liability</h2>
            <p className="text-muted mb-6">
              In no event shall Libralytics Co., Ltd., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the Service.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
