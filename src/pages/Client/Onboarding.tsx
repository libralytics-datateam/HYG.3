import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, User, Heart, Leaf, ChevronRight, ChevronLeft, Check, Camera, Watch } from 'lucide-react';
import './Onboarding.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

const HEALTH_GOALS = [
  { id: 'energy', label: 'Boost Energy', emoji: '⚡' },
  { id: 'immunity', label: 'Strengthen Immunity', emoji: '🛡️' },
  { id: 'sleep', label: 'Improve Sleep', emoji: '😴' },
  { id: 'skin', label: 'Skin Health', emoji: '✨' },
  { id: 'weight', label: 'Weight Management', emoji: '⚖️' },
  { id: 'stress', label: 'Reduce Stress', emoji: '🧘' },
  { id: 'digestion', label: 'Better Digestion', emoji: '🌿' },
  { id: 'focus', label: 'Mental Focus', emoji: '🧠' },
];

const DIETARY = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'gluten_free', label: 'Gluten-Free' },
  { id: 'dairy_free', label: 'Dairy-Free' },
  { id: 'none', label: 'No restrictions' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        setError(json.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const step1Valid = form.firstName && form.lastName && form.email && form.age && form.gender;
  const step2Valid = form.healthGoals.length > 0;

  return (
    <div className="onboarding-page">
      {/* Background glow */}
      <div className="onboarding-glow" />

      <div className="onboarding-container animate-fade-in">
        {/* Logo */}
        <div className="onboarding-logo">
          <Activity size={32} className="text-teal" />
          <span className="text-2xl font-bold text-text tracking-widest">HYG.3</span>
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
                <h1 className="text-2xl font-bold text-text">Create Your Profile</h1>
                <p className="text-muted text-sm mt-1">Tell us about yourself so we can personalize your health analysis.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nara"
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Thanakit"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <div className="form-group form-group--full">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Age</label>
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
                <label>Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other / Prefer not to say</option>
                </select>
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  placeholder="e.g. 165"
                  value={form.heightCm}
                  onChange={e => setForm({ ...form, heightCm: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
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
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2 — Health Goals & Diet */}
        {step === 2 && (
          <div className="onboarding-card glass-panel animate-fade-in">
            <div className="onboarding-card-header">
              <Heart size={28} className="text-teal" />
              <div>
                <h1 className="text-2xl font-bold text-text">Your Health Goals</h1>
                <p className="text-muted text-sm mt-1">Select all that apply — this helps us tailor recommendations.</p>
              </div>
            </div>

            <div className="goals-grid">
              {HEALTH_GOALS.map(g => (
                <button
                  key={g.id}
                  className={`goal-chip ${form.healthGoals.includes(g.id) ? 'selected' : ''}`}
                  onClick={() => toggleGoal(g.id)}
                >
                  <span className="text-xl">{g.emoji}</span>
                  <span>{g.label}</span>
                  {form.healthGoals.includes(g.id) && <Check size={14} className="goal-check" />}
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="flex items-center gap-2"><Leaf size={16} className="text-teal" /> Dietary Preferences</label>
              <div className="dietary-chips">
                {DIETARY.map(d => (
                  <button
                    key={d.id}
                    className={`dietary-chip ${form.dietaryRestrictions.includes(d.id) ? 'selected' : ''}`}
                    onClick={() => toggleDietary(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                <ChevronLeft size={18} /> Back
              </button>
              <button
                className="btn btn-primary flex-1"
                disabled={!step2Valid || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Creating Profile...' : <>Complete Setup <ChevronRight size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Start */}
        {step === 3 && (
          <div className="onboarding-card glass-panel animate-fade-in text-center">
            <div className="success-icon">✅</div>
            <h1 className="text-2xl font-bold text-text mt-4">You're all set!</h1>
            <p className="text-muted text-sm mt-2 mb-8">
              Choose how you'd like to start your first health analysis.
            </p>

            <div className="start-options">
              <button
                className="start-option glass-panel"
                onClick={() => navigate('/client/scan')}
              >
                <Camera size={32} className="text-teal mb-3" />
                <strong className="text-text">Scan My Hand</strong>
                <p className="text-muted text-xs mt-1">
                  Take a photo of your hand under natural light. Our AI analyzes nail, palm and skin condition.
                </p>
              </button>

              <button
                className="start-option glass-panel"
                onClick={() => navigate('/client/dashboard')}
              >
                <Watch size={32} className="text-gold mb-3" />
                <strong className="text-text">View Dashboard</strong>
                <p className="text-muted text-xs mt-1">
                  See your wellness report, connect a wearable device, or review past analyses.
                </p>
              </button>
            </div>
          </div>
        )}

        <p className="onboarding-footer-text">
          Free during Beta · No credit card required · Your data stays yours
        </p>
      </div>
    </div>
  );
}
