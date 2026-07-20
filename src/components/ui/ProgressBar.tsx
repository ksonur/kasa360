import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';

interface ProgressBarProps {
  /** 0-1 arası ilerleme. */
  progress: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
}

export function ProgressBar({
  progress,
  height = 8,
  trackColor = colors.surfaceAlt,
  fillColor = colors.primary,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[styles.track, { height, backgroundColor: trackColor }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
