import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Watch, RefreshCw, CheckCircle2, Unlink, Clock } from 'lucide-react';
import ErrorBanner from './ErrorBanner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

interface Status {
  whoopConfigured: boolean;
  connected: boolean;
  lastSyncedAt: string | null;
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
      <div className="glass-panel p-4 mb-6 flex items-center gap-3">
        <RefreshCw className="animate-spin text-teal" size={18} />
        <span className="text-muted text-sm">{t('wearables.checkingStatus')}</span>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="glass-panel p-4 mb-6">
      {error && <ErrorBanner message={error} />}

      <div className="flex items-center gap-3 mb-2">
        <Watch size={20} className="text-teal" style={{ flexShrink: 0 }} />
        <div className="flex-1">
          <div className="font-bold text-text text-sm">{t('wearables.title')}</div>
          {!status.whoopConfigured ? (
            <p className="text-muted text-xs mt-0.5">{t('wearables.comingSoon')}</p>
          ) : status.connected ? (
            <p className="text-teal text-xs mt-0.5 flex items-center gap-1">
              <CheckCircle2 size={12} /> {t('wearables.connected')}
              {status.lastSyncedAt && (
                <span className="text-muted flex items-center gap-1" style={{ marginLeft: 6 }}>
                  <Clock size={12} />
                  {t('wearables.lastSynced', { date: new Date(status.lastSyncedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) })}
                </span>
              )}
            </p>
          ) : (
            <p className="text-muted text-xs mt-0.5">{t('wearables.notConnected')}</p>
          )}
        </div>

        {status.whoopConfigured && status.connected && (
          <div className="flex gap-2">
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={handleSync} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} style={{ marginRight: 4 }} />
              {syncing ? t('wearables.syncing') : t('wearables.syncNow')}
            </button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={handleDisconnect}>
              <Unlink size={14} style={{ marginRight: 4 }} />
              {t('wearables.disconnect')}
            </button>
          </div>
        )}
      </div>

      {status.whoopConfigured && !status.connected && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <label className="flex items-start gap-2" style={{ fontSize: 13 }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2 }} />
            <span className="text-muted">{t('wearables.consentText')}</span>
          </label>
          <a
            href={consent ? `${API_URL}/wearables/whoop/connect?patientId=${patientId}` : undefined}
            aria-disabled={!consent}
            className="btn btn-primary mt-3 flex items-center gap-2"
            style={{ width: 'fit-content', opacity: consent ? 1 : 0.5, pointerEvents: consent ? 'auto' : 'none' }}
          >
            <Watch size={16} /> {t('wearables.connectButton')}
          </a>
        </div>
      )}
    </div>
  );
}
