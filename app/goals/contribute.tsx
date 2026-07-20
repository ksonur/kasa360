import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AmountField,
  Button,
  DateField,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import {
  formatGoalAmount,
  goalUnitMeta,
  summarizeGoal,
  useGoals,
} from '@/features/goals';
import { todayISO } from '@/features/finance';

export default function GoalContributeScreen() {
  const { goalId: paramGoalId } = useLocalSearchParams<{ goalId?: string }>();
  const { goals, contributions, addContribution } = useGoals();

  const goal = paramGoalId
    ? goals.find((g) => g.id === paramGoalId && g.deletedAt == null)
    : null;

  const summary = goal ? summarizeGoal(goal, contributions) : null;
  const suggested = summary?.monthlyRequired ?? 0;
  const unit = goal?.unit ?? 'TRY';

  const [amount, setAmount] = useState(suggested > 0 ? suggested : 0);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  const canSave = !!goal && amount > 0;

  const save = () => {
    if (!canSave || !goal) return;
    addContribution({
      goalId: goal.id,
      amount,
      date,
      note: note.trim() || undefined,
    });
    router.back();
  };

  if (!goal) {
    return (
      <Screen>
        <StepHeader title="Katkı ekle" onBack={() => router.back()} />
        <Text variant="callout" color={colors.textMuted} style={styles.pad}>
          Hedef bulunamadı.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={<Button label="Kaydet" disabled={!canSave} onPress={save} />}
    >
      <StepHeader
        title="Katkı ekle"
        subtitle={`${goal.title.trim() || 'Hedef'} · ${goalUnitMeta(unit).label} · kalan ${formatGoalAmount(summary?.remaining ?? 0, unit)}`}
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        {suggested > 0 ? (
          <Text variant="caption" color={colors.textMuted}>
            Önerilen aylık ayrım: {formatGoalAmount(suggested, unit)}
          </Text>
        ) : null}

        <AmountField
          label={goalUnitMeta(unit).amountLabel}
          value={amount}
          onChange={setAmount}
        />

        <DateField
          label="Tarih"
          value={date}
          onChange={(iso) => {
            if (iso) setDate(iso);
          }}
        />

        <Text variant="label" color={colors.textSecondary}>
          Not (opsiyonel)
        </Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Örn. Maaştan ayırdım"
          placeholderTextColor={colors.textMuted}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  pad: { padding: spacing.lg },
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
});
