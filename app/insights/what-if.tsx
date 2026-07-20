import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  AmountField,
  Button,
  CategoryChip,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import {
  activeGoals,
  formatGoalAmount,
  goalUnitMeta,
  monthlyRequired,
  monthsLeft,
  savedAmount,
  useGoals,
} from '@/features/goals';
import { simulateGoalDelay } from '@/features/insights';

export default function WhatIfScreen() {
  const { goals, contributions } = useGoals();
  const aktif = activeGoals(goals);
  const [goalId, setGoalId] = useState(aktif[0]?.id ?? '');

  const goal = aktif.find((g) => g.id === goalId) ?? null;

  const suggestedExtra = useMemo(() => {
    if (!goal) return 0;
    const saved = savedAmount(contributions, goal.id);
    const months = monthsLeft(goal.targetDate);
    return monthlyRequired(goal.targetAmount, saved, months);
  }, [goal, contributions]);

  const [extraSpend, setExtraSpend] = useState(suggestedExtra);

  useEffect(() => {
    setExtraSpend(suggestedExtra > 0 ? suggestedExtra : 0);
  }, [goalId, suggestedExtra]);

  const result = useMemo(() => {
    if (!goal) return null;
    return simulateGoalDelay({ goal, contributions, extraSpend });
  }, [goal, contributions, extraSpend]);

  const unitMeta = goal ? goalUnitMeta(goal.unit) : null;

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Hedeflere git"
          variant="secondary"
          onPress={() => router.push('/goals')}
        />
      }
    >
      <StepHeader
        title="What-if"
        subtitle="Bu ay hedef biriminde ayıramayacağın tutar → gecikme tahmini."
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        {aktif.length === 0 ? (
          <Text variant="callout" color={colors.textMuted}>
            Önce bir birikim hedefi ekle.
          </Text>
        ) : (
          <>
            <Text variant="label" color={colors.textSecondary}>
              Hedef
            </Text>
            <View style={styles.chips}>
              {aktif.map((g) => (
                <CategoryChip
                  key={g.id}
                  label={`${g.title.trim() || 'Hedef'} (${goalUnitMeta(g.unit).shortLabel})`}
                  selected={goalId === g.id}
                  onPress={() => setGoalId(g.id)}
                />
              ))}
            </View>

            {goal && unitMeta ? (
              <>
                <Text variant="caption" color={colors.textMuted}>
                  Simülasyon birimi: {unitMeta.label}. Tutarı bu birimde gir
                  {goal.unit === 'ALTIN' ? ' (gram)' : ''}.
                </Text>

                <AmountField
                  label={
                    goal.unit === 'ALTIN'
                      ? 'Bu ay ayıramayacağın miktar (gram)'
                      : `Bu ay ayıramayacağın tutar (${unitMeta.shortLabel})`
                  }
                  value={extraSpend}
                  onChange={setExtraSpend}
                />

                {result ? (
                  <View style={styles.result}>
                    <Text variant="label" color={colors.textMuted}>
                      SİMÜLASYON ({unitMeta.shortLabel})
                    </Text>
                    <Text variant="callout">
                      Şu an aylık gereken:{' '}
                      <Text variant="subheading">
                        {formatGoalAmount(result.monthlyRequiredNow, goal.unit)}
                      </Text>
                    </Text>
                    <Text variant="callout">
                      Sonra aylık gereken:{' '}
                      <Text variant="subheading" color={colors.expense}>
                        {formatGoalAmount(
                          result.monthlyRequiredAfter,
                          goal.unit
                        )}
                      </Text>
                    </Text>
                    <Text variant="callout" style={styles.mt}>
                      Tahmini gecikme:{' '}
                      <Text variant="subheading" color={colors.primary}>
                        {result.delayMonths > 0
                          ? `+${result.delayMonths} ay`
                          : 'gecikme yok'}
                      </Text>
                    </Text>
                    <Text variant="caption" color={colors.textMuted}>
                      Kalan {formatGoalAmount(result.remaining, goal.unit)} · bu
                      ay {formatGoalAmount(extraSpend, goal.unit)} ayrılamaz
                      varsayılır.
                    </Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  result: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryTint,
    gap: spacing.sm,
  },
  mt: { marginTop: spacing.sm },
});
