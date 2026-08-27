import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, User, Heart, Leaf, ChevronRight, ChevronLeft, Check, Camera, Watch, Zap, ShieldCheck, Moon, Sparkles, Scale, Wind, Brain, CheckCircle2, LayoutDashboard } from 'lucide-react';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './Onboarding.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

const HEALTH_GOALS = [
  { id: 'energy', icon: Zap },
  { id: 'immunity', icon: ShieldCheck },
  { id: 'sleep', icon: Moon },
  { id: 'skin', icon: Sparkles },
  { id: 'weight', icon: Scale },
  { id: 'stress', icon: Wind },
  { id: 'digestion', icon: Leaf },
  { id: 'focus', icon: Brain },
];

const DIETARY = [
  { id: 'vegan' },
  { id: 'vegetarian' },
  { id: 'gluten_free' },
  { id: 'dairy_free' },
  { id: 'none' },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [whoopConfigured, setWhoopConfigured] = useState(false);

  useEffect(() => {
    // Only offer "Connect WHOOP" as a step-3 option if this deployment
    // actually has WHOOP credentials configured — no point promising a
    // button that just leads to a "coming soon" state.
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then((json) => setWhoopConfigured(!!json.whoopConfigured))
      .catch(() => setWhoopConfigured(false));
  }, []);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    healthGoals: [] as string[],
    dietaryRestrictions: [] as string[],
    pdpaConsent: false,
  });

  const toggleGoal = (id: string) => {
    setForm(f => ({
      ...f,
      healthGoals: f.healthGoals.includes(id)
        ? f.healthGoals.filter(g => g !== id)
        : [...f.healthGoals, id]
    }));
  };

  const toggleDietary = (id: string) => {
    setForm(f => ({
      ...f,
      dietaryRestrictions: f.dietaryRestrictions.includes(id)
        ? f.dietaryRestrictions.filter(d => d !== id)
        : [...f.dietaryRestrictions, id]
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          heightCm: Number(form.heightCm),
          weightKg: Number(form.weightKg),
        }),
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem('hyg3_patient_id', json.data.patientId);
        localStorage.setItem('hyg3_patient_name', json.data.name);
        setStep(3);
      } else if (res.status === 409) {
        // Already registered — store their ID and continue
        localStorage.setItem('hyg3_patient_id', json.patientId);
        setStep(3);
      } else {
        setError(json.error || t('onboarding.registrationFailed'));
      }
    } catch (err) {
      setError(t('onboarding.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const step1Valid = form.firstName && form.lastName && form.email && form.age && form.gender;
  const step2Valid = form.healthGoals.length > 0 && form.pdpaConsent;

  return (
    <div className="onboarding-page">
      {/* Background glow */}
      <div className="onboarding-glow" />

      <div className="onboarding-container animate-fade-in">
        {/* Logo */}
        <div className="onboarding-logo">
          <div className="flex items-center gap-2">
            <Activity size={32} className="text-teal" />
            <span className="text-2xl font-bold text-text tracking-widest">HYG.3</span>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Progress */}
        {step < 3 && (
          <div className="onboarding-progress">
            {[1, 2].map(s => (
              <div key={s} className={`progress-step ${step >= s ? 'active' : ''}`}>
                {step > s ? <Check size={14} /> : s}
              </div>
            ))}
            <div className={`progress-line ${step >= 2 ? 'active' : ''}`} />
          </div>
        )}

        {/* STEP 1 — Personal Info */}
        {step === 1 && (
          <div className="onboarding-card glass-panel animate-fade-in">
            <div className="onboarding-card-header">
              <User size={28} className="text-teal" />
              <div>
                <h1 className="text-2xl font-bold text-text">{t('onboarding.step1Title')}</h1>
                <p className="text-muted text-sm mt-1">{t('onboarding.step1Subtitle')}</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>{t('onboarding.firstName')}</label>
                <input
                  type="text"
                  placeholder="e.g. Nara"
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('onboarding.lastName')}</label>
                <input
                  type="text"
                  placeholder="e.g. Thanakit"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <div className="form-group form-group--full">
                <label>{t('onboarding.email')}</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('onboarding.age')}</label>
                <input
                  type="number"
                  placeholder="e.g. 32"
                  min="16"
                  max="100"
                  value={form.age}
                  onChange={e => setForm({ ...form, age: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('onboarding.gender')}</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="">{t('onboarding.genderSelect')}</option>
                  <option value="female">{t('onboarding.genderFemale')}</option>
                  <option value="male">{t('onboarding.genderMale')}</option>
                  <option value="other">{t('onboarding.genderOther')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('onboarding.height')}</label>
                <input
                  type="number"
                  placeholder="e.g. 165"
                  value={form.heightCm}
                  onChange={e => setForm({ ...form, heightCm: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('onboarding.weight')}</label>
                <input
                  type="number"
                  placeholder="e.g. 58"
                  value={form.weightKg}
                  onChange={e => setForm({ ...form, weightKg: e.target.value })}
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-full"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              {t('onboarding.continue')} <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2 — Health Goals & Diet */}
        {step === 2 && (
          <div className="onboarding-card glass-panel animate-fade-in">
            <div className="onboarding-card-header">
              <Heart size={28} className="text-teal" />
              <div>
                <h1 className="text-2xl font-bold text-text">{t('onboarding.step2Title')}</h1>
                <p className="text-muted text-sm mt-1">{t('onboarding.step2Subtitle')}</p>
              </div>
            </div>

            <div className="goals-grid">
              {HEALTH_GOALS.map(g => (
                <button
                  key={g.id}
                  className={`goal-chip ${form.healthGoals.includes(g.id) ? 'selected' : ''}`}
                  onClick={() => toggleGoal(g.id)}
                >
                  <g.icon size={20} className="text-teal" />
                  <span>{t(`onboarding.goals.${g.id}`)}</span>
                  {form.healthGoals.includes(g.id) && <Check size={14} className="goal-check" />}
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="flex items-center gap-2"><Leaf size={16} className="text-teal" /> {t('onboarding.dietaryPreferences')}</label>
              <div className="dietary-chips">
                {DIETARY.map(d => (
                  <button
                    key={d.id}
                    className={`dietary-chip ${form.dietaryRestrictions.includes(d.id) ? 'selected' : ''}`}
                    onClick={() => toggleDietary(d.id)}
                  >
                    {t(`onboarding.dietary.${d.id}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* PDPA consent — required, not a pre-checked or implied checkbox.
                Placeholder wording pending real Thai PDPA legal review
                (MVP-LAUNCH-CHECKLIST.md §6 / decisions.md) — do not treat
                this copy as legally sufficient on its own. */}
            <label className="consent-checkbox mt-5">
              <input
                type="checkbox"
                checked={form.pdpaConsent}
                onChange={(e) => setForm({ ...form, pdpaConsent: e.target.checked })}
              />
              <span>
                {t('onboarding.consentText')}{' '}
                <Link to="/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                  {t('onboarding.consentPrivacyLink')}
                </Link>
                .
              </span>
            </label>

            {error && <p className="error-text">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                <ChevronLeft size={18} /> {t('onboarding.back')}
              </button>
              <button
                className="btn btn-primary flex-1"
                disabled={!step2Valid || submitting}
                onClick={handleSubmit}
              >
                {submitting ? t('onboarding.creatingProfile') : <>{t('onboarding.completeSetup')} <ChevronRight size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Start */}
        {step === 3 && (
          <div className="onboarding-card glass-panel animate-fade-in text-center">
            <div className="success-icon"><CheckCircle2 size={56} className="text-teal" /></div>
            <h1 className="text-2xl font-bold text-text mt-4">{t('onboarding.step3Title')}</h1>
            <p className="text-muted text-sm mt-2 mb-8">
              {t('onboarding.step3Subtitle')}
            </p>

            <div className="start-options">
              <button
                className="start-option glass-panel"
                onClick={() => navigate('/client/scan')}
              >
                <Camera size={32} className="text-teal mb-3" />
                <strong className="text-text">{t('onboarding.scanHand')}</strong>
                <p className="text-muted text-xs mt-1">
                  {t('onboarding.scanHandDesc')}
                </p>
              </button>

              {whoopConfigured && (
                <button
                  className="start-option glass-panel"
                  onClick={() => navigate('/client/dashboard')}
                >
                  <Watch size={32} className="text-gold mb-3" />
                  <strong className="text-text">{t('onboarding.connectWearable')}</strong>
                  <p className="text-muted text-xs mt-1">
                    {t('onboarding.connectWearableDesc')}
                  </p>
                </button>
              )}

              <button
                className={whoopConfigured ? 'start-option start-option-wide glass-panel' : 'start-option glass-panel'}
                onClick={() => navigate('/client/dashboard')}
              >
                <LayoutDashboard size={whoopConfigured ? 20 : 32} className={whoopConfigured ? 'text-teal' : 'text-teal mb-3'} />
                {whoopConfigured ? (
                  <span className="text-text text-sm font-bold">{t('onboarding.viewDashboard')}</span>
                ) : (
                  <>
                    <strong className="text-text">{t('onboarding.viewDashboard')}</strong>
                    <p className="text-muted text-xs mt-1">{t('onboarding.viewDashboardDesc')}</p>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <p className="onboarding-footer-text">
          {t('onboarding.footerText')}
        </p>
      </div>
    </div>
  );
}
