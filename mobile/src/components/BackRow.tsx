import { Pressable, Text } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, fonts } from '../theme/tokens';

export function BackRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 44,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <ChevronLeft size={18} color={colors.muted} />
      <Text style={{ color: colors.muted, fontFamily: fonts.bodySemibold, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}
