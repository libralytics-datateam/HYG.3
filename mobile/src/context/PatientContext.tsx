import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchBiometricSummary,
  fetchCheckInHistory,
  fetchLatestCheckIn,
  fetchLatestRecommendation,
  fetchPatient,
  fetchWearableStatus,
} from '../api/endpoints';
import { getPatientId, getPatientName, setPatientId as persistPatientId, setPatientName as persistPatientName } from '../api/client';
import type {
  BiometricMetricSummary,
  CheckInHistoryPoint,
  CheckInLatest,
  PatientProfile,
  Recommendation,
  WearableStatus,
} from '../api/types';

// Real streak: consecutive days (ending today or yesterday, so a day still
// "counts" before the user has checked in yet today) with at least one
// self-report check-in — derived from GET /checkins/:id/history, not a
// fabricated counter. The design's streak concept ("new thinking" per
// chats/chat1.md) still needs to mean something real.
function computeStreak(history: CheckInHistoryPoint[]): number {
  if (history.length === 0) return 0;
  const days = new Set(history.map((h) => new Date(h.recordedAt).toDateString()));
  let streak = 0;
  const cursor = new Date();
  // If today has no check-in yet, start counting from yesterday so the
  // streak doesn't drop to 0 the moment the clock rolls past midnight.
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

interface PatientContextValue {
  patientId: string | null;
  patientName: string | null;
  profile: PatientProfile | null;
  recommendation: Recommendation | null;
  checkinLatest: CheckInLatest | null;
  checkinHistory: CheckInHistoryPoint[];
  wearableStatus: WearableStatus | null;
  biometrics: BiometricMetricSummary[];
  streak: number;
  checkedInToday: boolean;
  loading: boolean;
  bootstrapped: boolean;
  pendingIntent: 'scan' | 'profile' | null;
  setPendingIntent: (intent: 'scan' | 'profile' | null) => void;
  signIn: (id: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshRecommendation: () => Promise<void>;
  refreshCheckins: () => Promise<void>;
  refreshWearable: () => Promise<void>;
}

const PatientContext = createContext<PatientContextValue | null>(null);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patientId, setPatientIdState] = useState<string | null>(null);
  const [patientName, setPatientNameState] = useState<string | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [checkinLatest, setCheckinLatest] = useState<CheckInLatest | null>(null);
  const [checkinHistory, setCheckinHistory] = useState<CheckInHistoryPoint[]>([]);
  const [wearableStatus, setWearableStatus] = useState<WearableStatus | null>(null);
  const [biometrics, setBiometrics] = useState<BiometricMetricSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<'scan' | 'profile' | null>(null);

  const refreshRecommendation = useCallback(async () => {
    const id = await getPatientId();
    if (!id) return;
    setRecommendation(await fetchLatestRecommendation(id));
  }, []);

  const refreshCheckins = useCallback(async () => {
    const id = await getPatientId();
    if (!id) return;
    const [latest, history] = await Promise.all([fetchLatestCheckIn(id), fetchCheckInHistory(id)]);
    setCheckinLatest(latest);
    setCheckinHistory(history);
  }, []);

  const refreshWearable = useCallback(async () => {
    const id = await getPatientId();
    if (!id) return;
    const [status, summary] = await Promise.all([fetchWearableStatus(id), fetchBiometricSummary(id)]);
    setWearableStatus(status);
    setBiometrics(summary);
  }, []);

  const refreshAll = useCallback(async () => {
    const id = await getPatientId();
    if (!id) return;
    setLoading(true);
    try {
      const [patient, rec, latestCheckin, history, wearable, biosummary] = await Promise.all([
        fetchPatient(id),
        fetchLatestRecommendation(id),
        fetchLatestCheckIn(id),
        fetchCheckInHistory(id),
        fetchWearableStatus(id),
        fetchBiometricSummary(id),
      ]);
      setProfile(patient);
      setRecommendation(rec);
      setCheckinLatest(latestCheckin);
      setCheckinHistory(history);
      setWearableStatus(wearable);
      setBiometrics(biosummary);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(
    async (id: string, name: string) => {
      await persistPatientId(id);
      await persistPatientName(name);
      setPatientIdState(id);
      setPatientNameState(name);
      await refreshAll();
    },
    [refreshAll],
  );

  const signOut = useCallback(async () => {
    await persistPatientId(null);
    await persistPatientName(null);
    setPatientIdState(null);
    setPatientNameState(null);
    setProfile(null);
    setRecommendation(null);
    setCheckinLatest(null);
    setCheckinHistory([]);
    setWearableStatus(null);
    setBiometrics([]);
  }, []);

  useEffect(() => {
    (async () => {
      const [id, name] = await Promise.all([getPatientId(), getPatientName()]);
      setPatientIdState(id);
      setPatientNameState(name);
      if (id) await refreshAll();
      setBootstrapped(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streak = useMemo(() => computeStreak(checkinHistory), [checkinHistory]);
  const checkedInToday = useMemo(
    () => (checkinLatest ? new Date(checkinLatest.recordedAt).toDateString() === new Date().toDateString() : false),
    [checkinLatest],
  );

  const value: PatientContextValue = {
    patientId,
    patientName,
    profile,
    recommendation,
    checkinLatest,
    checkinHistory,
    wearableStatus,
    biometrics,
    streak,
    checkedInToday,
    loading,
    bootstrapped,
    pendingIntent,
    setPendingIntent,
    signIn,
    signOut,
    refreshAll,
    refreshRecommendation,
    refreshCheckins,
    refreshWearable,
  };

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatient(): PatientContextValue {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used within a PatientProvider');
  return ctx;
}
