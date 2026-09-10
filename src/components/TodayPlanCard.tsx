import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, ChevronRight, Sunrise, Moon } from 'lucide-react';
import './TodayPlanCard.css';

// Home "Today" card (spec §1) — a compact preview of today's plan built from
// the recommendation the patient already has. "See full plan" opens the
// Morning/Evening detail. No locked teaser / paywall (the app has no tiers).
// Renders nothing when there's no plan yet.
export default function TodayPlanCard({ rec }: { rec: any }) {
  const { t } = useTranslation();
  if (!rec) return null;

  const mp = rec.mealPlan || {};
  const suppCount = (rec.vitamins || []).length;
  const morningBits = [
    mp.breakfast && t('todayCard.breakfast'),
    suppCount > 0 && t('todayCard.supplements', { count: suppCount }),
    mp.lunch && t('todayCard.lunch'),
  ].filter(Boolean).join(' · ');
  const eveningBits = [mp.dinner && t('todayCard.dinner'), mp.snack && t('todayCard.snack')].filter(Boolean).join(' · ');

  if (!morningBits && !eveningBits) return null;

  return (
    <Link to="/client/plan" className="today-card glass-panel">
      <div className="today-card-icon"><CalendarCheck size={20} /></div>
      <div className="today-card-body">
        <span className="today-card-title">{t('todayCard.title')}</span>
        {morningBits && (
          <span className="today-card-line"><Sunrise size={13} className="shrink-0" /> {morningBits}</span>
        )}
        {eveningBits && (
          <span className="today-card-line"><Moon size={13} className="shrink-0" /> {eveningBits}</span>
        )}
        <span className="today-card-cta">{t('todayCard.seeFullPlan')} <ChevronRight size={14} /></span>
      </div>
    </Link>
  );
}
