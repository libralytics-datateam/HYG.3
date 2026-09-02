import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme/tokens';

interface Point {
  value: number;
  recordedAt: string;
}

interface TrendChartProps {
  history: Point[];
  color: string;
  threshold: number | null;
  thresholdLabel: string;
}

const W = 320;
const H = 150;
const PX = 10;
const PY = 14;

export function TrendChart({ history, color, threshold, thresholdLabel }: TrendChartProps) {
  if (history.length < 2) {
    return (
      <View style={{ height: 150, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'center' }}>
          Not enough readings yet for a trend line.
        </Text>
      </View>
    );
  }

  const values = history.map((h) => h.value);
  const withThreshold = threshold == null ? values : [...values, threshold];
  const lo = Math.min(...withThreshold);
  const hi = Math.max(...withThreshold);
  const range = hi - lo || 1;
  const stepX = (W - PX * 2) / (history.length - 1);
  const yOf = (v: number) => PY + (H - PY * 2) - ((v - lo) / range) * (H - PY * 2);

  const pts = history.map((h, i) => ({ x: PX + i * stepX, y: yOf(h.value) }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${pts[pts.length - 1]!.x.toFixed(1)} ${H - PY} L ${pts[0]!.x.toFixed(1)} ${H - PY} Z`;
  const threshY = threshold == null ? null : yOf(threshold);

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={150}>
      <Defs>
        <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {threshY != null && (
        <>
          <Line x1={10} y1={threshY} x2={310} y2={threshY} stroke={colors.danger} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="4 4" />
          <SvgText x={12} y={threshY - 4} fill={colors.danger} fontSize={9} fontWeight="700" opacity={0.8}>
            {thresholdLabel}
          </SvgText>
        </>
      )}
      <Path d={area} fill="url(#fill)" stroke="none" />
      <Path d={path} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.4} fill={i === pts.length - 1 ? color : 'transparent'} stroke={colors.bg} strokeWidth={2} />
      ))}
    </Svg>
  );
}
