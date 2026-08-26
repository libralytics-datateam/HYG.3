import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, Zap, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="home-container">
      <section className="hero-section animate-fade-in">
        <div className="hero-badge">
          <Sparkles size={16} /> {t('home.badge')}
        </div>
        <h1 className="hero-title">
          {t('home.titlePrefix')} <span className="text-teal">{t('home.titleHighlight')}</span> {t('home.titleSuffix')}
        </h1>
        <p className="hero-subtitle">
          {t('home.subtitle')}
        </p>
        <div className="hero-actions">
          <Link to="/product" className="btn btn-primary">{t('home.explorePlatform')}</Link>
          <Link to="/how-it-works" className="btn btn-secondary">{t('home.howItWorks')}</Link>
        </div>
      </section>

      <section className="workflow-section animate-fade-in delay-200">
        <h2 className="section-title">{t('home.loopTitle')}</h2>
        <div className="bento-grid">

          <div className="bento-card glass-panel col-span-8">
            <div className="bento-icon">
              <Activity size={24} />
            </div>
            <h3>{t('home.loop1Title')}</h3>
            <p>{t('home.loop1Body')}</p>
          </div>

          <div className="bento-card glass-panel col-span-4">
            <div className="bento-icon">
              <Zap size={24} />
            </div>
            <h3>{t('home.loop2Title')}</h3>
            <p>{t('home.loop2Body')}</p>
          </div>

          <div className="bento-card glass-panel col-span-4">
            <div className="bento-icon">
              <ShieldCheck size={24} />
            </div>
            <h3>{t('home.loop3Title')}</h3>
            <p>{t('home.loop3Body')}</p>
          </div>

          <div className="bento-card glass-panel col-span-8">
            <div className="bento-icon">
              <TrendingUp size={24} />
            </div>
            <h3>{t('home.loop4Title')}</h3>
            <p>{t('home.loop4Body')}</p>
          </div>

        </div>
      </section>
    </div>
  );
}
