import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Text } from './Text';

interface DayStripProps {
  label: string;
  value: number | null;
  onChange: (day: number) => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * Kompakt, yatay kaydırılabilir 1-31 gün seçici. Wizard içinde tek ekranda çok
 * alan göstermemek için DaySelector ızgarasının yerine kullanılır.
 */
export function DayStrip({ label, value, onChange }: DayStripProps) {
  return (
    <View style={styles.container}>
      <Text variant="label" color={colors.textSecondary}>
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {DAYS.map((day) => {
          const selected = value === day;
          return (
            <Pressable
              key={day}
              onPress={() => onChange(day)}
              accessibilityRole="button"
              accessibilityLabel={`${day}. gün`}
              accessibilityState={{ selected }}
              style={[styles.cell, selected && styles.cellSelected]}
            >
              <Text
                variant="callout"
                color={selected ? colors.onPrimary : colors.textSecondary}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  strip: { gap: spacing.sm, paddingRight: spacing.lg },
  cell: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  cellSelected: { backgroundColor: colors.primary },
});
