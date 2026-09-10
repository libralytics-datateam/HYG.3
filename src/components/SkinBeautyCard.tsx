import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Droplets, Sun, ShieldCheck, Camera, RefreshCw, ChevronRight } from 'lucide-react';
import { timeAgo } from '../lib/timeAgo';
import './SkinBeautyCard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

interface FaceScanData {
  scanId: string;
  overallScore: number;
  hydrationScore: number;
  radianceScore: number;
  vitalityScore: number;
  textureScore: number;
  skinTypeDetected: string;
  eyeContour: {
    darkCircles?: string;
    puffiness?: string;
    observation?: string;
  };
  signals: { area: string; observation: string }[];
  skincareRituals?: {
    morning?: string[];
    evening?: string[];
    wellnessNudge?: string;
  };
  scannedAt: string;
  reviewStatus: string;
}

export default function SkinBeautyCard({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<FaceScanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    fetch(`${API_URL}/analysis/face-scan/latest?patientId=${patientId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch((err) => console.error('Error loading face scan data:', err))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div className="glass-panel skin-beauty-card animate-fade-in flex items-center justify-center p-6">
        <RefreshCw className="animate-spin text-teal" size={24} />
      </div>
    );
  }

  // If no face scan yet, show inviting teaser card
  if (!data) {
    return (
      <div className="glass-panel skin-beauty-teaser animate-fade-in">
        <div className="teaser-content">
          <div className="teaser-icon-box">
            <Sparkles size={28} className="text-gold" />
          </div>
          <div className="teaser-text">
            <h3 className="teaser-title">{t('skinBeauty.teaserTitle', 'Skin Beauty & Facial Vitality Scan')}</h3>
            <p className="teaser-desc">
              {t(
                'skinBeauty.teaserDesc',
                'Discover your skin hydration barrier, radiance score, and tailored beauty nutrition with our AI face scan.'
              )}
            </p>
          </div>
        </div>
        <Link to="/client/face-scan" className="btn btn-primary teaser-btn">
          <Camera size={16} /> {t('skinBeauty.startFaceScan', 'Scan Face')}
        </Link>
      </div>
    );
  }

  const score = data.overallScore || 75;
  const scoreColor = score >= 80 ? 'var(--teal)' : score >= 65 ? 'var(--gold)' : '#f87171';

  return (
    <div className="glass-panel skin-beauty-card animate-fade-in">
      {/* Header */}
      <div className="skin-card-header">
        <div className="skin-card-title-group">
          <div className="skin-card-icon">
            <Sparkles size={20} className="text-gold" />
          </div>
          <div>
            <h2 className="skin-card-title">{t('skinBeauty.title', 'Skin Beauty & Radiance')}</h2>
            <p className="skin-card-subtitle">
              {t('skinBeauty.lastAnalyzed', 'Last scan')} {timeAgo(data.scannedAt)} ·{' '}
              <span className="capitalize">{data.skinTypeDetected || 'Combination'}</span>
            </p>
          </div>
        </div>

        <Link to="/client/face-scan" className="skin-scan-again-btn">
          <Camera size={15} /> {t('skinBeauty.newScan', 'New Face Scan')}
        </Link>
      </div>

      {/* Main Score + Metric Meters */}
      <div className="skin-card-body">
        {/* Left: Beauty Gauge */}
        <div className="skin-gauge-col">
          <div className="skin-circle-gauge">
            <svg viewBox="0 0 76 76" className="skin-svg">
              <circle cx="38" cy="38" r="32" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="38"
                cy="38"
                r="32"
                fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeDasharray={`${(score / 100) * 201} 201`}
                strokeLinecap="round"
                transform="rotate(-90 38 38)"
              />
            </svg>
            <div className="skin-gauge-number">
              <span className="number-val">{score}</span>
              <span className="number-unit">/100</span>
            </div>
          </div>
          <span className="skin-gauge-label">{t('skinBeauty.beautyIndex', 'Beauty Index')}</span>
        </div>

        {/* Right: Key 3 Bars */}
        <div className="skin-bars-col">
          <div className="skin-bar-row">
            <div className="skin-bar-info">
              <span className="skin-bar-label flex items-center gap-1.5">
                <Droplets size={14} className="text-teal" /> {t('skinBeauty.hydration', 'Hydration Barrier')}
              </span>
              <span className="skin-bar-val text-teal">{data.hydrationScore}%</span>
            </div>
            <div className="skin-bar-track">
              <div className="skin-bar-progress bg-teal" style={{ width: `${data.hydrationScore}%` }} />
            </div>
          </div>

          <div className="skin-bar-row">
            <div className="skin-bar-info">
              <span className="skin-bar-label flex items-center gap-1.5">
                <Sun size={14} className="text-gold" /> {t('skinBeauty.radiance', 'Radiance & Glow')}
              </span>
              <span className="skin-bar-val text-gold">{data.radianceScore}%</span>
            </div>
            <div className="skin-bar-track">
              <div className="skin-bar-progress bg-gold" style={{ width: `${data.radianceScore}%` }} />
            </div>
          </div>

          <div className="skin-bar-row">
            <div className="skin-bar-info">
              <span className="skin-bar-label flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-teal" /> {t('skinBeauty.vitality', 'Elasticity & Vitality')}
              </span>
              <span className="skin-bar-val text-teal">{data.vitalityScore}%</span>
            </div>
            <div className="skin-bar-track">
              <div className="skin-bar-progress bg-teal" style={{ width: `${data.vitalityScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Daily Ritual Highlight */}
      {data.skincareRituals?.morning?.[1] && (
        <div className="skin-card-footer">
          <div className="skin-footer-tip">
            <Sparkles size={14} className="text-gold shrink-0" />
            <span>
              <strong>{t('skinBeauty.dailyFocus', 'Daily Ritual Focus')}:</strong> {data.skincareRituals.morning[1]}
            </span>
          </div>
          <Link to="/client/face-scan" className="skin-view-all-link">
            {t('skinBeauty.viewFullDetails', 'Details')} <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
