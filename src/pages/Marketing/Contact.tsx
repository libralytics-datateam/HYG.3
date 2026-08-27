import { useState } from 'react';
import { Mail, MapPin, Loader2, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in">
        <h1 className="hero-title">Get in <span className="text-gold">Touch</span></h1>
        <p className="hero-subtitle">
          Pharmacy or wellness business exploring a pilot? Question about our clinical integrations or API? We're here to help.
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
            {status === 'sent' ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle2 className="text-teal" size={40} />
                <p className="text-text font-bold">Message sent — we'll get back to you soon.</p>
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-muted">Name</label>
                  <input
                    type="text"
                    required
                    className="p-3 rounded bg-bg border border-border text-text outline-none focus:border-gold transition-colors"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-muted">Email</label>
                  <input
                    type="email"
                    required
                    className="p-3 rounded bg-bg border border-border text-text outline-none focus:border-gold transition-colors"
                    placeholder="Your email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-muted">Message</label>
                  <textarea
                    rows={4}
                    required
                    className="p-3 rounded bg-bg border border-border text-text outline-none focus:border-gold transition-colors"
                    placeholder="How can we help?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  ></textarea>
                </div>
                {status === 'error' && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>Something went wrong — please try again.</p>
                )}
                <button type="submit" className="btn btn-primary mt-2 flex items-center justify-center gap-2" disabled={status === 'submitting'}>
                  {status === 'submitting' && <Loader2 size={18} className="animate-spin" />}
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
