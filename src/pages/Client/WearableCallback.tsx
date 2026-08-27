import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import './WearableCallback.css';

const AUTO_REDIRECT_SECONDS = 4;

export default function WearableCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const status = params.get('status');
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);

  const content = {
    success: { icon: CheckCircle2, ring: 'is-success', text: t('wearables.callbackSuccess') },
    denied: { icon: XCircle, ring: 'is-error', text: t('wearables.callbackDenied') },
    not_configured: { icon: AlertTriangle, ring: 'is-pending', text: t('wearables.comingSoon') },
    error: { icon: XCircle, ring: 'is-error', text: t('wearables.callbackError') },
  }[status || 'error'] || { icon: XCircle, ring: 'is-error', text: t('wearables.callbackError') };

  const Icon = content.icon;
  const isSuccess = status === 'success';

  // Only auto-redirect on success — an error/denied/not-configured state
  // should wait for the user to read it and choose to go back, not whisk
  // them away before they've seen what happened.
  useEffect(() => {
    if (!isSuccess) return;
    if (countdown <= 0) {
      navigate('/client/dashboard');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, navigate]);

  return (
    <div className="glass-panel wearable-callback animate-fade-in">
      <div className="wearable-callback-icon">
        <div className={`wearable-callback-icon-ring ${content.ring}`}>
          <Icon size={32} color={content.ring === 'is-success' ? 'var(--teal)' : content.ring === 'is-pending' ? 'var(--gold)' : '#f87171'} />
        </div>
      </div>
      <p className={`wearable-callback-text${isSuccess ? ' has-countdown' : ''}`}>{content.text}</p>
      {isSuccess && (
        <p className="wearable-callback-countdown">{t('wearables.redirectingIn', { seconds: countdown })}</p>
      )}
      <Link to="/client/dashboard" className="btn btn-primary flex items-center gap-2 wearable-callback-action">
        <ArrowLeft size={16} /> {t('wearables.backToDashboard')}
      </Link>
    </div>
  );
}
