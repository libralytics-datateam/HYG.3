import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Stethoscope, Video, ShieldCheck, Clock, Calendar, CheckCircle2,
  ArrowLeft, MessageSquare,
} from 'lucide-react';
import ErrorBanner from '../../components/ErrorBanner';
import { timeAgo } from '../../lib/timeAgo';
import './CareActions.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

interface Session {
  status: string;
  requestedAt: string;
  scheduledAt: string | null;
  note: string | null;
}

// Care Actions — the persistent human-in-the-loop surface (spec §4). Reachable
// from any Tier B+ report or product recommendation, never buried in settings.
// Two routes to a person:
//   - "Talk to a Pharmacist": an async / scheduled consult inside HYG.3. Lands
//     in the same pharmacist review queue every other insight type uses
//     (server/routes/telemedicine.ts, source: 'care_actions').
//   - "Book a Telemedicine Consult": a handoff to an external licensed
//     provider. Still logged here as an auditable request first — the audit
//     record (recommendation -> reviewer -> decision -> outcome) is written by
//     the same request-review pipeline — so nothing leaves HYG.3 untracked.
export default function CareActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const patientId = localStorage.getItem('hyg3_patient_id');
  const fromReport = params.get('from'); // e.g. a report/category slug, surfaced in the request reason for the reviewer

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'pharmacist' | 'telemedicine' | null>(null);
  const [done, setDone] = useState<'pharmacist' | 'telemedicine' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientId) {
      navigate('/client/onboard');
      return;
    }
    fetch(`${API_URL}/telemedicine/alerts?patientId=${patientId}`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setSession(json.data.session); })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [patientId]);

  const request = async (kind: 'pharmacist' | 'telemedicine') => {
    setSubmitting(kind);
    setError('');
    const reason = kind === 'pharmacist'
      ? t('careActions.pharmacistReason', { context: fromReport || t('careActions.contextGeneral') })
      : t('careActions.telemedicineReason', { context: fromReport || t('careActions.contextGeneral') });
    try {
      const res = await fetch(`${API_URL}/telemedicine/request-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, source: 'care_actions', reason }),
      });
      const json = await res.json();
      if (json.success) {
        setDone(kind);
        // Reflect the just-created request without a round-trip.
        setSession({ status: 'requested', requestedAt: new Date().toISOString(), scheduledAt: null, note: null });
      } else {
        setError(json.error || t('careActions.requestFailed'));
      }
    } catch (err) {
      console.error(err);
      setError(t('careActions.requestFailed'));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="care-actions-page">
      <Link to="/client/dashboard" className="care-back">
        <ArrowLeft size={16} /> {t('careActions.back')}
      </Link>

      <div className="care-hero">
        <div className="care-hero-icon"><Stethoscope size={24} /></div>
        <h1 className="text-2xl font-bold text-text">{t('careActions.title')}</h1>
        <p className="text-muted text-sm">{t('careActions.subtitle')}</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {!loading && session && (
        <div className="glass-panel care-session-status">
          {session.status === 'scheduled' && session.scheduledAt ? (
            <><Calendar size={18} className="text-teal shrink-0" />
              <span>{t('careActions.statusScheduled', {
                date: new Date(session.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
              })}</span></>
          ) : (
            <><Clock size={18} className="text-gold shrink-0" />
              <span>{t('careActions.statusPending', { time: timeAgo(session.requestedAt) })}</span></>
          )}
        </div>
      )}

      <div className="care-options">
        {/* Async / scheduled pharmacist consult */}
        <div className="glass-panel care-option">
          <div className="care-option-head">
            <div className="care-option-icon care-option-icon-teal"><MessageSquare size={20} /></div>
            <div>
              <h2 className="care-option-title">{t('careActions.pharmacistTitle')}</h2>
              <span className="care-option-tag">{t('careActions.pharmacistTag')}</span>
            </div>
          </div>
          <p className="care-option-body">{t('careActions.pharmacistBody')}</p>
          <button
            className="btn btn-primary care-option-cta"
            disabled={submitting !== null || done === 'pharmacist'}
            onClick={() => request('pharmacist')}
          >
            {done === 'pharmacist'
              ? <><CheckCircle2 size={16} /> {t('careActions.requestSent')}</>
              : submitting === 'pharmacist' ? t('careActions.sending') : t('careActions.pharmacistCta')}
          </button>
        </div>

        {/* External licensed-provider telemedicine handoff */}
        <div className="glass-panel care-option">
          <div className="care-option-head">
            <div className="care-option-icon care-option-icon-gold"><Video size={20} /></div>
            <div>
              <h2 className="care-option-title">{t('careActions.telemedicineTitle')}</h2>
              <span className="care-option-tag">{t('careActions.telemedicineTag')}</span>
            </div>
          </div>
          <p className="care-option-body">{t('careActions.telemedicineBody')}</p>
          <button
            className="btn btn-secondary care-option-cta"
            disabled={submitting !== null || done === 'telemedicine'}
            onClick={() => request('telemedicine')}
          >
            {done === 'telemedicine'
              ? <><CheckCircle2 size={16} /> {t('careActions.requestSent')}</>
              : submitting === 'telemedicine' ? t('careActions.sending') : t('careActions.telemedicineCta')}
          </button>
        </div>
      </div>

      <div className="care-audit-note">
        <ShieldCheck size={14} className="shrink-0" />
        {t('careActions.auditNote')}
      </div>
    </div>
  );
}
