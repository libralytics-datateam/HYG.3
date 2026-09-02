import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// There is no per-dose adherence endpoint in the API this ports (server has
// only a single per-check-in `adherence` field — server/routes/checkins.ts).
// The design's tappable per-dose tracking ("Today's protocol", the
// supplement-plan day grid) is explicitly new UI built on top of the real
// vitamins list (chats/chat1.md: "Adherence became tappable" / "new
// thinking"). It's kept real by persisting locally per patient rather than
// faking static data, but it does not sync to any server — only this
// device's tap history feeds it.
function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function storageKey(patientId: string): string {
  return `hyg3_doses_v1_${patientId}`;
}

type DoseLog = Record<string, string[]>; // dateKey -> vitamin names marked taken that day

async function readLog(patientId: string): Promise<DoseLog> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(patientId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeLog(patientId: string, log: DoseLog): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(patientId), JSON.stringify(log));
  } catch {
    // best-effort — local habit tracking only, never blocks the UI
  }
}

export function useDoseTracker(patientId: string | null) {
  const [log, setLog] = useState<DoseLog>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    readLog(patientId).then((l) => {
      setLog(l);
      setLoaded(true);
    });
  }, [patientId]);

  const todayKey = dateKey(new Date());
  const todayTaken = log[todayKey] ?? [];

  const toggle = useCallback(
    (vitaminName: string) => {
      if (!patientId) return;
      setLog((prev) => {
        const today = prev[todayKey] ?? [];
        const nextToday = today.includes(vitaminName) ? today.filter((n) => n !== vitaminName) : [...today, vitaminName];
        const next = { ...prev, [todayKey]: nextToday };
        writeLog(patientId, next);
        return next;
      });
    },
    [patientId, todayKey],
  );

  const weekGrid = useCallback(
    (vitaminName: string): { label: string; taken: boolean; isFuture: boolean }[] => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun..6=Sat
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);

      const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      return labels.map((label, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = dateKey(d);
        const isFuture = d.getTime() > now.getTime() && key !== todayKey;
        return { label, taken: (log[key] ?? []).includes(vitaminName), isFuture };
      });
    },
    [log, todayKey],
  );

  // Rough monthly adherence across all tracked vitamins, for the plan
  // screen's summary line. Only counts days since the log actually has
  // entries, so an empty history doesn't read as 0%.
  const monthlyAdherencePct = useCallback(
    (vitaminNames: string[]): number | null => {
      const keys = Object.keys(log).filter((k) => {
        const d = new Date(k);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      if (keys.length === 0 || vitaminNames.length === 0) return null;
      let taken = 0;
      let total = 0;
      for (const k of keys) {
        for (const name of vitaminNames) {
          total += 1;
          if ((log[k] ?? []).includes(name)) taken += 1;
        }
      }
      return total === 0 ? null : Math.round((taken / total) * 100);
    },
    [log],
  );

  return { loaded, todayTaken, toggle, weekGrid, monthlyAdherencePct };
}
