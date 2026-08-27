// Compact trend sparkline for a single metric's recent history. Per the
// dataviz skill's stat-tile spec: a de-emphasized line with the current
// point picked out in the accent color, no legend (a single series is
// already named by the card's own title), no axes — this is a trend
// indicator, not an analytical chart. One hue (teal) at two opacities
// rather than two hues, so there's no categorical palette to validate.
interface SparklinePoint {
  value: number;
  recordedAt: string;
}

export default function Sparkline({ history, width = 120, height = 32 }: { history: SparklinePoint[]; width?: number; height?: number }) {
  if (history.length < 2) return null;

  const values = history.map((h) => h.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid divide-by-zero when every value is identical

  const padY = 4;
  const usableHeight = height - padY * 2;
  const stepX = width / (history.length - 1);

  const coords = history.map((h, i) => ({
    x: i * stepX,
    y: padY + usableHeight - ((h.value - min) / range) * usableHeight,
    ...h,
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const last = coords[coords.length - 1]!;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <path d={pathD} fill="none" stroke="var(--teal)" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Invisible, larger hit targets on every point so hover info is available without visual clutter (only the endpoint gets a drawn dot) */}
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={6} fill="transparent">
          <title>{`${new Date(c.recordedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}: ${c.value}`}</title>
        </circle>
      ))}
      {/* End-dot: >=8px (r>=4), accent color, 2px surface-color ring so it stays legible where the line crosses under it */}
      <circle cx={last.x} cy={last.y} r={4} fill="var(--teal)" stroke="var(--bg)" strokeWidth={2} />
    </svg>
  );
}
