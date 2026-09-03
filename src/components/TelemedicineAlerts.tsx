import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PhoneCall, Calendar, AlertTriangle, ChevronRight } from 'lucide-react';
import './TelemedicineAlerts.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

interface Session {
  status: string;
  requestedAt: string;
  scheduledAt: string | null;
  note: string | null;
}
interface TrendAlert {
  metricType: string;
  value: number;
  threshold: number;
  unit: string;
}

// The "preventive health tracker" surface: fetched once at the top of the
// dashboard so a concerning trend or an open/upcoming session is visible
// immediately, not only if the patient happens to scroll to the health
// chart or already knows a request exists. Renders nothing at all when
// there's genuinely nothing to say — no fabricated urgency, matching every
// other "honest absence" pattern in this app.
export default function TelemedicineAlerts({ patientId, refreshKey }: { patientId: string; refreshKey?: number }) {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [trendAlerts, setTrendAlerts] = useState<TrendAlert[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/telemedicine/alerts?patientId=${patientId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setSession(json.data.session);
          setTrendAlerts(json.data.trendAlerts || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoaded(true));
  }, [patientId, refreshKey]);

  const scrollToChart = () => {
    document.getElementById('health-trends')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!loaded || (!session && trendAlerts.length === 0)) return null;

  return (
    <div className="glass-panel telemedicine-alerts">
      {session && (
        <div className="alert-row">
          {session.status === 'scheduled' ? <Calendar size={18} className="text-teal shrink-0" /> : <PhoneCall size={18} className="text-gold shrink-0" />}
          <div className="alert-row-body">
            <p className="alert-row-title">
              {session.status === 'scheduled' && session.scheduledAt
                ? t('telemedicineAlerts.sessionScheduled', {
                    date: new Date(session.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
                  })
                : t('telemedicineAlerts.sessionPending')}
            </p>
            {session.note && <p className="alert-row-note">{session.note}</p>}
          </div>
        </div>
      )}

      {trendAlerts.map((a) => (
        <button key={a.metricType} className="alert-row alert-row-clickable" onClick={scrollToChart}>
          <AlertTriangle size={18} className="text-gold shrink-0" />
          <div className="alert-row-body">
            <p className="alert-row-title">
              {t('telemedicineAlerts.trendAlert', {
                label: t(`healthChart.metric.${a.metricType}`),
                value: a.value,
                unit: a.unit,
                threshold: a.threshold,
              })}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted shrink-0" />
        </button>
      ))}
    </div>
  );
}
