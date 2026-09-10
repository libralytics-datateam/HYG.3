import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, Zap, ShieldCheck, TrendingUp, ArrowRight, Clock, Sparkles } from 'lucide-react';
import './Home.css';

/* ---------------------------------------------------------------------------
   Editorial "wellness journal" landing page. Visual language borrowed from
   the face-care reference app — warm neutrals, rounded art cards, category
   chips, serif display headings, a light meta row — but kept in HYG.3's own
   identity: clinical teal + trust green, sand/cream ground, one amber accent.
   All imagery is generated inline SVG spot art (brand-palette gradients +
   one motif each), so there are no stock photos, external requests, or
   licensing questions on a real health-company page.
--------------------------------------------------------------------------- */

function PulseArt() {
  return (
    <svg className="mag-art-svg" viewBox="0 0 480 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="pulseG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0C6478" />
          <stop offset="0.55" stopColor="#0E7C6A" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#pulseG)" />
      <g opacity="0.14" fill="#fff">
        {Array.from({ length: 60 }).map((_, i) => (
          <circle key={i} cx={(i * 53) % 480} cy={(i * 89) % 360} r={i % 7 === 0 ? 2.6 : 1.3} />
        ))}
      </g>
      <path
        d="M-10 210 L110 210 L140 210 L156 120 L180 286 L206 168 L228 210 L340 210 L364 150 L386 240 L410 210 L490 210"
        fill="none" stroke="#EAF7F3" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" opacity="0.95"
      />
      <circle cx="180" cy="286" r="6" fill="#F4B23C" />
    </svg>
  );
}

function LeafArt() {
  return (
    <svg className="mag-art-svg" viewBox="0 0 480 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3EBDC" />
          <stop offset="1" stopColor="#D9E4D2" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#leafG)" />
      <path d="M240 305 C240 200 280 120 372 78 C372 190 330 275 240 305 Z" fill="#3E7C57" opacity="0.9" />
      <path d="M240 305 C240 210 205 140 118 100 C118 205 158 278 240 305 Z" fill="#6BA583" opacity="0.85" />
      <line x1="240" y1="316" x2="240" y2="150" stroke="#2F5C41" strokeWidth="4" strokeLinecap="round" />
      <circle cx="372" cy="78" r="16" fill="#F4B23C" opacity="0.9" />
    </svg>
  );
}

function WaveArt() {
  return (
    <svg className="mag-art-svg" viewBox="0 0 480 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="waveG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0C6478" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#waveG)" />
      {[0, 26, 52, 78].map((o, i) => (
        <path
          key={i}
          d={`M-20 ${150 + o} C 80 ${90 + o}, 160 ${210 + o}, 260 ${150 + o} S 440 ${90 + o}, 520 ${150 + o}`}
          fill="none" stroke="#EAF7F3" strokeWidth={i === 1 ? 4 : 2} opacity={0.85 - i * 0.18}
        />
      ))}
    </svg>
  );
}

