import { Mail, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in">
        <h1 className="hero-title">Get in <span className="text-gold">Touch</span></h1>
        <p className="hero-subtitle">
          Have questions about our clinical integrations or API? We're here to help.
        </p>
      </section>

      <section className="workflow-section animate-fade-in delay-200">
        <div className="bento-grid">
          
          <div className="bento-card glass-panel col-span-6">
            <h2 className="text-2xl font-bold mb-6 text-text">Contact Information</h2>
            
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 items-start">
                <Mail className="text-gold" size={24} />
                <div>
                  <h4 className="font-bold text-text">Email</h4>
                  <p className="text-muted">support@libralytics.com</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <MapPin className="text-gold" size={24} />
                <div>
                  <h4 className="font-bold text-text">Headquarters</h4>
                  <p className="text-muted">Libralytics Co., Ltd.<br/>123 Health Tech Ave<br/>Innovation District, CA 94103</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bento-card glass-panel col-span-6">
            <h2 className="text-2xl font-bold mb-6 text-text">Send a Message</h2>
            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-muted">Name</label>
                <input type="text" className="p-3 rounded bg-bg border border-border text-text outline-none focus:border-gold transition-colors" placeholder="Your name" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-muted">Email</label>
                <input type="email" className="p-3 rounded bg-bg border border-border text-text outline-none focus:border-gold transition-colors" placeholder="Your email" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-muted">Message</label>
                <textarea rows={4} className="p-3 rounded bg-bg border border-border text-text outline-none focus:border-gold transition-colors" placeholder="How can we help?"></textarea>
              </div>
              <button type="submit" className="btn btn-primary mt-2">Send Message</button>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
