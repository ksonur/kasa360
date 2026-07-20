import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/theme';
import { Text } from './Text';

interface AmountSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  step?: number;
  /** Alanın altında yardımcı açıklama. */
  hint?: string;
}

/**
 * Tahmini finansal büyüklükler (maaş, mesai, hedef tutar) için giriş bileşeni.
 * PRD/CLAUDE kuralı: sürgülü seçim + üzerine yazılabilir manuel alan.
 * Kullanıcı slider'ı kabaca çeker, gerekirse tutarı elle düzeltir.
 */
export function AmountSlider({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 100,
  hint,
}: AmountSliderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  // Slider üst sınırı, kullanıcı manuel olarak daha yüksek girerse büyür.
  const effectiveMax = Math.max(max, value);

  function commitDraft() {
    const parsed = parseInt(draft.replace(/[^0-9]/g, ''), 10);
    onChange(Number.isFinite(parsed) ? parsed : 0);
    setEditing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label" color={colors.textSecondary}>
          {label}
        </Text>
      </View>

      <View style={styles.amountRow}>
        {editing ? (
          <View style={styles.editWrap}>
            <Text variant="amount" color={colors.primary}>
              ₺
            </Text>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              onBlur={commitDraft}
              onSubmitEditing={commitDraft}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        ) : (
          <Text
            variant="amount"
            color={colors.primary}
            onPress={() => {
              setDraft(String(value));
              setEditing(true);
            }}
            suppressHighlighting
          >
            {formatCurrency(value)}
          </Text>
        )}
        <Text variant="caption" color={colors.textMuted}>
          {editing ? 'yazın' : 'düzenlemek için dokunun'}
        </Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={effectiveMax}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.surfaceAlt}
        thumbTintColor={colors.primary}
      />

      <View style={styles.scale}>
        <Text variant="caption" color={colors.textMuted}>
          {formatCurrency(min)}
        </Text>
        <Text variant="caption" color={colors.textMuted}>
          {formatCurrency(effectiveMax)}
        </Text>
      </View>

      {hint ? (
        <Text variant="caption" color={colors.textMuted} style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  editWrap: { flexDirection: 'row', alignItems: 'baseline' },
  input: {
    ...typography.amount,
    color: colors.primary,
    minWidth: 120,
    padding: 0,
  },
  slider: { width: '100%', height: 40 },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { marginTop: spacing.xs },
});
