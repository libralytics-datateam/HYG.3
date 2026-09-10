import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Sunrise, Moon, Pill, UtensilsCrossed, Stethoscope, RefreshCw } from 'lucide-react';
import InsightLabel from '../../components/InsightLabel';
import './TodaysPlan.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

type Slot = 'morning' | 'evening';

interface Step {
  kind: 'meal' | 'supplement';
  label: string;
  detail: string;
}

// "Today's Plan" detail (spec §2). Morning / Evening tabs, each a numbered
// sequence of steps. Every step is built from the real recommendation —
// meal-plan slots and the pharmacist-reviewed supplement list with their
// actual dosage strings. No AM/PM split is invented on individual
// supplements: they sit under Morning with an explicit "follow the label /
// your pharmacist for timing" caption rather than a fabricated schedule.
// No paywall — all steps are visible.
export default function TodaysPlan() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patientId = localStorage.getItem('hyg3_patient_id');

  const [rec, setRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<Slot>('morning');

  useEffect(() => {
    if (!patientId) { navigate('/client/onboard'); return; }
    fetch(`${API_URL}/recommendations/${patientId}/latest`)
      .then((r) => r.json())
      .then((json) => setRec(json.success ? json.data : null))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [patientId, navigate]);

  const mp = rec?.mealPlan || {};
  const vitamins: any[] = rec?.vitamins || [];

  const morning: Step[] = [
    mp.breakfast && { kind: 'meal' as const, label: t('todaysPlan.breakfast'), detail: mp.breakfast },
    ...vitamins.map((v) => ({ kind: 'supplement' as const, label: v.name, detail: v.dosage || t('todaysPlan.asDirected') })),
    mp.lunch && { kind: 'meal' as const, label: t('todaysPlan.lunch'), detail: mp.lunch },
  ].filter(Boolean) as Step[];

  const evening: Step[] = [
    mp.dinner && { kind: 'meal' as const, label: t('todaysPlan.dinner'), detail: mp.dinner },
    mp.snack && { kind: 'meal' as const, label: t('todaysPlan.snack'), detail: mp.snack },
  ].filter(Boolean) as Step[];

  const steps = slot === 'morning' ? morning : evening;
  const hasAny = morning.length > 0 || evening.length > 0;

  if (loading) return <div className="p-8 text-center text-muted">{t('common.loading')}</div>;

  return (
    <div className="plan-page">
      <Link to="/client/dashboard" className="plan-back"><ArrowLeft size={16} /> {t('todaysPlan.back')}</Link>

      <div className="plan-hero">
        <h1 className="text-2xl font-bold text-text">{t('todaysPlan.title')}</h1>
        <p className="text-muted text-sm">{t('todaysPlan.subtitle')}</p>
      </div>

      {!rec || !hasAny ? (
        <div className="empty-state glass-panel">
          <div className="empty-icon flex justify-center"><RefreshCw size={36} className="text-teal" /></div>
          <p className="text-muted text-sm mt-3" style={{ textAlign: 'center', maxWidth: 320 }}>{t('todaysPlan.noPlan')}</p>
          <Link to="/client/scan" className="btn btn-primary mt-5">{t('todaysPlan.startScan')}</Link>
        </div>
      ) : (
        <>
          <div className="plan-tabs" role="tablist">
            <button role="tab" aria-selected={slot === 'morning'} className={`plan-tab${slot === 'morning' ? ' is-active' : ''}`} onClick={() => setSlot('morning')}>
              <Sunrise size={16} /> {t('todaysPlan.morning')}
            </button>
            <button role="tab" aria-selected={slot === 'evening'} className={`plan-tab${slot === 'evening' ? ' is-active' : ''}`} onClick={() => setSlot('evening')}>
              <Moon size={16} /> {t('todaysPlan.evening')}
            </button>
          </div>

          {steps.length === 0 ? (
            <p className="plan-empty-slot text-muted">{t('todaysPlan.nothingThisSlot')}</p>
          ) : (
            <ol className="plan-steps">
              {steps.map((s, i) => (
                <li key={i} className="plan-step glass-panel">
                  <span className="plan-step-num">{t('todaysPlan.step', { n: i + 1 })}</span>
                  <div className="plan-step-body">
                    <div className="plan-step-head">
                      <span className={`plan-step-icon plan-step-icon-${s.kind}`}>
                        {s.kind === 'meal' ? <UtensilsCrossed size={15} /> : <Pill size={15} />}
                      </span>
                      <span className="plan-step-label">{s.label}</span>
                    </div>
                    <p className="plan-step-detail">{s.detail}</p>
                    {s.kind === 'supplement' && (
                      <p className="plan-step-timing">{t('todaysPlan.timingNote')}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {slot === 'morning' && vitamins.length > 0 && (
            <div className="plan-supp-note">
              <div className="flex items-center gap-2">
                <Stethoscope size={14} className="shrink-0 text-teal" />
                <InsightLabel kind="recommendation" />
              </div>
              <p>{t('todaysPlan.supplementReviewNote')}</p>
              <Link to="/client/care?from=nutrition" className="plan-talk-link">{t('todaysPlan.talkToPharmacist')}</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
