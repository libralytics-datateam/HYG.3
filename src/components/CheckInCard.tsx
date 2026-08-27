import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import Sparkline from './Sparkline';
import './CheckInCard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function CheckInCard({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [history, setHistory] = useState<{ value: number; recordedAt: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/checkins/${patientId}/latest`).then((r) => r.json()),
      fetch(`${API_URL}/checkins/${patientId}/history`).then((r) => r.json()),
    ])
      .then(([latestJson, historyJson]) => {
        if (latestJson.success && latestJson.data) setLastCheckIn(latestJson.data.recordedAt);
        if (historyJson.success) setHistory(historyJson.data.history);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [patientId]);

  if (!loaded) return null;

  return (
    <div className="glass-panel checkin-status-card">
      <div className="checkin-status-icon">
        <Calendar size={18} />
      </div>
      <div className="checkin-status-body">
        <div className="checkin-status-title">{t('checkIn.cardTitle')}</div>
        <div className="checkin-status-sub">
          {lastCheckIn ? t('checkIn.lastCheckIn', { date: timeAgo(lastCheckIn) }) : t('checkIn.noCheckInYet')}
        </div>
      </div>
      {history.length >= 2 && (
        <div className="checkin-status-sparkline">
          <Sparkline history={history} width={90} height={28} />
        </div>
      )}
      <Link to="/client/checkin" className="btn btn-primary btn-sm">
        {t('checkIn.cardCta')}
      </Link>
    </div>
  );
}
