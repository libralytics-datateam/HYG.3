import { Settings, CreditCard, Building } from 'lucide-react';

export default function Organization() {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <Settings className="text-teal" size={32} />
            Organization Settings
          </h1>
          <p className="text-muted mt-1">Manage your clinic profile, billing, and API integrations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <Building className="text-gold" size={24} />
            <h2 className="text-xl font-bold text-text">Clinic Profile</h2>
          </div>
          
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-muted">Clinic Name</label>
              <input type="text" className="p-3 rounded bg-bg border border-border text-text outline-none focus:border-gold transition-colors" defaultValue="Libralytics Co., Ltd." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-muted">Support Email</label>
              <input type="email" className="p-3 rounded bg-bg border border-border text-text outline-none focus:border-gold transition-colors" defaultValue="support@libralytics.com" />
            </div>
            <button className="btn btn-primary mt-4 self-start">Save Changes</button>
          </form>
        </div>

        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <CreditCard className="text-teal" size={24} />
            <h2 className="text-xl font-bold text-text">Billing & Subscription</h2>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded border border-gold bg-gold/5 flex justify-between items-center">
              <div>
                <strong className="text-gold block mb-1">Enterprise Plan</strong>
                <span className="text-sm text-muted">Billed Annually ($14,000/yr)</span>
              </div>
              <button className="btn btn-secondary">Upgrade</button>
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted">
              <div className="flex justify-between border-b border-border pb-2">
                <span>Next Invoice Date</span>
                <span className="text-text font-bold">Jan 1, 2027</span>
              </div>
              <div className="flex justify-between pb-2">
                <span>Payment Method</span>
                <span className="text-text font-bold">Visa ending in **** 4242</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
