import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Globe,
  Hourglass,
  RefreshCw,
  Shield,
  Unlink,
  Watch,
  Check,
  LogOut,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { usePatient } from '../../context/PatientContext';
import { API_BASE } from '../../api/client';
import { disconnectWhoop, syncWhoop, whoopConnectUrl } from '../../api/endpoints';
import { LANGUAGES, setLanguage } from '../../i18n';
import { navigateHomeStack } from '../../navigation/helpers';

const GOALS = ['energy', 'immunity', 'sleep', 'skin', 'weight', 'stress', 'digestion', 'focus'];

function parseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { patientId, patientName, profile, wearableStatus, refreshWearable, signOut } = usePatient();

  const [syncing, setSyncing] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [wearableTab, setWearableTab] = useState<'whoop' | 'fitbit'>('whoop');

  useEffect(() => {
    refreshWearable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const initials = (patientName ?? 'NA')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const health = profile?.healthProfile;
  const goals = parseJsonArray(health?.healthGoals);
  const dietary = parseJsonArray(health?.dietaryRestrictions).filter((d) => d !== 'none');
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : '';

  const connectWhoop = async () => {
    if (!patientId) return;
    await WebBrowser.openBrowserAsync(whoopConnectUrl(API_BASE, patientId));
    await refreshWearable();
  };

  const handleSync = async () => {
    if (!patientId) return;
    setSyncing(true);
    await syncWhoop(patientId);
    await refreshWearable();
    setSyncing(false);
  };

  const handleDisconnect = async () => {
    if (!patientId) return;
    await disconnectWhoop(patientId);
    await refreshWearable();
  };

  const whoopPending = wearableStatus == null || !wearableStatus.whoopConfigured;

  return (
    <Screen>
      <View style={{ minHeight: 20 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
        <View style={{ width: 62, height: 62, borderRadius: radius.full, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 22, color: '#fff' }}>{initials}</Text>
        </View>
        <View>
          <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 21, color: colors.text, letterSpacing: -0.3 }}>{patientName}</Text>
          {!!health && (
            <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 }}>
              {t('mobile.profile.memberSince', { age: health.age, height: health.heightCm, weight: health.weightKg, month: memberSince })}
            </Text>
          )}
        </View>
      </View>

      {(goals.length > 0 || dietary.length > 0) && (
        <View>
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted, marginBottom: 9 }}>
            {t('mobile.profile.healthGoalsTitle')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {goals.filter((g) => GOALS.includes(g)).map((g) => (
              <View key={g} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.tealGlow, borderWidth: 1, borderColor: colors.tealGlowStrong }}>
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12.5, color: colors.teal }}>{t(`onboarding.goals.${g}`)}</Text>
              </View>
            ))}
            {dietary.map((d) => (
              <View key={d} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12.5, color: colors.muted }}>{t(`onboarding.dietary.${d}`)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingBottom: 12 }}>
          <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: whoopPending ? colors.bg : colors.tealGlow, alignItems: 'center', justifyContent: 'center' }}>
            {whoopPending ? <Hourglass size={18} color={colors.muted} /> : <Watch size={18} color={colors.teal} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: colors.text }}>WHOOP</Text>
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12, color: whoopPending ? colors.muted : wearableStatus?.connected ? colors.teal : colors.muted, marginTop: 1 }}>
              {whoopPending ? t('wearables.comingSoon') : wearableStatus?.connected ? t('wearables.connected') : t('wearables.notConnected')}
            </Text>
          </View>
          {!whoopPending && wearableStatus?.connected && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={handleSync} disabled={syncing} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, minHeight: 36, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border }}>
                <RefreshCw size={13} color={colors.text} />
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12, color: colors.text }}>{syncing ? t('wearables.syncing') : t('wearables.syncNow')}</Text>
              </Pressable>
              <Pressable onPress={handleDisconnect} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, minHeight: 36, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border }}>
                <Unlink size={13} color={colors.text} />
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12, color: colors.text }}>{t('wearables.disconnect')}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable
            onPress={() => setWearableTab('whoop')}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8, minHeight: 36, borderRadius: radius.full, backgroundColor: wearableTab === 'whoop' ? colors.tealGlow : colors.card, borderWidth: 1, borderColor: wearableTab === 'whoop' ? colors.tealGlowStrong : colors.border }}
          >
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12, color: wearableTab === 'whoop' ? colors.teal : colors.muted }}>WHOOP</Text>
          </Pressable>
          <Pressable
            onPress={() => setWearableTab('fitbit')}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8, minHeight: 36, borderRadius: radius.full, backgroundColor: wearableTab === 'fitbit' ? colors.tealGlow : colors.card, borderWidth: 1, borderColor: wearableTab === 'fitbit' ? colors.tealGlowStrong : colors.border }}
          >
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 12, color: wearableTab === 'fitbit' ? colors.teal : colors.muted }}>Fitbit</Text>
          </Pressable>
        </View>

        {wearableTab === 'fitbit' ? (
          <View style={{ padding: 16 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted }}>{t('mobile.profile.fitbitNote')}</Text>
          </View>
        ) : (
          !whoopPending &&
          !wearableStatus?.connected && (
            <View style={{ padding: 16, gap: 12 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted }}>{t('wearables.consentText')}</Text>
              <Pressable onPress={connectWhoop} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: radius.full, backgroundColor: colors.gold }}>
                <Watch size={16} color="#fff" />
                <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: '#fff' }}>{t('wearables.connectButton')}</Text>
              </Pressable>
            </View>
          )
        )}

        <Pressable
          onPress={() => navigateHomeStack(navigation, 'Notifications')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: wearableTab === 'fitbit' || (!whoopPending && !wearableStatus?.connected) ? 1 : 0, borderTopColor: colors.border }}
        >
          <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={18} color={colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: colors.text }}>{t('mobile.profile.remindersRowTitle')}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 1 }}>{t('mobile.profile.remindersRowSub')}</Text>
          </View>
          <ChevronRight size={16} color={colors.muted} />
        </Pressable>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable onPress={() => setLangOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
            <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={18} color={colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: colors.text }}>{t('common.language')}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 1 }}>{t('mobile.profile.languageSub')}</Text>
            </View>
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13, color: colors.teal }}>{LANGUAGES.find((l) => l.code === i18n.language)?.label}</Text>
            <ChevronDown size={15} color={colors.muted} style={{ transform: [{ rotate: langOpen ? '180deg' : '0deg' }] }} />
          </Pressable>
          {langOpen && (
            <View style={{ gap: 6, paddingHorizontal: 16, paddingBottom: 16 }}>
              {LANGUAGES.map((l) => {
                const on = l.code === i18n.language;
                return (
                  <Pressable
                    key={l.code}
                    onPress={async () => {
                      await setLanguage(l.code);
                      setLangOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 14,
                      minHeight: 44,
                      borderRadius: radius.full,
                      backgroundColor: on ? colors.tealGlow : colors.card,
                      borderWidth: 1,
                      borderColor: on ? colors.tealGlowStrong : colors.border,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13.5, color: on ? colors.teal : colors.text }}>{l.label}</Text>
                    {on && <Check size={15} color={colors.teal} strokeWidth={2.6} />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} color={colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: colors.text }}>{t('mobile.profile.dataConsentTitle')}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 1 }}>{t('mobile.profile.dataConsentSub')}</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={signOut}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}
      >
        <LogOut size={16} color={colors.muted} />
        <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: colors.muted }}>{t('clientLayout.signOut')}</Text>
      </Pressable>
    </Screen>
  );
}
