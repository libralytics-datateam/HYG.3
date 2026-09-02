import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CalendarClock } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { BackRow } from '../../components/BackRow';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { usePatient } from '../../context/PatientContext';
import { useDoseTracker } from '../../hooks/useDoseTracker';
import { formatShortDate } from '../../utils/date';
import type { HomeStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Plan'>;

export default function PlanScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { patientId, recommendation } = usePatient();
  const { weekGrid, monthlyAdherencePct } = useDoseTracker(patientId);

  const vitamins = recommendation?.vitamins ?? [];
  const adherencePct = monthlyAdherencePct(vitamins.map((v) => v.name));

  return (
    <Screen>
      <BackRow label={t('clientLayout.myReport')} onPress={() => navigation.goBack()} />
      <View>
        <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 25, color: colors.text, letterSpacing: -0.4 }}>{t('mobile.plan.title')}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 3 }}>
          {recommendation
            ? t('mobile.plan.approvedBy', {
                date: formatShortDate(recommendation.createdAt),
                pct: adherencePct == null ? t('mobile.plan.adherenceUnknown') : `${adherencePct}%`,
              })
            : ''}
        </Text>
      </View>

      {vitamins.length === 0 ? (
        <Card>
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text, marginBottom: 4 }}>{t('mobile.plan.emptyTitle')}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{t('mobile.plan.emptyBody')}</Text>
        </Card>
      ) : (
        <Card style={{ gap: spacing.xl }}>
          {vitamins.map((v, i) => (
            <View key={v.name} style={{ gap: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border, paddingTop: i === 0 ? 0 : spacing.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text }}>{v.name}</Text>
                <Text style={{ fontFamily: 'ui-monospace', fontSize: 11.5, color: colors.teal, fontWeight: '600' }}>{v.dosage}</Text>
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted }}>{v.reason}</Text>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {weekGrid(v.name).map((d, idx) => (
                  <View
                    key={idx}
                    style={{
                      flex: 1,
                      height: 26,
                      borderRadius: 6,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: d.taken ? 'rgba(4,120,87,0.12)' : colors.bg,
                      borderWidth: 1,
                      borderColor: d.taken ? 'rgba(4,120,87,0.3)' : colors.border,
                      opacity: d.isFuture ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 9.5, color: d.taken ? colors.gold : '#94a8ad' }}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </Card>
      )}

      <View style={{ backgroundColor: colors.tealGlow, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 6 }}>
          <CalendarClock size={16} color={colors.teal} />
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13.5, color: colors.teal }}>{t('mobile.plan.remindersTitle')}</Text>
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 12.5, lineHeight: 19, color: colors.muted }}>{t('mobile.plan.remindersBody')}</Text>
      </View>
    </Screen>
  );
}
