import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Watch, RefreshCw, CheckCircle2, Unlink, Clock, Hourglass } from 'lucide-react';
import ErrorBanner from './ErrorBanner';
import './WhoopConnectCard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

interface Status {
  whoopConfigured: boolean;
  connected: boolean;
  lastSyncedAt: string | null;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function WhoopConnectCard({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = () => {
    setLoading(true);
    fetch(`${API_URL}/wearables/status?patientId=${patientId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStatus(json.data);
        else setError(json.error || t('wearables.loadFailed'));
      })
      .catch((err) => {
        console.error(err);
        setError(t('wearables.loadFailed'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
    // Re-check status after coming back from the WHOOP OAuth redirect.
    const onFocus = () => fetchStatus();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [patientId]);

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/wearables/whoop/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      });
      const json = await res.json();
      if (json.success) {
        fetchStatus();
      } else {
        setError(json.error || t('wearables.syncFailed'));
      }
    } catch (err) {
      console.error(err);
      setError(t('wearables.syncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`${API_URL}/wearables/whoop?patientId=${patientId}`, { method: 'DELETE' });
      fetchStatus();
    } catch (err) {
      console.error(err);
      setError(t('wearables.disconnectFailed'));
    }
  };

  if (loading) {
    return (
      <div className="glass-panel wearable-card-loading">
        <RefreshCw className="animate-spin text-teal" size={18} />
        <span className="text-muted text-sm">{t('wearables.checkingStatus')}</span>
      </div>
    );
  }

  if (!status) return null;

  const isPending = !status.whoopConfigured;

  return (
    <div className="glass-panel wearable-card">
      {error && <ErrorBanner message={error} />}

      <div className="wearable-card-header">
        <div className={`wearable-icon-badge${isPending ? ' is-pending' : ''}`}>
          {isPending ? <Hourglass size={18} /> : <Watch size={18} />}
        </div>

        <div className="wearable-card-body">
          <div className="wearable-card-title">{t('wearables.title')}</div>
          <div className="wearable-status-row">
            {isPending ? (
              <span className="wearable-status-badge is-pending">{t('wearables.comingSoon')}</span>
            ) : status.connected ? (
              <>
                <span className="wearable-status-badge is-connected">
                  <CheckCircle2 size={13} /> {t('wearables.connected')}
                </span>
                {status.lastSyncedAt && (
                  <span className="wearable-last-synced">
                    <Clock size={12} />
                    {t('wearables.lastSynced', { date: timeAgo(status.lastSyncedAt) })}
                  </span>
                )}
              </>
            ) : (
              <span className="wearable-status-badge is-idle">{t('wearables.notConnected')}</span>
            )}
          </div>
        </div>

        {status.whoopConfigured && status.connected && (
          <div className="wearable-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? t('wearables.syncing') : t('wearables.syncNow')}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleDisconnect}>
              <Unlink size={13} />
              {t('wearables.disconnect')}
            </button>
          </div>
        )}
      </div>

      {status.whoopConfigured && !status.connected && (
        <div className="wearable-consent">
          <label className="consent-checkbox">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{t('wearables.consentText')}</span>
          </label>
          <a
            href={consent ? `${API_URL}/wearables/whoop/connect?patientId=${patientId}` : undefined}
            aria-disabled={!consent}
            className="btn btn-primary flex items-center gap-2 wearable-connect-btn"
          >
            <Watch size={16} /> {t('wearables.connectButton')}
          </a>
        </div>
      )}
    </div>
  );
}
