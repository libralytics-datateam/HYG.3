import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePatient } from '../context/PatientContext';
import { formatShortDate, timeAgo } from '../utils/date';

export interface DerivedNotification {
  id: string;
  badge: string;
  title: string;
  body: string;
  when: string;
  unread: boolean;
  tone: 'teal' | 'warn';
}

// Unlike the design's static mock list, every entry here is derived from
// real state already loaded into PatientContext — there is no notifications
// endpoint in the API this ports, so nothing is invented that the app
// can't back up.
export function useDerivedNotifications(): DerivedNotification[] {
  const { t } = useTranslation();
  const { checkedInToday, streak, wearableStatus, recommendation } = usePatient();

  return useMemo(() => {
    const items: DerivedNotification[] = [];

    if (!checkedInToday) {
      items.push({
        id: 'checkin',
        badge: 'CI',
        title: t('mobile.notifications.checkinTitle'),
        body: t('mobile.notifications.checkinBody', { count: streak }),
        when: t('common.today', { defaultValue: 'Today' }),
        unread: true,
        tone: 'teal',
      });
    }

    if (recommendation) {
      const date = formatShortDate(recommendation.scanDate || recommendation.createdAt);
      items.push({
        id: 'scan-ready',
        badge: 'Rx',
        title: t('mobile.notifications.scanReadyTitle'),
        body: t('mobile.notifications.scanReadyBody', { date }),
        when: date,
        unread: false,
        tone: 'teal',
      });
    }

    if (wearableStatus?.connected && wearableStatus.lastSyncedAt) {
      items.push({
        id: 'wearable-sync',
        badge: 'W',
        title: t('mobile.notifications.syncedTitle', { brand: 'WHOOP' }),
        body: t('mobile.notifications.syncedBody'),
        when: timeAgo(wearableStatus.lastSyncedAt),
        unread: false,
        tone: 'teal',
      });
    }

    return items;
  }, [checkedInToday, streak, wearableStatus, recommendation, t]);
}
