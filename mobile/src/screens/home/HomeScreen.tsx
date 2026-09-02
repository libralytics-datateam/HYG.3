import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, Camera, ChevronRight, Flame, Stethoscope, Check } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { usePatient } from '../../context/PatientContext';
import { useDoseTracker } from '../../hooks/useDoseTracker';
import { useDerivedNotifications } from '../../hooks/useNotifications';
import { formatShortDate, formatWeekday, daysSince, isToday } from '../../utils/date';
import { METRIC_META, scoreColor, trendColor, trendArrow } from '../../utils/metrics';
import type { HomeStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

// Supplement timing isn't in the API (recommendations only carry name /
// dosage / reason — server/routes/handscan.ts), so the AM/PM badge on each
// dose is inferred from the dosage/reason text rather than fabricated
// outright. Falls back to Morning, the more common slot.
function inferSlot(text: string): 'Morning' | 'Evening' {
  return /evening|night|bed/i.test(text) ? 'Evening' : 'Morning';
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { patientId, patientName, profile, recommendation, checkinHistory, streak, checkedInToday, biometrics, wearableStatus, loading, refreshAll } =
    usePatient();
  const { todayTaken, toggle } = useDoseTracker(patientId);
  const notifications = useDerivedNotifications();

  const dayNumber = profile?.createdAt ? daysSince(profile.createdAt) : 1;
  const weekDots = useMemo(() => {
    const now = new Date();
    const checkinDays = new Set(checkinHistory.map((h) => new Date(h.recordedAt).toDateString()));
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return checkinDays.has(d.toDateString());
    });
  }, [checkinHistory]);

  const vitamins = recommendation?.vitamins ?? [];
  const takenCount = vitamins.filter((v) => todayTaken.includes(v.name)).length;

  const pulseMetrics = ['recovery_score', 'sleep_score', 'antioxidant_score']
    .map((key) => ({ key, m: biometrics.find((b) => b.metricType === key) }))
    .filter((x) => x.m);

  return (
    <Screen onRefresh={refreshAll} refreshing={loading}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 4 }}>
        <View>
          <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 26, color: colors.text, letterSpacing: -0.4 }}>
            {patientName ? t('clientDashboard.greeting', { name: patientName.split(' ')[0] }) : t('clientDashboard.titleFallback')}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, marginTop: 3 }}>
            {t('mobile.home.dayLabel', { weekday: formatWeekday(), day: dayNumber })}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Notifications')}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.full,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={20} color={colors.text} />
          {notifications.length > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 6,
                right: 7,
                minWidth: 17,
                height: 17,
                borderRadius: radius.full,
                backgroundColor: colors.gold,
                borderWidth: 2,
                borderColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}
            >
              <Text style={{ color: '#fff', fontFamily: fonts.headingSemibold, fontSize: 10 }}>{notifications.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Streak */}
      <View style={{ backgroundColor: colors.teal, borderRadius: radius.xl, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <View style={{ width: 58, height: 58, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Flame size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 19, color: '#fff', letterSpacing: -0.2 }}>
            {t('mobile.home.streak', { count: streak })}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>
            {checkedInToday ? t('checkIn.alreadyCheckedInBody') : t('mobile.home.streakSub')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 5, marginTop: 11 }}>
            {weekDots.map((on, i) => (
              <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: on ? '#fff' : 'rgba(255,255,255,0.28)' }} />
            ))}
          </View>
        </View>
      </View>

      {!recommendation ? (
        <Card>
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 16, color: colors.text, marginBottom: 4 }}>
            {t('mobile.home.noScanTitle')}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 14 }}>{t('mobile.home.noScanBody')}</Text>
          <Button label={t('clientDashboard.startHandScan')} icon={<Camera size={18} color="#fff" />} onPress={() => navigation.getParent()?.navigate('ScanTab' as never)} />
        </Card>
      ) : (
        <>
          {vitamins.length > 0 && (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text }}>{t('mobile.home.protocolTitle')}</Text>
                <Text style={{ fontFamily: 'ui-monospace', fontSize: 12, color: colors.teal, fontWeight: '600' }}>
                  {t('mobile.home.takenLabel', { taken: takenCount, total: vitamins.length })}
                </Text>
              </View>
              <View style={{ marginBottom: 14, marginTop: 4 }}>
                <ProgressBar pct={(takenCount / vitamins.length) * 100} color={colors.gold} />
              </View>
              <View style={{ gap: 9 }}>
                {vitamins.map((v) => {
                  const on = todayTaken.includes(v.name);
                  return (
                    <Pressable
                      key={v.name}
                      onPress={() => toggle(v.name)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 13,
                        padding: 12,
                        minHeight: 44,
                        borderRadius: radius.md,
                        backgroundColor: on ? 'rgba(4,120,87,0.08)' : colors.bg,
                        borderWidth: 1,
                        borderColor: on ? 'rgba(4,120,87,0.35)' : colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: radius.full,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: on ? colors.gold : '#fff',
                          borderWidth: 2,
                          borderColor: on ? colors.gold : colors.border,
                        }}
                      >
                        {on && <Check size={14} color="#fff" strokeWidth={3.2} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: on ? colors.gold : colors.text }}>{v.name}</Text>
                        <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 1 }}>{v.dosage}</Text>
                      </View>
                      <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.muted }}>
                        {inferSlot(`${v.dosage} ${v.reason}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={() => navigation.navigate('Plan')}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, minHeight: 44 }}
              >
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13, color: colors.teal }}>{t('mobile.home.seeFullPlan')}</Text>
                <ChevronRight size={15} color={colors.teal} />
              </Pressable>
            </Card>
          )}

          {pulseMetrics.length > 0 && (
            <Pressable onPress={() => navigation.navigate('Trends')}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text }}>{t('mobile.home.wellnessPulse')}</Text>
                  {wearableStatus?.connected && (
                    <View style={{ backgroundColor: colors.tealGlow, borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 11, color: colors.teal }}>
                        {t('mobile.home.wearableAndScan', { brand: 'WHOOP' })}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {pulseMetrics.map(({ key, m }) => {
                    const meta = METRIC_META[key]!;
                    return (
                      <View key={key} style={{ flex: 1, padding: 12, backgroundColor: colors.bg, borderRadius: radius.md }}>
                        <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.muted }}>
                          {t(`healthChart.metric.${key}`)}
                        </Text>
                        <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 22, color: scoreColor(m!.latestValue, meta.threshold), marginTop: 5 }}>
                          {m!.latestValue}
                          <Text style={{ fontSize: 13 }}>{meta.unit}</Text>
                        </Text>
                        <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 10.5, color: trendColor(m!.trend), marginTop: 2 }}>
                          {m!.trend ? `${trendArrow(m!.trend)} ${t(`healthChart.trend.${m!.trend}`)}` : ''}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            </Pressable>
          )}

          <Pressable onPress={() => navigation.navigate('Report')}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text }}>{t('mobile.home.yourReport')}</Text>
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 11.5, color: colors.muted }}>
                  {t('mobile.home.gapsApproved', { count: recommendation.deficiencies.length, date: formatShortDate(recommendation.createdAt) })}
                </Text>
              </View>
              <View style={{ gap: 11 }}>
                {recommendation.deficiencies.slice(0, 3).map((d) => (
                  <View key={d.nutrient}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13.5, color: colors.text }}>{d.nutrient}</Text>
                      <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12, color: scoreColorForConfidence(d.confidence) }}>
                        {Math.round(d.confidence * 100)}%
                      </Text>
                    </View>
                    <ProgressBar pct={d.confidence * 100} color={scoreColorForConfidence(d.confidence)} />
                  </View>
                ))}
              </View>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Pharmacist')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.xl,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.tealGlow, alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={20} color={colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: colors.text }}>{t('mobile.pharmacist.title')}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 1 }}>
                {isToday(recommendation.createdAt) ? t('mobile.notifications.scanReadyBody', { date: formatShortDate(recommendation.createdAt) }) : t('mobile.pharmacist.repliesIn')}
              </Text>
            </View>
            <ChevronRight size={17} color={colors.muted} />
          </Pressable>

          <Text style={{ fontFamily: fonts.body, fontSize: 11.5, lineHeight: 18, color: colors.muted }}>{t('mobile.home.disclaimerShort')}</Text>
        </>
      )}
    </Screen>
  );
}

function scoreColorForConfidence(conf: number): string {
  if (conf >= 0.75) return colors.danger;
  if (conf >= 0.55) return colors.gold;
  return colors.teal;
}
