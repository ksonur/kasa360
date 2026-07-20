import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

interface CategoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
}

/**
 * Gider kategorisi seçim chip'i. PRD kuralı: kategoriler serbest metin değil,
 * önceden tanımlı seçilebilir liste (checklist/chip) olarak sunulur.
 */
export function CategoryChip({ label, selected, onPress, icon }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
      ]}
    >
      {selected ? (
        <View style={styles.check}>
          <Check size={14} color={colors.onPrimary} strokeWidth={3} />
        </View>
      ) : icon ? (
        <View style={styles.icon}>{icon}</View>
      ) : null}
      <Text
        variant="bodyMedium"
        color={selected ? colors.primaryDarker : colors.text}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    minHeight: 44,
  },
  selected: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  unselected: { backgroundColor: colors.surface, borderColor: colors.border },
  pressed: { opacity: 0.85 },
  check: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { opacity: 0.7 },
});
