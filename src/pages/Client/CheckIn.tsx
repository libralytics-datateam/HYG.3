import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Frown, Meh, Smile, CheckCircle2, Check, Calendar,
  BatteryLow, Moon, Dumbbell, Bone, CloudFog, Utensils, Sparkles, ClipboardCheck,
} from 'lucide-react';
import ErrorBanner from '../../components/ErrorBanner';
import './CheckIn.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

const WELLNESS_LEVELS = [
  { value: 1, icon: Frown },
  { value: 2, icon: Frown },
  { value: 3, icon: Meh },
  { value: 4, icon: Smile },
  { value: 5, icon: Smile },
];

const SYMPTOMS = [
  { id: 'fatigue', icon: BatteryLow },
  { id: 'poor_sleep', icon: Moon },
  { id: 'muscle_weakness', icon: Dumbbell },
  { id: 'joint_pain', icon: Bone },
  { id: 'low_mood', icon: Frown },
  { id: 'poor_concentration', icon: CloudFog },
  { id: 'digestive_issues', icon: Utensils },
  { id: 'skin_issues', icon: Sparkles },
];

const ADHERENCE_OPTIONS = ['yes', 'partial', 'no'] as const;

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function CheckIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patientId = localStorage.getItem('hyg3_patient_id');

  const [checking, setChecking] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [hasRecommendation, setHasRecommendation] = useState(false);
  const [wellness, setWellness] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [adherence, setAdherence] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientId) {
      navigate('/client/onboard');
      return;
    }
    Promise.all([
      fetch(`${API_URL}/checkins/${patientId}/latest`).then((r) => r.json()),
      // Adherence ("did you follow your plan") only makes sense once a plan
      // exists — skip the question entirely rather than ask about nothing.
      fetch(`${API_URL}/recommendations/${patientId}/latest`).then((r) => r.json()).catch(() => ({ success: false })),
    ])
      .then(([checkinJson, recJson]) => {
        if (checkinJson.success && checkinJson.data && isToday(checkinJson.data.recordedAt)) {
          setAlreadyDone(true);
        }
        if (recJson.success && recJson.data) {
          setHasRecommendation(true);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [patientId]);

  const toggleSymptom = (id: string) => {
    setSymptoms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const handleSubmit = async () => {
    if (!wellness) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          wellnessScore: wellness,
          symptoms,
          ...(hasRecommendation && adherence ? { adherence } : {}),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
      } else {
        setError(json.error || t('checkIn.submitFailed'));
      }
    } catch (err) {
      console.error(err);
      setError(t('checkIn.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return <div className="p-8 text-center text-muted">{t('common.loading')}</div>;
  }

  if (submitted || alreadyDone) {
    return (
      <div className="checkin-page">
        <div className="glass-panel checkin-success animate-fade-in">
          <div className="checkin-success-icon">
            <CheckCircle2 size={48} className="text-teal" />
          </div>
          <h1 className="text-xl font-bold text-text mb-2">
            {submitted ? t('checkIn.successTitle') : t('checkIn.alreadyCheckedInTitle')}
          </h1>
          <p className="text-muted text-sm mb-6">
            {submitted ? t('checkIn.successBody') : t('checkIn.alreadyCheckedInBody')}
          </p>
          <Link to="/client/dashboard" className="btn btn-primary" style={{ width: 'fit-content', margin: '0 auto' }}>
            {t('checkIn.backToDashboard')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-page">
      <div className="glass-panel checkin-card animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={20} className="text-teal" />
          <h1 className="text-xl font-bold text-text">{t('checkIn.title')}</h1>
        </div>
        <p className="text-muted text-sm mb-6">{t('checkIn.subtitle')}</p>

        {error && <ErrorBanner message={error} />}

        <div className="checkin-section">
          <span className="checkin-question">{t('checkIn.wellnessQuestion')}</span>
          <div className="wellness-scale">
            {WELLNESS_LEVELS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                className={`wellness-option ${wellness === value ? 'selected' : ''}`}
                onClick={() => setWellness(value)}
              >
                <Icon size={22} />
                <span className="wellness-option-label">{t(`checkIn.wellness${value}`)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="checkin-section">
          <span className="checkin-question">{t('checkIn.symptomsQuestion')}</span>
          <div className="symptom-grid">
            {SYMPTOMS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                className={`symptom-chip ${symptoms.includes(id) ? 'selected' : ''}`}
                onClick={() => toggleSymptom(id)}
              >
                <Icon size={18} />
                <span>{t(`checkIn.symptoms.${id}`)}</span>
                {symptoms.includes(id) && <Check size={14} className="symptom-check" />}
              </button>
            ))}
          </div>
        </div>

        {hasRecommendation && (
          <div className="checkin-section">
            <span className="checkin-question flex items-center gap-2">
              <ClipboardCheck size={16} className="text-teal" />
              {t('checkIn.adherenceQuestion')}
            </span>
            <div className="adherence-options">
              {ADHERENCE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={`adherence-option ${adherence === opt ? 'selected' : ''}`}
                  onClick={() => setAdherence(opt)}
                >
                  {t(`checkIn.adherence${opt.charAt(0).toUpperCase()}${opt.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={!wellness || submitting}
          onClick={handleSubmit}
        >
          {submitting ? t('checkIn.submitting') : t('checkIn.submit')}
        </button>
      </div>
    </div>
  );
}
