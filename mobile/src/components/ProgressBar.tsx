import { View } from 'react-native';
import { colors, radius } from '../theme/tokens';

export function ProgressBar({ pct, color = colors.gold, height = 6 }: { pct: number; color?: string; height?: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ height, borderRadius: radius.sm, backgroundColor: colors.bg, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${clamped}%`, borderRadius: radius.sm, backgroundColor: color }} />
    </View>
  );
}
