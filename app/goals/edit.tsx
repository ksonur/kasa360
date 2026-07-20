import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AmountField,
  Button,
  CategoryChip,
  DateField,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import {
  formatGoalAmount,
  GOAL_UNITS,
  goalUnitMeta,
  monthlyRequired,
  monthsLeft,
  savedAmount,
  useGoals,
  type GoalUnit,
} from '@/features/goals';
import { todayISO } from '@/features/finance';

function defaultTargetDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function GoalEditScreen() {
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { goals, contributions, upsertGoal, softDeleteGoal } = useGoals();
  const existing = editId
    ? goals.find((g) => g.id === editId && g.deletedAt == null)
    : null;
  const isEdit = !!existing;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [unit, setUnit] = useState<GoalUnit>(existing?.unit ?? 'TRY');
  const [targetAmount, setTargetAmount] = useState(existing?.targetAmount ?? 0);
  const [targetDate, setTargetDate] = useState(
    existing?.targetDate ?? defaultTargetDate()
  );

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setUnit(existing.unit);
    setTargetAmount(existing.targetAmount);
    setTargetDate(existing.targetDate);
  }, [existing?.id]);

  const saved = existing ? savedAmount(contributions, existing.id) : 0;
  const months = monthsLeft(targetDate);
  const monthly = useMemo(
    () => monthlyRequired(targetAmount, saved, months),
    [targetAmount, saved, months]
  );
  const unitMeta = goalUnitMeta(unit);

  const canSave =
    title.trim().length > 0 &&
    targetAmount > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(targetDate) &&
    targetDate >= todayISO();

  const save = () => {
    if (!canSave) return;
    const id = upsertGoal({
      id: existing?.id,
      title: title.trim(),
      targetAmount,
      targetDate,
      unit,
    });
    if (isEdit) {
      router.back();
    } else {
      router.replace(`/goals/${id}`);
    }
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(
      'Hedefi kaldır',
      `"${existing.title.trim() || 'Hedef'}" soft-delete ile kaldırılır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => {
            softDeleteGoal(existing.id);
            router.replace('/goals');
          },
        },
      ]
    );
  };

  if (editId && !existing) {
    return (
      <Screen>
        <StepHeader title="Hedef bulunamadı" onBack={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          {isEdit ? (
            <Button label="Hedefi kaldır" variant="secondary" onPress={remove} />
          ) : null}
          <Button
            label={isEdit ? 'Güncelle' : 'Hedefi kaydet'}
            disabled={!canSave}
            onPress={save}
          />
        </View>
      }
    >
      <StepHeader
        title={isEdit ? 'Hedefi düzenle' : 'Hedef ekle'}
        subtitle="Döviz veya altın (gram) cinsinden hedef tutar; aylık ayrım aynı birimde hesaplanır."
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        <Text variant="label" color={colors.textSecondary}>
          Hedef adı
        </Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Örn. Yaz tatili / 50 gr altın"
          placeholderTextColor={colors.textMuted}
        />

        <Text variant="label" color={colors.textSecondary}>
          Birim
        </Text>
        <View style={styles.chips}>
          {GOAL_UNITS.map((u) => (
            <CategoryChip
              key={u.id}
              label={u.id === 'ALTIN' ? 'Altın (gr)' : u.shortLabel}
              selected={unit === u.id}
              onPress={() => setUnit(u.id)}
            />
          ))}
        </View>
        <Text variant="caption" color={colors.textMuted}>
          {unitMeta.label}
          {unit === 'ALTIN' ? ' — miktar gram olarak girilir' : ''}
        </Text>

        <AmountField
          label={unitMeta.amountLabel}
          value={targetAmount}
          onChange={setTargetAmount}
        />

        <DateField
          label="Hedef tarih"
          value={targetDate}
          onChange={(iso) => {
            if (iso) setTargetDate(iso);
          }}
          minimumDate={new Date()}
        />

        {targetAmount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? (
          <View style={styles.preview}>
            <Text variant="label" color={colors.textMuted}>
              AYLIK AYRIM
            </Text>
            <Text variant="amountLg" color={colors.primary}>
              {formatGoalAmount(monthly, unit)}
            </Text>
            <Text variant="caption" color={colors.textMuted}>
              {months > 0
                ? `${months} ay içinde · birikmiş ${formatGoalAmount(saved, unit)}`
                : `Kalan tek seferde · birikmiş ${formatGoalAmount(saved, unit)}`}
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { gap: spacing.md },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    minHeight: 52,
  },
  preview: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryTint,
    gap: spacing.xs,
  },
});
