import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Text } from './Text';

interface DaySelectorProps {
  label: string;
  /** Seçili gün (1-31) veya null. */
  value: number | null;
  onChange: (day: number) => void;
  hint?: string;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * Tekrar eden gün bazlı alanlar (ekstre kesim günü, son ödeme günü) için
 * 1-31 hızlı seçim ızgarası. Calendar picker yerine tek dokunuşla seçim.
 */
export function DaySelector({ label, value, onChange, hint }: DaySelectorProps) {
  return (
    <View style={styles.container}>
      <Text variant="label" color={colors.textSecondary}>
        {label}
      </Text>
      {hint ? (
        <Text variant="caption" color={colors.textMuted}>
          {hint}
        </Text>
      ) : null}
      <View style={styles.grid}>
        {DAYS.map((day) => {
          const selected = value === day;
          return (
            <Pressable
              key={day}
              onPress={() => onChange(day)}
              accessibilityRole="button"
              accessibilityLabel={`Ayın ${day}. günü`}
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.cell,
                selected && styles.cellSelected,
                pressed && !selected && styles.cellPressed,
              ]}
            >
              <Text
                style={typography.callout}
                color={selected ? colors.onPrimary : colors.text}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL = 40;

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cellPressed: { backgroundColor: colors.primaryTint },
});
