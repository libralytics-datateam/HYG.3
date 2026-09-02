import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScanLine, Salad, Utensils } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { BackRow } from '../../components/BackRow';
import { ProgressBar } from '../../components/ProgressBar';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { usePatient } from '../../context/PatientContext';
import { formatShortDate } from '../../utils/date';
import type { HomeStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Report'>;

function scoreColorForConfidence(conf: number): string {
  if (conf >= 0.75) return colors.danger;
  if (conf >= 0.55) return colors.gold;
  return colors.teal;
}

const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function ReportScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { recommendation } = usePatient();

  if (!recommendation) {
    return (
      <Screen>
        <BackRow label={t('clientLayout.myReport')} onPress={() => navigation.goBack()} />
        <Card>
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 16, color: colors.text, marginBottom: 4 }}>{t('clientDashboard.noAnalysisTitle')}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{t('clientDashboard.noAnalysisBody')}</Text>
        </Card>
      </Screen>
    );
  }

  const foods = [...recommendation.foods, ...recommendation.fruits];
  const hasMealPlan = MEAL_KEYS.some((k) => recommendation.mealPlan[k]);

  return (
    <Screen>
      <BackRow label={t('clientLayout.myReport')} onPress={() => navigation.goBack()} />

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md }}>
        <View>
          <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 25, color: colors.text, letterSpacing: -0.4 }}>{t('mobile.report.title')}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 3 }}>
            {recommendation.scanDate ? t('mobile.report.fromScan', { date: formatShortDate(recommendation.scanDate) }) : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.tealGlow, borderWidth: 1, borderColor: colors.tealGlowStrong, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5 }}>
          <ScanLine size={11} color={colors.teal} />
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 11, color: colors.teal }}>{t('mobile.report.handScanBadge')}</Text>
        </View>
      </View>

      {recommendation.deficiencies.length > 0 && (
        <Card>
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text, marginBottom: 15 }}>{t('clientDashboard.detectedGaps')}</Text>
          <View style={{ gap: 15 }}>
            {recommendation.deficiencies.map((d) => (
              <View key={d.nutrient}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: colors.text }}>{d.nutrient}</Text>
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12.5, color: scoreColorForConfidence(d.confidence) }}>{Math.round(d.confidence * 100)}%</Text>
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginVertical: 4 }}>{d.reason}</Text>
                <ProgressBar pct={d.confidence * 100} color={scoreColorForConfidence(d.confidence)} />
              </View>
            ))}
          </View>
        </Card>
      )}

      {foods.length > 0 && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <Salad size={17} color={colors.teal} />
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text }}>{t('mobile.report.eatMore')}</Text>
          </View>
          <View style={{ gap: 9 }}>
            {foods.map((f) => (
              <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, backgroundColor: colors.bg, borderRadius: radius.md }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.teal }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13.5, color: colors.text }}>{f.name}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 1 }}>{f.benefit}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {hasMealPlan && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <Utensils size={17} color={colors.teal} />
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text }}>{t('mobile.report.dayThatFits')}</Text>
          </View>
          <View style={{ gap: 10 }}>
            {MEAL_KEYS.filter((k) => recommendation.mealPlan[k]).map((k) => (
              <View key={k} style={{ padding: 13, backgroundColor: colors.bg, borderRadius: radius.md }}>
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.teal, marginBottom: 5 }}>
                  {t(`clientDashboard.${k}`)}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.text }}>{recommendation.mealPlan[k]}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, lineHeight: 18, color: colors.muted }}>{recommendation.disclaimer}</Text>
    </Screen>
  );
}
