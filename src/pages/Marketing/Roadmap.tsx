import type { ReactNode } from 'react';
import { Activity, HeartPulse, Radar, UserCheck, Dna, ShieldAlert, Stethoscope } from 'lucide-react';
import './Roadmap.css';

interface Stage {
  eyebrow: string;
  title: string;
  status: 'shipped' | 'vision' | 'gated';
  statusLabel: string;
  icon: ReactNode;
  body: string;
  note?: string;
}

const STAGES: Stage[] = [
  {
    eyebrow: 'Today',
    title: 'Vitamin & Supplement Intelligence',
    status: 'shipped',
    statusLabel: 'Shipped',
    icon: <Activity size={20} />,
    body: 'AI-assisted sales trend detection, catalog data quality, and hand-scan-informed nutrition guidance — reviewed by a pharmacist before anything reaches a client. This is the platform you can use today.',
  },
  {
    eyebrow: 'Next',
    title: 'Lifespan & Preventive Tracking',
    status: 'vision',
    statusLabel: 'Vision',
    icon: <HeartPulse size={20} />,
    body: 'Moving from a point-in-time wellness snapshot to continuous, longevity-oriented monitoring — tracking biomarker trends over years, not single visits, so early drift gets caught before it becomes a diagnosis.',
  },
  {
    eyebrow: 'Then',
    title: 'Cancer Detection Signals',
    status: 'gated',
    statusLabel: 'Vision — FDA-gated',
    icon: <Radar size={20} />,
    body: 'Early-warning screening signals surfaced from biometric and lab trends — never a diagnosis, always a prompt to see a specialist sooner. This is medical-device territory, and we treat it that way from day one.',
    note: 'Requires FDA / Thai FDA medical device certification and clinical validation before any signal reaches a patient. Not a committed feature — a direction we are building toward responsibly.',
  },
  {
    eyebrow: 'Then',
    title: 'Personalized Healthcare',
    status: 'vision',
    statusLabel: 'Vision',
    icon: <UserCheck size={20} />,
    body: 'Guidance that extends beyond supplements — nutrition, activity, and recovery recommendations tailored to your own data, not population averages, still reviewed by a licensed professional before you see it.',
  },
  {
    eyebrow: 'Then',
    title: 'Microbiome Intelligence',
    status: 'vision',
    statusLabel: 'Vision',
    icon: <Dna size={20} />,
    body: 'Gut microbiome data joins biometrics and hand-scan signals as another input for personalized recommendations — one more data source, under the same human-review standard as everything else on this page.',
  },
];

const statusClass: Record<Stage['status'], string> = {
  shipped: 'shipped',
  vision: 'vision',
  gated: 'gated',
};

export default function Roadmap() {
  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in">
        <h1 className="hero-title">Where We're <span className="text-teal">Headed</span></h1>
        <p className="hero-subtitle">
          From vitamin intelligence today toward a medical-grade preventive health platform — built one
          clinically-reviewed, regulator-approved step at a time.
        </p>
      </section>

      <section className="workflow-section animate-fade-in delay-200">
        <div className="roadmap-timeline">
          {STAGES.map((stage, i) => (
            <div key={stage.title} className={`roadmap-stage ${stage.status === 'shipped' ? 'is-shipped' : ''}`}>
              <div className="roadmap-stage-rail">
                <div className="roadmap-stage-dot">{stage.icon}</div>
                {i < STAGES.length - 1 && <div className="roadmap-stage-line" />}
              </div>
              <div className="roadmap-stage-card glass-panel p-6">
                <div className="roadmap-stage-eyebrow">{stage.eyebrow}</div>
                <div className="roadmap-stage-header">
                  <h3 className="text-xl font-bold text-text">{stage.title}</h3>
                  <span className={`roadmap-status-badge ${statusClass[stage.status]}`}>{stage.statusLabel}</span>
                </div>
                <p className="text-muted leading-relaxed">{stage.body}</p>
                {stage.note && (
                  <p className="text-xs text-muted mt-3" style={{ borderLeft: '2px solid var(--border)', paddingLeft: '12px' }}>
                    {stage.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="roadmap-callout glass-panel">
          <ShieldAlert className="text-gold" size={28} style={{ flexShrink: 0 }} />
          <div>
            <h3 className="text-lg font-bold text-text mb-2 flex items-center gap-2">
              <Stethoscope size={18} className="text-teal" /> A Human Specialist Is Always in the Loop
            </h3>
            <p className="text-muted leading-relaxed">
              Every stage of this roadmap follows the same rule that governs the platform today: AI surfaces
              signals, a licensed physician or specialist reviews them, and nothing clinically meaningful reaches
              a patient without that review — structured like telemedicine, but preventive instead of reactive.
              Anything that detects or screens for a specific condition, cancer above all, is medical-device
              territory, and requires FDA (and Thai FDA) certification and clinical validation before it ships.
              This page describes intent and direction, not a committed release date.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
