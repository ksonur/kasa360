import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  AmountField,
  Button,
  CategoryChip,
  DayStrip,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/theme';
import { EXPENSE_CATEGORIES } from '@/features/onboarding/categories';
import { RoutineExpenseDraft, useOnboarding } from '@/features/onboarding/store';

const STEP = 2;
const TOTAL = 4;

export default function ExpensesStep() {
  const { data, setRoutineExpenses, setCurrentStep } = useOnboarding();

  useEffect(() => {
    setCurrentStep('expenses');
  }, [setCurrentStep]);

  // categoryId -> taslak eşlemesi (seçim + detay tek yerde tutulur)
  const [map, setMap] = useState<Record<string, RoutineExpenseDraft>>(() =>
    Object.fromEntries(data.routineExpenses.map((e) => [e.categoryId, e]))
  );

  const selectedIds = Object.keys(map);
  const total = useMemo(
    () => Object.values(map).reduce((s, e) => s + e.amount, 0),
    [map]
  );

  function toggle(categoryId: string) {
    setMap((prev) => {
      const next = { ...prev };
      if (next[categoryId]) {
        delete next[categoryId];
      } else {
        next[categoryId] = { categoryId, amount: 0, statementDay: null, dueDay: null };
      }
      return next;
    });
  }

  function update(categoryId: string, patch: Partial<RoutineExpenseDraft>) {
    setMap((prev) => ({ ...prev, [categoryId]: { ...prev[categoryId], ...patch } }));
  }

  function onContinue() {
    setRoutineExpenses(Object.values(map));
    router.push('/onboarding/cards');
  }

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          {selectedIds.length > 0 ? (
            <View style={styles.footerSummary}>
              <Text variant="caption" color={colors.textMuted}>
                {selectedIds.length} gider · aylık
              </Text>
              <Text variant="subheading" color={colors.expense}>
                {formatCurrency(total)}
              </Text>
            </View>
          ) : null}
          <Button
            label={selectedIds.length ? 'Devam et' : 'Şimdilik atla'}
            variant={selectedIds.length ? 'primary' : 'secondary'}
            onPress={onContinue}
          />
        </View>
      }
    >
      <StepHeader
        step={STEP}
        totalSteps={TOTAL}
        title="Rutin giderlerin"
        subtitle="Sana uyan gider türlerini seç; tutar, kesim ve son ödeme gününü gir."
        onBack={() => router.back()}
        onSkip={onContinue}
      />

      <View style={styles.chips}>
        {EXPENSE_CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.label}
            selected={!!map[cat.id]}
            onPress={() => toggle(cat.id)}
          />
        ))}
      </View>

      {selectedIds.length > 0 ? (
        <View style={styles.details}>
          {EXPENSE_CATEGORIES.filter((c) => map[c.id]).map((cat) => {
            const draft = map[cat.id];
            return (
              <View key={cat.id} style={styles.detailCard}>
                <Text variant="subheading">{cat.label}</Text>

                {cat.id === 'diger' ? (
                  <View style={styles.gap}>
                    <Text variant="label" color={colors.textSecondary}>
                      Gider adı
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={draft.customLabel ?? ''}
                      onChangeText={(t) => update(cat.id, { customLabel: t })}
                      placeholder="Örn. Spor salonu"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                ) : null}

                <AmountField
                  label="Aylık tutar"
                  value={draft.amount}
                  onChange={(v) => update(cat.id, { amount: v })}
                />
                <DayStrip
                  label="Kesim günü"
                  value={draft.statementDay}
                  onChange={(d) => update(cat.id, { statementDay: d })}
                />
                <DayStrip
                  label="Son ödeme günü"
                  value={draft.dueDay}
                  onChange={(d) => update(cat.id, { dueDay: d })}
                />
              </View>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
  },
  details: { gap: spacing.md, marginTop: spacing['2xl'] },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  gap: { gap: spacing.xs },
  textInput: {
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
  footer: { gap: spacing.md },
  footerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
