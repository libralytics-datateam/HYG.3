import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, RefreshCw, Activity, TrendingUp, Apple, Pill, Salad, Clock, Hand, Stethoscope, ScanLine, Watch, Layers, Sunrise, CloudSun, Moon } from 'lucide-react';
import WhoopConnectCard from '../../components/WhoopConnectCard';
import './ClientDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patientId = localStorage.getItem('hyg3_patient_id');
  const patientName = localStorage.getItem('hyg3_patient_name');

  const [rec, setRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      navigate('/client/onboard');
      return;
    }
    fetchLatest();
  }, [patientId]);

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/recommendations/${patientId}/latest`);
      const json = await res.json();
      if (json.success) setRec(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sourceLabel = (s: string) => {
    if (s === 'hand_scan') return { icon: ScanLine, text: t('clientDashboard.sourceHandScan') };
    if (s === 'device') return { icon: Watch, text: t('clientDashboard.sourceDevice') };
    return { icon: Layers, text: t('clientDashboard.sourceCombined') };
  };

  const deficiencyColor = (conf: number) =>
    conf >= 0.75 ? '#f87171' : conf >= 0.55 ? 'var(--gold)' : 'var(--teal)';

  return (
    <div className="client-dashboard animate-fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {patientName ? t('clientDashboard.greeting', { name: patientName.split(' ')[0] }) : t('clientDashboard.titleFallback')}
          </h1>
          <p className="text-muted text-sm mt-1">{t('clientDashboard.subtitle')}</p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/client/scan" className="btn btn-primary flex items-center gap-2">
            <Camera size={18} />
            {t('clientDashboard.scanHand')}
          </Link>
        </div>
      </div>

      {patientId && <WhoopConnectCard patientId={patientId} />}

      {loading ? (
        <div className="empty-state glass-panel">
          <RefreshCw className="animate-spin text-teal" size={36} />
          <p className="text-muted">{t('clientDashboard.loadingReport')}</p>
        </div>
      ) : !rec ? (
        /* No scan yet */
        <div className="empty-state glass-panel animate-fade-in">
          <div className="empty-icon flex justify-center"><Hand size={40} className="text-teal" /></div>
          <h2 className="text-xl font-bold text-text mt-4">{t('clientDashboard.noAnalysisTitle')}</h2>
          <p className="text-muted text-sm mt-2" style={{ maxWidth: 340, textAlign: 'center' }}>
            {t('clientDashboard.noAnalysisBody')}
          </p>
          <Link to="/client/scan" className="btn btn-primary mt-6 flex items-center gap-2">
            <Camera size={18} /> {t('clientDashboard.startHandScan')}
          </Link>
        </div>
      ) : (
        <div className="report-content">
          {/* Meta */}
          <div className="report-meta">
            <span className="source-badge flex items-center gap-1">
              {(() => { const { icon: SrcIcon, text } = sourceLabel(rec.source); return <><SrcIcon size={12} /> {text}</>; })()}
            </span>
            <span className="report-date">
              <Clock size={12} />
              {new Date(rec.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Detected Deficiencies — top priority */}
          {rec.deficiencies?.length > 0 && (
            <section className="report-card glass-panel">
              <h2 className="report-card-title">
                <Activity size={18} className="text-gold" />
                {t('clientDashboard.detectedGaps')}
              </h2>
              <div className="deficiency-list">
                {rec.deficiencies.map((d: any, i: number) => (
                  <div key={i} className="deficiency-row">
                    <div className="deficiency-info">
                      <span className="deficiency-name">{d.nutrient}</span>
                      <span className="deficiency-reason">{d.reason}</span>
                    </div>
                    <div className="deficiency-bar-wrap">
                      <div className="deficiency-track">
                        <div
                          className="deficiency-fill-bar"
                          style={{
                            width: `${d.confidence * 100}%`,
                            background: deficiencyColor(d.confidence),
                          }}
                        />
                      </div>
                      <span className="deficiency-pct" style={{ color: deficiencyColor(d.confidence) }}>
                        {Math.round(d.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Foods + Fruits side by side */}
          <div className="two-col">
            {rec.foods?.length > 0 && (
              <section className="report-card glass-panel">
                <h2 className="report-card-title">
                  <Salad size={18} className="text-teal" />
                  {t('clientDashboard.foodsToEat')}
                </h2>
                <div className="food-scroll">
                  {rec.foods.map((f: any, i: number) => (
                    <div key={i} className="food-pill">
                      <Salad size={22} className="food-pill-emoji text-teal" />
                      <div>
                        <div className="food-pill-name">{f.name}</div>
                        <div className="food-pill-benefit">{f.benefit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {rec.fruits?.length > 0 && (
              <section className="report-card glass-panel">
                <h2 className="report-card-title">
                  <Apple size={18} className="text-teal" />
                  {t('clientDashboard.fruitsToInclude')}
                </h2>
                <div className="food-scroll">
                  {rec.fruits.map((f: any, i: number) => (
                    <div key={i} className="food-pill">
                      <Apple size={22} className="food-pill-emoji text-teal" />
                      <div>
                        <div className="food-pill-name">{f.name}</div>
                        <div className="food-pill-benefit">{f.benefit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Vitamins */}
          {rec.vitamins?.length > 0 && (
            <section className="report-card glass-panel">
              <h2 className="report-card-title">
                <Pill size={18} className="text-teal" />
                {t('clientDashboard.supplementProtocol')}
              </h2>
              <div className="vitamin-list">
                {rec.vitamins.map((v: any, i: number) => (
                  <div key={i} className="vitamin-row">
                    <div className="vitamin-dot" />
                    <div className="vitamin-info">
                      <div className="vitamin-top">
                        <span className="vitamin-name">{v.name}</span>
                        <span className="vitamin-dose">{v.dosage}</span>
                      </div>
                      <p className="vitamin-reason">{v.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Meal Plan */}
          {rec.mealPlan && (
            <section className="report-card glass-panel">
              <h2 className="report-card-title">
                <TrendingUp size={18} className="text-teal" />
                {t('clientDashboard.mealPlan')}
              </h2>
              <div className="meal-grid">
                {[
                  { key: 'breakfast', label: t('clientDashboard.breakfast'), icon: Sunrise },
                  { key: 'lunch', label: t('clientDashboard.lunch'), icon: CloudSun },
                  { key: 'dinner', label: t('clientDashboard.dinner'), icon: Moon },
                  { key: 'snack', label: t('clientDashboard.snack'), icon: Apple },
                ].map(({ key, label, icon: Icon }) => rec.mealPlan[key] && (
                  <div key={key} className="meal-slot">
                    <span className="meal-slot-label flex items-center gap-2"><Icon size={14} className="text-muted" /> {label}</span>
                    <p className="meal-slot-text">{rec.mealPlan[key]}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Disclaimer */}
          <div className="disclaimer flex items-center gap-2">
            <Stethoscope size={16} style={{ flexShrink: 0 }} /> {rec.disclaimer}
          </div>

          {/* Scan again CTA */}
          <div className="scan-again">
            <Link to="/client/scan" className="btn btn-secondary flex items-center gap-2">
              <Camera size={16} /> {t('clientDashboard.scanAgainCta')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
