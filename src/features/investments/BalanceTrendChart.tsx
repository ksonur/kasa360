import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import type { ChartPoint } from './derive';

interface BalanceTrendChartProps {
  points: ChartPoint[];
  height?: number;
}

const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 16;
const PAD_B = 28;

export function BalanceTrendChart({ points, height = 200 }: BalanceTrendChartProps) {
  const width = 320;

  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const max = Math.max(...points.map((p) => p.balance), 1);
    const min = Math.min(...points.map((p) => p.balance), 0);
    const span = Math.max(max - min, 1);
    const innerW = width - PAD_L - PAD_R;
    const innerH = height - PAD_T - PAD_B;
    const n = points.length;

    const coords = points.map((p, i) => {
      const x =
        n === 1
          ? PAD_L + innerW / 2
          : PAD_L + (i / (n - 1)) * innerW;
      const y = PAD_T + innerH - ((p.balance - min) / span) * innerH;
      return { ...p, x, y };
    });

    const line = coords.map((c) => `${c.x},${c.y}`).join(' ');
    const barW = Math.max(8, Math.min(28, (innerW / Math.max(n, 1)) * 0.45));

    return { coords, line, barW, max, min, innerH };
  }, [points, height]);

  if (!geometry || points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="callout" color={colors.textMuted}>
          Grafik için en az bir aylık bakiye gir.
        </Text>
      </View>
    );
  }

  const { coords, line, barW, max } = geometry;

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={PAD_L}
          y1={PAD_T + geometry.innerH}
          x2={width - PAD_R}
          y2={PAD_T + geometry.innerH}
          stroke={colors.border}
          strokeWidth={1}
        />
        {coords.map((c) => (
          <Rect
            key={`bar-${c.period}`}
            x={c.x - barW / 2}
            y={c.y}
            width={barW}
            height={PAD_T + geometry.innerH - c.y}
            rx={4}
            fill={colors.primaryTint}
          />
        ))}
        {coords.length > 1 ? (
          <Polyline
            points={line}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {coords.map((c) => (
          <Circle
            key={`dot-${c.period}`}
            cx={c.x}
            cy={c.y}
            r={4}
            fill={colors.primary}
          />
        ))}
        {coords.map((c, i) => {
          const show =
            coords.length <= 6 ||
            i === 0 ||
            i === coords.length - 1 ||
            i % Math.ceil(coords.length / 5) === 0;
          if (!show) return null;
          return (
            <SvgText
              key={`lbl-${c.period}`}
              x={c.x}
              y={height - 8}
              fill={colors.textMuted}
              fontSize={9}
              textAnchor="middle"
            >
              {c.label}
            </SvgText>
          );
        })}
      </Svg>
      <View style={styles.legend}>
        <Text variant="caption" color={colors.textMuted}>
          Min–maks aralığı · zirve {formatCurrency(max)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  empty: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  legend: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});
