import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PhoneCall, CheckCircle2 } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { BackRow } from '../../components/BackRow';
import { Button } from '../../components/Button';
import { TrendChart } from '../../components/TrendChart';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { usePatient } from '../../context/PatientContext';
import { requestPharmacistReview } from '../../api/endpoints';
import { formatShortDate } from '../../utils/date';
import { METRIC_META, METRIC_ORDER, scoreColor, trendColor, trendArrow } from '../../utils/metrics';
import type { HomeStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Trends'>;

export default function TrendsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { patientId, biometrics, recommendation, checkinHistory, wearableStatus } = usePatient();

  const available = METRIC_ORDER.filter((k) => biometrics.some((b) => b.metricType === k));
  const [active, setActive] = useState(available[0] ?? 'recovery_score');
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  const current = biometrics.find((b) => b.metricType === active);
  const meta = METRIC_META[active] ?? { unit: '', threshold: null };

  const recentAvg = useMemo(() => {
    if (!current) return null;
    const recent = current.history.slice(-3);
    if (recent.length === 0) return null;
    return Math.round(recent.reduce((s, r) => s + r.value, 0) / recent.length);
  }, [current]);

  const isConcerning = !!(current && meta.threshold != null && current.latestValue < meta.threshold);

  const windowEvents = useMemo(() => {
    const events: { color: string; label: string; note: string; at: number }[] = [];
    if (recommendation?.scanDate) {
      events.push({
        color: colors.teal,
        label: t('mobile.trends.eventScan', { date: formatShortDate(recommendation.scanDate) }),
        note: recommendation.deficiencies.length ? t('mobile.trends.eventScoreLabel', { score: recommendation.deficiencies.length }) : '',
        at: new Date(recommendation.scanDate).getTime(),
      });
    }
    checkinHistory.slice(-2).forEach((c) => {
      events.push({ color: colors.gold, label: t('mobile.trends.eventCheckin', { date: formatShortDate(c.recordedAt) }), note: '', at: new Date(c.recordedAt).getTime() });
    });
    if (wearableStatus?.connected && wearableStatus.lastSyncedAt) {
      events.push({
        color: colors.border,
        label: t('mobile.trends.eventSync', { brand: 'WHOOP', date: formatShortDate(wearableStatus.lastSyncedAt) }),
        note: '',
        at: new Date(wearableStatus.lastSyncedAt).getTime(),
      });
    }
    return events.sort((a, b) => b.at - a.at).slice(0, 3);
  }, [recommendation, checkinHistory, wearableStatus, t]);

  const handleRequest = async () => {
    if (!patientId || !current) return;
    setRequesting(true);
    const label = t(`healthChart.metric.${active}`);
    const reason = t('healthChart.requestReason', { label, value: recentAvg ?? current.latestValue, unit: meta.unit, threshold: meta.threshold });
    const res = await requestPharmacistReview({ patientId, source: 'wearable_trend', reason });
    setRequesting(false);
    if (res.ok) setRequested(true);
  };

  return (
    <Screen>
      <BackRow label={t('clientLayout.myReport')} onPress={() => navigation.goBack()} />
      <View>
        <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 25, color: colors.text, letterSpacing: -0.4 }}>{t('healthChart.title')}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 3 }}>{t('healthChart.subtitle')}</Text>
      </View>

      {available.length === 0 ? (
        <Card>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{t('healthChart.needMorePoints')}</Text>
        </Card>
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {available.map((k) => {
              const on = k === active;
              return (
                <Pressable
                  key={k}
                  onPress={() => {
                    setActive(k);
                    setRequested(false);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    minHeight: 40,
                    borderRadius: radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? colors.tealGlow : colors.card,
                    borderWidth: 1,
                    borderColor: on ? colors.tealGlowStrong : colors.border,
                  }}
                >
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12.5, color: on ? colors.teal : colors.muted }}>{t(`healthChart.metric.${k}`)}</Text>
                </Pressable>
              );
            })}
          </View>

          {current && (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 34, color: scoreColor(current.latestValue, meta.threshold) }}>
                  {current.latestValue}
                  {meta.unit}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>{t('healthChart.lastReading', { date: formatShortDate(current.latestRecordedAt) })}</Text>
                {current.trend && (
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12, color: trendColor(current.trend) }}>
                    {trendArrow(current.trend)} {t(`healthChart.trend.${current.trend}`)}
                  </Text>
                )}
              </View>

              <TrendChart
                history={current.history}
                color={scoreColor(current.latestValue, meta.threshold)}
                threshold={meta.threshold}
                thresholdLabel={meta.threshold == null ? '' : t('healthChart.thresholdLabel', { value: meta.threshold })}
              />

              {windowEvents.length > 0 && (
                <View style={{ gap: 8, marginTop: 16, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.muted }}>
                    {t('mobile.trends.whatLandedTitle')}
                  </Text>
                  {windowEvents.map((e, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: e.color }} />
                      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.text }}>{e.label}</Text>
                      {!!e.note && <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.muted }}>{e.note}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )}

          {isConcerning && (
            <View style={{ backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: colors.text }}>
                {t('healthChart.alertBody', { label: t(`healthChart.metric.${active}`), value: recentAvg ?? current?.latestValue, unit: meta.unit, threshold: meta.threshold })}
              </Text>
              {requested ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <CheckCircle2 size={16} color={colors.teal} />
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13, color: colors.teal }}>{t('healthChart.requestSent')}</Text>
                </View>
              ) : (
                <Button label={requesting ? t('healthChart.requesting') : t('healthChart.requestReviewCta')} icon={<PhoneCall size={16} color="#fff" />} onPress={handleRequest} loading={requesting} />
              )}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
