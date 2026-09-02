import { Pressable, Text } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'teal' | 'gold';
  icon?: React.ReactNode;
  pill?: boolean;
}

export function Chip({ label, selected, onPress, tone = 'teal', icon, pill = true }: ChipProps) {
  const tint = tone === 'teal' ? colors.teal : colors.gold;
  const bg = selected ? (tone === 'teal' ? colors.tealGlow : colors.goldGlow) : colors.card;
  const border = selected ? tint : colors.border;
  const fg = selected ? tint : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        minHeight: 44,
        borderRadius: pill ? radius.full : radius.md,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon}
      <Text style={{ color: fg, fontFamily: fonts.bodySemibold, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
