import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Watch, Activity, RefreshCw, CheckCircle2, Unlink, Clock, Hourglass, AlertTriangle, Smartphone } from 'lucide-react';
import ErrorBanner from './ErrorBanner';
import { timeAgo } from '../lib/timeAgo';
import './WearablesPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

type ProviderKey = 'whoop' | 'fitbit';

interface ProviderStatus {
  configured: boolean;
  connected: boolean;
  lastSyncedAt: string | null;
}

interface StatusResponse {
  whoop: ProviderStatus;
  fitbit: ProviderStatus;
}

const PROVIDER_META: Record<ProviderKey, { icon: any; nameKey: string }> = {
  whoop: { icon: Watch, nameKey: 'wearables.whoopName' },
  fitbit: { icon: Activity, nameKey: 'wearables.fitbitName' },
};

function DeviceRow({
  provider,
  status,
  patientId,
  onChanged,
}: {
  provider: ProviderKey;
  status: ProviderStatus;
  patientId: string;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const meta = PROVIDER_META[provider];
  const Icon = meta.icon;
  const name = t(meta.nameKey);

  const [consent, setConsent] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);

  // A stale reauth prompt would otherwise stick around forever: needsReauth
  // used to only clear inside handleSync, so a user who reconnected via the
  // OAuth "Reconnect" link (not by clicking Sync) would still see the
  // reconnect prompt after successfully reconnecting, until they happened to
  // sync again. Clear it whenever the connection itself changes underneath.
  useEffect(() => {
    setNeedsReauth(false);
  }, [status.connected, status.lastSyncedAt]);

  const isPending = !status.configured;

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setNeedsReauth(false);
    try {
      const res = await fetch(`${API_URL}/wearables/${provider}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      });
      const json = await res.json();
      if (json.success) {
        onChanged();
      } else if (json.needsReauth) {
        setNeedsReauth(true);
        setError(json.error || t('wearables.syncFailed'));
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
      await fetch(`${API_URL}/wearables/${provider}?patientId=${patientId}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      console.error(err);
      setError(t('wearables.disconnectFailed'));
    }
  };

  return (
    <div className="device-row">
      {error && <ErrorBanner message={error} />}

      <div className="device-row-header">
        <div className={`device-icon-badge${isPending ? ' is-pending' : ''}`}>
          {isPending ? <Hourglass size={18} /> : <Icon size={18} />}
        </div>

        <div className="device-row-body">
          <div className="device-row-title">{name}</div>
          <div className="device-status-row">
            {isPending ? (
              <span className="device-status-badge is-pending">{t('wearables.comingSoon')}</span>
            ) : status.connected ? (
              <>
                <span className="device-status-badge is-connected">
                  <CheckCircle2 size={13} /> {t('wearables.connected')}
                </span>
                {status.lastSyncedAt && (
                  <span className="device-last-synced">
                    <Clock size={12} />
                    {t('wearables.lastSynced', { date: timeAgo(status.lastSyncedAt) })}
                  </span>
                )}
              </>
            ) : (
              <span className="device-status-badge is-idle">{t('wearables.notConnected')}</span>
            )}
          </div>
        </div>

        {status.configured && status.connected && (
          <div className="device-actions">
            {needsReauth ? (
              <a
                href={`${API_URL}/wearables/${provider}/connect?patientId=${patientId}`}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                <AlertTriangle size={13} /> {t('wearables.reconnect')}
              </a>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={handleSync} disabled={syncing}>
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? t('wearables.syncing') : t('wearables.syncNow')}
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={handleDisconnect}>
              <Unlink size={13} />
              {t('wearables.disconnect')}
            </button>
          </div>
        )}
      </div>

      {status.configured && !status.connected && (
        <div className="device-consent">
          <label className="consent-checkbox">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{t('wearables.consentText', { provider: name })}</span>
          </label>
          <a
            href={consent ? `${API_URL}/wearables/${provider}/connect?patientId=${patientId}` : undefined}
            aria-disabled={!consent}
            className="btn btn-primary flex items-center gap-2 device-connect-btn"
          >
            <Icon size={16} /> {t('wearables.connectButton', { provider: name })}
          </a>
        </div>
      )}
    </div>
  );
}

export default function WearablesPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
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
    // Re-check status after coming back from an OAuth redirect.
    const onFocus = () => fetchStatus();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [patientId]);

  if (loading && !status) {
    return (
      <div className="glass-panel wearable-card-loading">
        <RefreshCw className="animate-spin text-teal" size={18} />
        <span className="text-muted text-sm">{t('wearables.checkingStatus')}</span>
      </div>
    );
  }

  if (error && !status) return <ErrorBanner message={error} />;
  if (!status) return null;

  return (
    <div className="glass-panel wearables-panel">
      <h2 className="wearables-panel-title">{t('wearables.title')}</h2>
      <p className="text-muted text-sm wearables-panel-subtitle">{t('wearables.subtitle')}</p>

      <div className="device-list">
        <DeviceRow provider="whoop" status={status.whoop} patientId={patientId} onChanged={fetchStatus} />
        <DeviceRow provider="fitbit" status={status.fitbit} patientId={patientId} onChanged={fetchStatus} />

        {/* Apple Watch — deliberately not a fake "Coming Soon". There is no
            cloud API for a website to pull HealthKit data; the only real
            paths in are a native iOS companion app or a paid third-party
            aggregator (Terra/Vital/Spike), neither of which exists here.
            Shown honestly as blocked, not as "in progress". */}
        <div className="device-row">
          <div className="device-row-header">
            <div className="device-icon-badge is-blocked">
              <Smartphone size={18} />
            </div>
            <div className="device-row-body">
              <div className="device-row-title">{t('wearables.appleWatchName')}</div>
              <div className="device-status-row">
                <span className="device-status-badge is-blocked">{t('wearables.notAvailable')}</span>
              </div>
              <p className="device-blocked-note">{t('wearables.appleWatchNote')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
