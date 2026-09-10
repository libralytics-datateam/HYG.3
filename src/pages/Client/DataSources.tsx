import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plug, Check, RefreshCw, X, ShieldCheck, ArrowLeft, Cloud, Upload, Link2, AlertCircle,
} from 'lucide-react';
import ErrorBanner from '../../components/ErrorBanner';
import { timeAgo } from '../../lib/timeAgo';
import './DataSources.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

interface ConsentScope { dataTypes: string[]; purpose: string; retention: string; }
interface Consent { granted: boolean; grantedAt: string; revokedAt: string | null; }
interface Source {
  id: string;
  displayName: string;
  dataTypes: string[];
  syncMode: 'cloud' | 'direct' | 'manual-import';
  bespokeAuth: boolean;
  consentScope: ConsentScope;
  configured: boolean;
  connected: boolean;
  consent: Consent | null;
  lastSyncedAt: string | null;
}

const SYNC_ICON = { cloud: Cloud, direct: Link2, 'manual-import': Upload } as const;

// Profile → Connected Data Sources (spec feature 8). One list, backed by the
// server-side ProviderConnector registry (GET /v1/wearables/sources). Consent
// is shown in full and explicitly agreed before each source connects, and is
// revoked independently on disconnect — connecting one source never implies
// consent for another (hard gate d).
export default function DataSources() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patientId = localStorage.getItem('hyg3_patient_id');

  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const [apiKey, setApiKey] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/wearables/sources?patientId=${patientId}`);
      const json = await res.json();
      if (json.success) setSources(json.data.sources);
      else setError(json.error || t('dataSources.loadFailed'));
    } catch (err) {
      console.error(err);
      setError(t('dataSources.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [patientId, t]);

  useEffect(() => {
    if (!patientId) { navigate('/client/onboard'); return; }
    load();
  }, [patientId, load, navigate]);

  const connectBespoke = (id: string) => {
    window.location.href = `${API_URL}/wearables/${id}/connect?patientId=${patientId}`;
  };

  const connectGeneric = async (id: string) => {
    setBusy(id); setError('');
    try {
      const res = await fetch(`${API_URL}/wearables/connectors/${id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, credential: apiKey[id] || '' }),
      });
      const json = await res.json();
      if (json.success) { setExpanded(null); await load(); }
      else setError(json.error || t('dataSources.connectFailed'));
    } catch (err) {
      console.error(err);
      setError(t('dataSources.connectFailed'));
    } finally {
      setBusy(null);
    }
  };

  const sync = async (s: Source) => {
    setBusy(s.id); setError('');
    const path = s.bespokeAuth ? `${API_URL}/wearables/${s.id}/sync` : `${API_URL}/wearables/connectors/${s.id}/sync`;
    try {
      const res = await fetch(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId }),
      });
      const json = await res.json();
      if (!json.success) setError(json.error || t('dataSources.syncFailed'));
      await load();
    } catch (err) {
      console.error(err);
      setError(t('dataSources.syncFailed'));
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (s: Source) => {
    setBusy(s.id); setError('');
    const path = s.bespokeAuth
      ? `${API_URL}/wearables/${s.id}?patientId=${patientId}`
      : `${API_URL}/wearables/connectors/${s.id}?patientId=${patientId}`;
    try {
      const res = await fetch(path, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) setError(json.error || t('dataSources.disconnectFailed'));
      await load();
    } catch (err) {
      console.error(err);
      setError(t('dataSources.disconnectFailed'));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">{t('common.loading')}</div>;

  return (
    <div className="data-sources-page">
      <Link to="/client/dashboard" className="ds-back"><ArrowLeft size={16} /> {t('dataSources.back')}</Link>

      <div className="ds-hero">
        <div className="ds-hero-icon"><Plug size={24} /></div>
        <h1 className="text-2xl font-bold text-text">{t('dataSources.title')}</h1>
        <p className="text-muted text-sm">{t('dataSources.subtitle')}</p>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="ds-list">
        {sources.map((s) => {
          const SyncIcon = SYNC_ICON[s.syncMode];
          const isOpen = expanded === s.id;
          return (
            <div key={s.id} className={`glass-panel ds-card${s.connected ? ' is-connected' : ''}`}>
              <div className="ds-card-head">
                <div className="ds-card-title-wrap">
                  <h2 className="ds-card-title">{s.displayName}</h2>
                  <span className="ds-mode"><SyncIcon size={12} /> {t(`dataSources.mode.${s.syncMode}`)}</span>
                </div>
                {s.connected ? (
                  <span className="ds-status ds-status-on"><Check size={13} /> {t('dataSources.connected')}</span>
                ) : s.configured ? (
                  <span className="ds-status ds-status-off">{t('dataSources.notConnected')}</span>
                ) : (
                  <span className="ds-status ds-status-na"><AlertCircle size={13} /> {t('dataSources.unavailable')}</span>
                )}
              </div>

              <div className="ds-datatypes">
                {s.dataTypes.map((d) => <span key={d} className="ds-chip">{d}</span>)}
              </div>

              {s.connected && s.consent?.granted && (
                <div className="ds-consent-granted">
                  <ShieldCheck size={13} className="shrink-0" />
                  {t('dataSources.consentGranted', { date: new Date(s.consent.grantedAt).toLocaleDateString() })}
                  {s.lastSyncedAt && <> · {t('dataSources.lastSynced', { time: timeAgo(s.lastSyncedAt) })}</>}
                </div>
              )}

              {/* Connect flow — consent scope shown in full, agreed explicitly, before connecting. */}
              {!s.connected && s.configured && (
                <div className="ds-connect">
                  {!isOpen ? (
                    <button className="btn btn-secondary" onClick={() => { setExpanded(s.id); setError(''); }}>
                      {t('dataSources.reviewAndConnect')}
                    </button>
                  ) : (
                    <div className="ds-consent-box">
                      <p className="ds-consent-label">{t('dataSources.consentHeading', { name: s.displayName })}</p>
                      <dl className="ds-consent-dl">
                        <dt>{t('dataSources.whatData')}</dt>
                        <dd>{s.consentScope.dataTypes.join(', ')}</dd>
                        <dt>{t('dataSources.whatFor')}</dt>
                        <dd>{s.consentScope.purpose}</dd>
                        <dt>{t('dataSources.howLong')}</dt>
                        <dd>{s.consentScope.retention}</dd>
                      </dl>

                      {!s.bespokeAuth && (
                        <label className="ds-field">
                          <span>{t('dataSources.apiKeyLabel', { name: s.displayName })}</span>
                          <input
                            type="password"
                            autoComplete="off"
                            value={apiKey[s.id] || ''}
                            onChange={(e) => setApiKey((m) => ({ ...m, [s.id]: e.target.value }))}
                            placeholder={t('dataSources.apiKeyPlaceholder')}
                          />
                        </label>
                      )}

                      <label className="ds-agree">
                        <input
                          type="checkbox"
                          checked={!!agreed[s.id]}
                          onChange={(e) => setAgreed((m) => ({ ...m, [s.id]: e.target.checked }))}
                        />
                        <span>{t('dataSources.consentCheckbox', { name: s.displayName })}</span>
                      </label>

                      <div className="ds-connect-actions">
                        <button className="btn btn-ghost" onClick={() => setExpanded(null)}>{t('dataSources.cancel')}</button>
                        <button
                          className="btn btn-primary"
                          disabled={!agreed[s.id] || busy === s.id || (!s.bespokeAuth && !(apiKey[s.id] || '').trim())}
                          onClick={() => (s.bespokeAuth ? connectBespoke(s.id) : connectGeneric(s.id))}
                        >
                          {busy === s.id ? t('dataSources.connecting') : t('dataSources.connect')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {s.connected && (
                <div className="ds-connected-actions">
                  <button className="btn btn-secondary flex items-center gap-2" disabled={busy === s.id} onClick={() => sync(s)}>
                    <RefreshCw size={14} className={busy === s.id ? 'animate-spin' : ''} /> {t('dataSources.syncNow')}
                  </button>
                  <button className="btn btn-ghost ds-disconnect flex items-center gap-2" disabled={busy === s.id} onClick={() => disconnect(s)}>
                    <X size={14} /> {t('dataSources.disconnect')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="ds-foot">{t('dataSources.footNote')}</p>
    </div>
  );
}
