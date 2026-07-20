import { StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Text } from './Text';

interface AmountFieldProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  /** Para simgesi göster (₺). */
  currency?: boolean;
  style?: ViewStyle;
}

/** Kompakt sayısal tutar girişi — kart limiti, yatırım bakiyesi, gider tutarı. */
export function AmountField({
  label,
  value,
  onChange,
  placeholder = '0',
  currency = true,
  style,
}: AmountFieldProps) {
  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text variant="label" color={colors.textSecondary}>
          {label}
        </Text>
      ) : null}
      <View style={styles.field}>
        {currency ? (
          <Text variant="subheading" color={colors.textMuted}>
            ₺
          </Text>
        ) : null}
        <TextInput
          style={styles.input}
          value={value ? String(value) : ''}
          onChangeText={(t) => {
            const parsed = parseInt(t.replace(/[^0-9]/g, ''), 10);
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          inputMode="numeric"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  input: {
    ...typography.subheading,
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.md,
  },
});
