import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { BackRow } from '../../components/BackRow';
import { colors, fonts, radius } from '../../theme/tokens';
import { useDerivedNotifications } from '../../hooks/useNotifications';
import type { HomeStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Notifications'>;

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const notifications = useDerivedNotifications();

  return (
    <Screen>
      <BackRow label={t('clientLayout.myReport')} onPress={() => navigation.goBack()} />
      <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 25, color: colors.text, letterSpacing: -0.4 }}>{t('mobile.notifications.title')}</Text>

      {notifications.length === 0 ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{t('mobile.notifications.empty')}</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {notifications.map((n) => (
            <View
              key={n.id}
              style={{
                flexDirection: 'row',
                gap: 13,
                padding: 15,
                backgroundColor: n.unread ? 'rgba(12,100,120,0.06)' : colors.card,
                borderWidth: 1,
                borderColor: n.unread ? colors.tealGlowStrong : colors.border,
                borderRadius: radius.lg,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: n.tone === 'warn' ? 'rgba(248,113,113,0.14)' : colors.tealGlow,
                }}
              >
                <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 13, color: n.tone === 'warn' ? '#d95757' : colors.teal }}>{n.badge}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13.5, color: colors.text, flexShrink: 1 }}>{n.title}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>{n.when}</Text>
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted, marginTop: 3 }}>{n.body}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, lineHeight: 18, color: colors.muted }}>{t('mobile.notifications.footer')}</Text>
    </Screen>
  );
}
