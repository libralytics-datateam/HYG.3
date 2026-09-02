// Same 'en-GB' day/month formatting used throughout the web portal
// (e.g. src/pages/Client/ClientDashboard.tsx) so dates read the same way
// across surfaces regardless of device locale.
export function formatShortDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function formatWeekday(date: Date = new Date()): string {
  return date.toLocaleDateString('en-GB', { weekday: 'long' });
}

export function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatShortDate(dateStr);
}

export function daysSince(dateStr: string): number {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((now.getTime() - start.getTime()) / 86_400_000) + 1);
}

export function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}
