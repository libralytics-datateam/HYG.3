import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function WearableCallback() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const status = params.get('status');

  const content = {
    success: { icon: CheckCircle2, color: 'var(--teal)', text: t('wearables.callbackSuccess') },
    denied: { icon: XCircle, color: '#f87171', text: t('wearables.callbackDenied') },
    not_configured: { icon: AlertTriangle, color: 'var(--gold)', text: t('wearables.comingSoon') },
    error: { icon: XCircle, color: '#f87171', text: t('wearables.callbackError') },
  }[status || 'error'] || { icon: XCircle, color: '#f87171', text: t('wearables.callbackError') };

  const Icon = content.icon;

  return (
    <div className="glass-panel p-8 text-center animate-fade-in" style={{ maxWidth: 480, margin: '48px auto' }}>
      <div className="flex justify-center mb-4">
        <Icon size={40} color={content.color} />
      </div>
      <p className="text-text" style={{ marginBottom: 24 }}>{content.text}</p>
      <Link to="/client/dashboard" className="btn btn-primary flex items-center gap-2" style={{ width: 'fit-content', margin: '0 auto' }}>
        <ArrowLeft size={16} /> {t('wearables.backToDashboard')}
      </Link>
    </div>
  );
}
