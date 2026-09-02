import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../theme/tokens';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  iconRight,
  style,
  fullWidth,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const bg = variant === 'primary' ? colors.gold : variant === 'secondary' ? colors.card : 'transparent';
  const border = variant === 'secondary' ? colors.border : variant === 'primary' ? colors.gold : 'transparent';
  const textColor = variant === 'primary' ? '#fff' : variant === 'secondary' ? colors.text : colors.muted;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          minHeight: 50,
          borderRadius: radius.full,
          backgroundColor: bg,
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderColor: border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        variant === 'primary' && shadow.raised,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={{ color: textColor, fontFamily: fonts.bodySemibold, fontSize: 15 }}>{label}</Text>
          {iconRight}
        </>
      )}
    </Pressable>
  );
}
