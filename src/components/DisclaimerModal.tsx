import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Stethoscope, ArrowRight } from 'lucide-react';
import './DisclaimerModal.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

// Two-step first-view disclaimer, shown once per report category before a
// patient sees its first Tier B+ (supplement-specific) report — matches the
// spec's §3 requirement and the reference app's two-screen disclaimer gate.
// The difference from the reference: our step-2 primary action routes toward
// the human-in-the-loop ("Talk to a Pharmacist"), because that's a
// structural requirement here, not a legal footnote.
//
// Either exit records an auditable acknowledgement server-side
// (POST /v1/telemedicine/disclaimer-ack) before the report is revealed.
export default function DisclaimerModal({
  patientId,
  category = 'nutrition',
  onDone,
}: {
  patientId: string;
  category?: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  const recordAck = async () => {
    try {
      await fetch(`${API_URL}/telemedicine/disclaimer-ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, category }),
      });
    } catch (err) {
      // A failed ack POST shouldn't trap the patient behind the modal —
      // localStorage carries the "seen" state as a fallback so it won't
      // re-block on the next load even if the server write didn't land.
      console.error(err);
    }
    try {
      localStorage.setItem(`hyg3_disclaimer_${category}`, '1');
    } catch { /* private mode etc. */ }
  };

  const finish = async (dest: 'care' | 'reports') => {
    setSubmitting(true);
    await recordAck();
    onDone();
    if (dest === 'care') navigate('/client/care');
  };

  return (
    <div className="disclaimer-overlay" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      <div className="disclaimer-card">
        <div className="disclaimer-steps-dots">
          <span className={step === 1 ? 'is-active' : 'is-done'} />
          <span className={step === 2 ? 'is-active' : ''} />
        </div>

        {step === 1 ? (
          <>
            <div className="disclaimer-icon"><ShieldAlert size={26} /></div>
            <h2 id="disclaimer-title" className="disclaimer-title">{t('disclaimerModal.step1Title')}</h2>
            <p className="disclaimer-body">{t('disclaimerModal.step1Body')}</p>
            <p className="disclaimer-warn">{t('disclaimerModal.step1Warning')}</p>
            <div className="disclaimer-actions">
              <button className="btn btn-primary flex items-center gap-2" onClick={() => setStep(2)}>
                {t('disclaimerModal.next')} <ArrowRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="disclaimer-icon"><Stethoscope size={26} /></div>
            <h2 className="disclaimer-title">{t('disclaimerModal.step2Title')}</h2>
            <p className="disclaimer-body">{t('disclaimerModal.step2Body')}</p>
            <div className="disclaimer-actions disclaimer-actions-col">
              <button
                className="btn btn-primary flex items-center justify-center gap-2"
                disabled={submitting}
                onClick={() => finish('care')}
              >
                <Stethoscope size={16} /> {t('disclaimerModal.talkToPharmacist')}
              </button>
              <button className="btn btn-secondary" disabled={submitting} onClick={() => finish('reports')}>
                {t('disclaimerModal.backToReports')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