function LabelArt() {
  return (
    <svg className="mag-art-svg" viewBox="0 0 480 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="labelG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3EBDC" />
          <stop offset="1" stopColor="#F6D9AE" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#labelG)" />
      <rect x="188" y="96" width="104" height="188" rx="18" fill="#0C6478" />
      <rect x="188" y="70" width="104" height="34" rx="12" fill="#084C5A" />
      <rect x="204" y="150" width="72" height="86" rx="8" fill="#EAF7F3" />
      <line x1="216" y1="172" x2="264" y2="172" stroke="#0C6478" strokeWidth="4" strokeLinecap="round" />
      <line x1="216" y1="190" x2="264" y2="190" stroke="#0C6478" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <line x1="216" y1="208" x2="248" y2="208" stroke="#0C6478" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <circle cx="300" cy="118" r="26" fill="#047857" />
      <path d="M289 118 l8 8 l15 -16" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const { t } = useTranslation();

  const loop = [
    { icon: Activity, title: t('home.loop1Title'), body: t('home.loop1Body') },
    { icon: Zap, title: t('home.loop2Title'), body: t('home.loop2Body') },
    { icon: ShieldCheck, title: t('home.loop3Title'), body: t('home.loop3Body') },
    { icon: TrendingUp, title: t('home.loop4Title'), body: t('home.loop4Body') },
  ];

  const journal = [
    { tag: t('home.j1Tag'), title: t('home.j1Title'), body: t('home.j1Body'), min: 3, Art: LeafArt },
    { tag: t('home.j2Tag'), title: t('home.j2Title'), body: t('home.j2Body'), min: 3, Art: WaveArt },
    { tag: t('home.j3Tag'), title: t('home.j3Title'), body: t('home.j3Body'), min: 4, Art: LabelArt },
  ];

  const creds = [
    { title: t('home.c1'), body: t('home.c1Body') },
    { title: t('home.c2'), body: t('home.c2Body') },
    { title: t('home.c3'), body: t('home.c3Body') },
  ];

  return (
    <div className="mag">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mag-hero">
        <div className="mag-hero-copy animate-fade-in">
          <span className="mag-eyebrow">{t('home.eyebrow')}</span>
          <h1 className="mag-hero-title">
            {t('home.titlePrefix')} <em>{t('home.titleHighlight')}</em> {t('home.titleSuffix')}
          </h1>
          <p className="mag-hero-lede">{t('home.subtitle')}</p>
          <div className="mag-hero-actions">
            <Link to="/client/onboard" className="btn btn-primary">
              {t('home.explorePlatform')} <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </Link>
            <Link to="/how-it-works" className="btn btn-secondary">{t('home.howItWorks')}</Link>
          </div>
          <p className="mag-trustline">
            <ShieldCheck size={16} /> {t('home.trustLine')}
          </p>
        </div>

        <div className="mag-hero-art animate-fade-in delay-200">
          <PulseArt />
          <div className="mag-hero-chip">
            <span className="mag-chip-k">{t('home.heroStatLabel')}</span>
            <span className="mag-chip-v">{t('home.heroStatValue')}</span>
          </div>
        </div>
      </section>

      {/* ── The intelligence loop ────────────────────────────── */}
      <section className="mag-loop">
        <div className="mag-section-head">
          <span className="mag-eyebrow">{t('home.loopKicker')}</span>
          <h2 className="mag-section-title">{t('home.loopTitle')}</h2>
        </div>
        <ol className="mag-loop-list">
          {loop.map((step, i) => {
            const Icon = step.icon;
            return (
              <li className="mag-loop-item" key={i}>
                <span className="mag-loop-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="mag-loop-body">
                  <div className="mag-loop-icon"><Icon size={18} /></div>
                  <h3>{step.title.replace(/^\d+\.\s*/, '')}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── The Journal (wellness knowledge) ─────────────────── */}
      <section className="mag-journal">
        <div className="mag-section-head">
          <span className="mag-eyebrow">{t('home.journalKicker')}</span>
          <h2 className="mag-section-title">{t('home.journalTitle')}</h2>
          <p className="mag-section-sub">{t('home.journalSubtitle')}</p>
        </div>
        <div className="mag-journal-grid">
          {journal.map((a, i) => {
            const Art = a.Art;
            return (
              <article className="mag-card" key={i}>
                <div className="mag-card-art"><Art /></div>
                <div className="mag-card-body">
                  <span className="mag-tag">#{a.tag}</span>
                  <h3 className="mag-card-title">{a.title}</h3>
                  <p className="mag-card-text">{a.body}</p>
                  <span className="mag-readtime">
                    <Clock size={13} /> {t('home.journalReadTime', { min: a.min })}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Why HYG.3 + final CTA ────────────────────────────── */}
      <section className="mag-close">
        <span className="mag-eyebrow mag-eyebrow-light">{t('home.closeKicker')}</span>
        <div className="mag-creds">
          {creds.map((c, i) => (
            <div className="mag-cred" key={i}>
              <h4>{c.title}</h4>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
        <div className="mag-close-cta">
          <Link to="/client/onboard" className="btn btn-primary">
            <Sparkles size={16} style={{ marginRight: 8 }} /> {t('home.finalCta')}
          </Link>
          <span className="mag-close-note">{t('home.finalCtaNote')}</span>
        </div>
      </section>
    </div>
  );
}
