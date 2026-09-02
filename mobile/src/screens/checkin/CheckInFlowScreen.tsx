import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, Check, Frown, Meh, Smile } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { usePatient } from '../../context/PatientContext';
import { submitCheckIn } from '../../api/endpoints';
import { navigateHomeStack } from '../../navigation/helpers';

const WELLNESS = [
  { value: 1, Icon: Frown },
  { value: 2, Icon: Frown },
  { value: 3, Icon: Meh },
  { value: 4, Icon: Smile },
  { value: 5, Icon: Smile },
];

const SYMPTOMS = ['fatigue', 'poor_sleep', 'muscle_weakness', 'joint_pain', 'low_mood', 'poor_concentration', 'digestive_issues', 'skin_issues'];
const ADHERENCE = ['yes', 'partial', 'no'] as const;

export default function CheckInFlowScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { patientId, streak, checkedInToday, recommendation, refreshCheckins } = usePatient();

  const [wellness, setWellness] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [adherence, setAdherence] = useState<'yes' | 'partial' | 'no' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedNow, setSubmittedNow] = useState(false);

  const toggleSymptom = (id: string) => setSymptoms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async () => {
    if (!wellness || !patientId) return;
    setSubmitting(true);
    setError('');
    const res = await submitCheckIn({
      patientId,
      wellnessScore: wellness,
      symptoms,
      ...(recommendation && adherence ? { adherence } : {}),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmittedNow(true);
      await refreshCheckins();
    } else {
      setError(res.error || t('checkIn.submitFailed'));
    }
  };

  if (checkedInToday || submittedNow) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.md }}>
          <View style={{ width: 96, height: 96, borderRadius: radius.full, backgroundColor: colors.tealGlow, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={42} color={colors.teal} strokeWidth={2.4} />
          </View>
          <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 24, color: colors.text, letterSpacing: -0.3 }}>
            {t('mobile.checkin.doneTitle', { count: streak })}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.muted, textAlign: 'center', maxWidth: 280 }}>
            {submittedNow ? t('mobile.checkin.doneBody') : t('checkIn.alreadyCheckedInBody')}
          </Text>
          <Button
            label={t('mobile.checkin.seeOnTrend')}
            iconRight={<ArrowRight size={17} color="#fff" />}
            onPress={() => navigateHomeStack(navigation, 'Trends')}
            style={{ marginTop: 14 }}
          />
          <Pressable
            onPress={() => navigateHomeStack(navigation, 'Home')}
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: colors.muted }}>{t('mobile.checkin.backHome')}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View>
        <Text style={{ minHeight: 44, fontFamily: fonts.headingSemibold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.teal, textAlignVertical: 'center' }}>
          {t('mobile.checkin.kicker', { day: streak + 1 })}
        </Text>
        <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 25, color: colors.text, letterSpacing: -0.4 }}>{t('checkIn.wellnessQuestion')}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 5 }}>{t('checkIn.subtitle')}</Text>
      </View>

      <View>
        <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14.5, color: colors.text, marginBottom: 11 }}>{t('checkIn.wellnessQuestion')}</Text>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {WELLNESS.map(({ value, Icon }) => {
            const on = wellness === value;
            return (
              <Pressable
                key={value}
                onPress={() => setWellness(value)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 7,
                  paddingVertical: 14,
                  minHeight: 76,
                  borderRadius: radius.lg,
                  backgroundColor: on ? colors.tealGlow : colors.card,
                  borderWidth: 1,
                  borderColor: on ? colors.tealGlowStrong : colors.border,
                }}
              >
                <Icon size={24} color={on ? colors.teal : colors.text} />
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 10.5, color: on ? colors.teal : colors.text, textAlign: 'center' }}>
                  {t(`checkIn.wellness${value}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14.5, color: colors.text, marginBottom: 11 }}>{t('checkIn.symptomsQuestion')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SYMPTOMS.map((id) => {
            const on = symptoms.includes(id);
            return (
              <Pressable
                key={id}
                onPress={() => toggleSymptom(id)}
                style={{
                  paddingHorizontal: 15,
                  minHeight: 44,
                  justifyContent: 'center',
                  borderRadius: radius.full,
                  backgroundColor: on ? colors.goldGlow : colors.card,
                  borderWidth: 1,
                  borderColor: on ? colors.gold : colors.border,
                }}
              >
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13, color: on ? colors.gold : colors.text }}>{t(`checkIn.symptoms.${id}`)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {recommendation && (
        <View>
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14.5, color: colors.text, marginBottom: 11 }}>{t('checkIn.adherenceQuestion')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ADHERENCE.map((opt) => {
              const on = adherence === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setAdherence(opt)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 13,
                    minHeight: 46,
                    borderRadius: radius.md,
                    backgroundColor: on ? colors.tealGlow : colors.card,
                    borderWidth: 1,
                    borderColor: on ? colors.tealGlowStrong : colors.border,
                  }}
                >
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13.5, color: on ? colors.teal : colors.text }}>
                    {t(`checkIn.adherence${opt.charAt(0).toUpperCase()}${opt.slice(1)}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {!!error && <Text style={{ color: colors.danger, fontSize: 13, fontFamily: fonts.body }}>{error}</Text>}

      <Button
        label={wellness ? t('checkIn.submit') : t('mobile.checkin.submitFirst')}
        onPress={submit}
        disabled={!wellness}
        loading={submitting}
        fullWidth
      />
    </Screen>
  );
}
