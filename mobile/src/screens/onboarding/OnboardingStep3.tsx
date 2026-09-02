import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, CheckCircle2, ChevronRight, LayoutDashboard, Watch } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { fetchHealthFlag } from '../../api/endpoints';
import { usePatient } from '../../context/PatientContext';

export default function OnboardingStep3() {
  const { t } = useTranslation();
  const { setPendingIntent, patientName } = usePatient();
  const [whoopConfigured, setWhoopConfigured] = useState(false);

  useEffect(() => {
    fetchHealthFlag().then((h) => setWhoopConfigured(h.whoopConfigured));
  }, []);

  // Actual navigation into the app happens automatically: RootNavigator
  // swaps to the Main tab stack the moment PatientContext has a patientId
  // (set by Step2's onboardPatient() call already). These buttons only
  // decide *where* inside the app the user lands.
  const go = (intent: 'scan' | 'profile' | null) => setPendingIntent(intent);

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
        <CheckCircle2 size={52} color={colors.teal} strokeWidth={1.8} />
        <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 26, color: colors.text, letterSpacing: -0.4 }}>
          {t('mobile.onboarding.setUpTitle')}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: 'center', maxWidth: 280, lineHeight: 20 }}>
          {t('mobile.onboarding.setUpSubtitle')}
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <Pressable
          onPress={() => go('scan')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.lg,
            padding: spacing.lg,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.xl,
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.tealGlow, alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={21} color={colors.teal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.text }}>{t('onboarding.scanHand')}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 }}>{t('mobile.onboarding.scanTwoMinutes')}</Text>
          </View>
          <ChevronRight size={17} color={colors.muted} />
        </Pressable>

        {whoopConfigured && (
          <Pressable
            onPress={() => go('profile')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.lg,
              padding: spacing.lg,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.xl,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.goldGlow, alignItems: 'center', justifyContent: 'center' }}>
              <Watch size={21} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.text }}>{t('onboarding.connectWearable')}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 }}>{t('mobile.onboarding.connectWearableShort')}</Text>
            </View>
            <ChevronRight size={17} color={colors.muted} />
          </Pressable>
        )}

        <Pressable onPress={() => go(null)} style={{ alignItems: 'center', minHeight: 48, justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14.5, color: colors.muted }}>{t('mobile.onboarding.justShowApp')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
