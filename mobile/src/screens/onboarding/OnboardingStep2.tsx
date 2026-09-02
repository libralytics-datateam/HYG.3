import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Check, Leaf } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { BackRow } from '../../components/BackRow';
import { Chip } from '../../components/Chip';
import { Button } from '../../components/Button';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import type { OnboardingStackParamList } from '../../navigation/types';
import { useOnboardingForm } from './useOnboardingForm';
import { onboardPatient } from '../../api/endpoints';
import { usePatient } from '../../context/PatientContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Step2'>;

const GOALS = ['energy', 'immunity', 'sleep', 'skin', 'weight', 'stress', 'digestion', 'focus'];
const DIETARY = ['vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'none'];

export default function OnboardingStep2({ navigation }: Props) {
  const { t } = useTranslation();
  const { form, setForm } = useOnboardingForm();
  const { signIn } = usePatient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleGoal = (id: string) => {
    setForm({
      ...form,
      healthGoals: form.healthGoals.includes(id) ? form.healthGoals.filter((g) => g !== id) : [...form.healthGoals, id],
    });
  };

  const toggleDietary = (id: string) => {
    setForm({
      ...form,
      dietaryRestrictions: form.dietaryRestrictions.includes(id)
        ? form.dietaryRestrictions.filter((d) => d !== id)
        : [...form.dietaryRestrictions, id],
    });
  };

  const valid = form.healthGoals.length > 0 && form.pdpaConsent;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const res = await onboardPatient({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      age: Number(form.age),
      gender: form.gender,
      heightCm: Number(form.heightCm) || 0,
      weightKg: Number(form.weightKg) || 0,
      healthGoals: form.healthGoals,
      dietaryRestrictions: form.dietaryRestrictions,
      pdpaConsent: form.pdpaConsent,
    });
    setSubmitting(false);
    if (res.ok) {
      await signIn(res.patientId, res.name);
      navigation.navigate('Step3');
    } else if (res.patientId) {
      await signIn(res.patientId, form.firstName);
      navigation.navigate('Step3');
    } else {
      setError(res.error);
    }
  };

  return (
    <Screen>
      <BackRow label={t('onboarding.back')} onPress={() => navigation.goBack()} />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.teal }} />
        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.teal }} />
        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
      </View>

      <View>
        <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 26, color: colors.text, letterSpacing: -0.4 }}>
          {t('onboarding.step2Title')}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, marginTop: 6 }}>
          {t('onboarding.step2Subtitle')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {GOALS.map((g) => (
          <Chip key={g} label={t(`onboarding.goals.${g}`)} selected={form.healthGoals.includes(g)} onPress={() => toggleGoal(g)} />
        ))}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ flexDirection: 'row', fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.text }}>
          <Leaf size={14} color={colors.teal} /> {t('onboarding.dietaryPreferences')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {DIETARY.map((d) => (
            <Chip key={d} label={t(`onboarding.dietary.${d}`)} selected={form.dietaryRestrictions.includes(d)} onPress={() => toggleDietary(d)} tone="gold" />
          ))}
        </View>
      </View>

      <Pressable
        onPress={() => setForm({ ...form, pdpaConsent: !form.pdpaConsent })}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          padding: spacing.lg,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            marginTop: 1,
            backgroundColor: form.pdpaConsent ? colors.teal : colors.card,
            borderWidth: 2,
            borderColor: form.pdpaConsent ? colors.teal : colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {form.pdpaConsent && <Check size={14} color="#fff" strokeWidth={3.2} />}
        </View>
        <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 19, color: colors.muted, fontFamily: fonts.body }}>
          {t('onboarding.consentText')}{' '}
          <Text style={{ color: colors.teal, textDecorationLine: 'underline' }}>{t('onboarding.consentPrivacyLink')}</Text>.
        </Text>
      </Pressable>

      {!!error && <Text style={{ color: colors.danger, fontSize: 13, fontFamily: fonts.body }}>{error}</Text>}

      <Button
        label={submitting ? t('onboarding.creatingProfile') : t('onboarding.completeSetup')}
        onPress={handleSubmit}
        disabled={!valid}
        loading={submitting}
        fullWidth
      />
    </Screen>
  );
}
