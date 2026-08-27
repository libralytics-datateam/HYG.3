export default function PrivacyPolicy() {
  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
        <h1 className="hero-title">Privacy <span className="text-teal">Policy</span></h1>
        <p className="text-muted mt-4">Last Updated: August 12, 2026</p>
      </section>

      <section className="workflow-section animate-fade-in delay-200">
        <div className="glass-panel p-8" style={{ width: '100%' }}>
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4 text-text">1. Information We Collect</h2>
            <p className="text-muted mb-6">
              When you use HYG.3, we collect biometric data (such as resting heart rate, sleep duration, and recovery scores) authorized by you via third-party integrations such as WHOOP.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-text">2. How We Use Your Data</h2>
            <p className="text-muted mb-6">
              Your data is exclusively used to generate clinical vitamin formulations and predict physiological deficiencies. We use Scikit-Learn models to process this data. Your data is NEVER sold for advertising purposes.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-text">3. Data Retention</h2>
            <p className="text-muted mb-6">
              We retain your biometric logs for 12 months to provide historical trending. You may request full deletion of your account and associated PHI at any time by contacting support.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-text">4. Third-Party Sharing</h2>
            <p className="text-muted mb-6">
              Data is only shared with our partnered clinical compounding pharmacies when an active formulation is approved for physical shipment. These partners operate under strict Business Associate Agreements (BAAs).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
