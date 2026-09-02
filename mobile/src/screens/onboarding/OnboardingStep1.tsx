import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { FormField } from '../../components/FormField';
import { Chip } from '../../components/Chip';
import { Button } from '../../components/Button';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { LANGUAGES, setLanguage } from '../../i18n';
import type { OnboardingStackParamList } from '../../navigation/types';
import { useOnboardingForm } from './useOnboardingForm';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Step1'>;

const GENDERS = ['female', 'male', 'other'] as const;

export default function OnboardingStep1({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { form, setForm } = useOnboardingForm();
  const [langIdx, setLangIdx] = useState(() => Math.max(0, LANGUAGES.findIndex((l) => l.code === i18n.language)));

  const cycleLang = async () => {
    const next = (langIdx + 1) % LANGUAGES.length;
    setLangIdx(next);
    await setLanguage(LANGUAGES[next]!.code);
  };

  const valid = form.firstName && form.lastName && form.email && form.age && form.gender;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 19, letterSpacing: 3, color: colors.text }}>HYG.3</Text>
        <Pressable
          onPress={cycleLang}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 13,
            minHeight: 40,
            borderRadius: radius.full,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Globe size={14} color={colors.text} />
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.text }}>{LANGUAGES[langIdx]!.label}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.teal }} />
        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
      </View>

      <View>
        <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 26, color: colors.text, letterSpacing: -0.4 }}>
          {t('mobile.onboarding.aboutYouTitle')}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, marginTop: 6 }}>
          {t('mobile.onboarding.aboutYouSubtitle')}
        </Text>
      </View>

      <View style={{ gap: spacing.lg }}>
        <FormField label={t('onboarding.firstName')} value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} placeholder="Nara" />
        <FormField label={t('onboarding.lastName')} value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} placeholder="Thanakit" />
        <FormField
          label={t('onboarding.email')}
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <FormField label={t('onboarding.age')} value={form.age} onChangeText={(v) => setForm({ ...form, age: v.replace(/[^0-9]/g, '') })} placeholder="32" keyboardType="number-pad" />
          <FormField label={t('onboarding.height')} value={form.heightCm} onChangeText={(v) => setForm({ ...form, heightCm: v.replace(/[^0-9]/g, '') })} placeholder="165" keyboardType="number-pad" />
          <FormField label={t('onboarding.weight')} value={form.weightKg} onChangeText={(v) => setForm({ ...form, weightKg: v.replace(/[^0-9]/g, '') })} placeholder="58" keyboardType="number-pad" />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.muted }}>
            {t('onboarding.gender')}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {GENDERS.map((g) => (
              <Chip key={g} label={t(`onboarding.gender${g[0]!.toUpperCase()}${g.slice(1)}`)} selected={form.gender === g} onPress={() => setForm({ ...form, gender: g })} pill={false} />
            ))}
          </View>
        </View>
      </View>

      <Button
        label={t('onboarding.continue')}
        onPress={() => navigation.navigate('Step2')}
        disabled={!valid}
        fullWidth
      />
      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, textAlign: 'center' }}>
        {t('onboarding.footerText')}
      </Text>
    </Screen>
  );
}
