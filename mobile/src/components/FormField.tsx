import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/tokens';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: object;
}

export function FormField({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize, style }: FormFieldProps) {
  return (
    <View style={[{ gap: 6, flex: 1 }, style]}>
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.muted }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholderMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          minHeight: 50,
          paddingHorizontal: 15,
          paddingVertical: 13,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          fontSize: 15,
          fontFamily: fonts.body,
          color: colors.text,
        }}
      />
    </View>
  );
}
