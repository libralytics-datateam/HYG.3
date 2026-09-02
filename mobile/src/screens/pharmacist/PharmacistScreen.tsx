import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Send, Stethoscope } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { usePatient } from '../../context/PatientContext';
import { requestPharmacistReview } from '../../api/endpoints';
import { formatShortDate } from '../../utils/date';
import type { HomeStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Pharmacist'>;

interface Msg {
  id: string;
  me: boolean;
  text: string;
}

// There is no messaging endpoint in the API this ports — only
// POST /telemedicine/request-review (server/routes/telemedicine.ts). So
// this screen is a real request queue dressed as a thread, not live chat:
// each sent message becomes a review request with the text as `reason`,
// and replies happen through the patient's record, not here. That's
// disclosed up front rather than faked as two-way messaging.
export default function PharmacistScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { patientId, recommendation } = usePatient();

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !patientId) return;
    setSending(true);
    setError('');
    const res = await requestPharmacistReview({ patientId, source: 'wearable_trend', reason: text });
    setSending(false);
    if (res.ok) {
      setMsgs((m) => [...m, { id: `${Date.now()}`, me: true, text }, { id: `${Date.now()}-ack`, me: false, text: t('mobile.pharmacist.sentAck') }]);
      setDraft('');
    } else {
      setError(res.error || t('mobile.pharmacist.sendFailed'));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} color={colors.muted} />
        </Pressable>
        <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.tealGlow, alignItems: 'center', justifyContent: 'center' }}>
          <Stethoscope size={18} color={colors.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text }}>{t('mobile.pharmacist.title')}</Text>
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 11.5, color: colors.teal }}>{t('mobile.pharmacist.licensed')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
          <View style={{ backgroundColor: colors.tealGlow, borderRadius: radius.lg, padding: 13 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.text }}>{t('mobile.pharmacist.initialNote')}</Text>
          </View>

          {recommendation && (
            <View style={{ alignSelf: 'flex-start', maxWidth: '82%', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, borderBottomLeftRadius: 4, padding: 12 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.text }}>
                {t('mobile.notifications.scanReadyBody', { date: formatShortDate(recommendation.scanDate || recommendation.createdAt) })}
              </Text>
            </View>
          )}

          {msgs.map((m) => (
            <View
              key={m.id}
              style={{
                alignSelf: m.me ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                backgroundColor: m.me ? colors.teal : colors.card,
                borderWidth: 1,
                borderColor: m.me ? colors.teal : colors.border,
                borderRadius: 14,
                borderBottomRightRadius: m.me ? 4 : 14,
                borderBottomLeftRadius: m.me ? 14 : 4,
                padding: 12,
              }}
            >
              <Text style={{ fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: m.me ? '#fff' : colors.text }}>{m.text}</Text>
            </View>
          ))}

          {!!error && <Text style={{ color: colors.danger, fontSize: 12.5, fontFamily: fonts.body }}>{error}</Text>}
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('mobile.pharmacist.composerPlaceholder')}
            placeholderTextColor={colors.placeholderMuted}
            style={{
              flex: 1,
              minHeight: 44,
              paddingHorizontal: 15,
              paddingVertical: 11,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.bg,
              fontFamily: fonts.body,
              fontSize: 13.5,
              color: colors.text,
            }}
          />
          <Pressable
            onPress={send}
            disabled={sending || !draft.trim()}
            style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', opacity: sending || !draft.trim() ? 0.6 : 1 }}
          >
            <Send size={19} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
