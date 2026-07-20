import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Screen, StepHeader, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import { useFinance } from '@/features/finance';
import { useCards } from '@/features/cards';
import { useAssets } from '@/features/assets';
import {
  buildCashflowMonth,
  dayIntensity,
  type CashflowDay,
} from '@/features/insights';

function intensityColor(intensity: number): string {
  if (intensity <= 0) return colors.surfaceAlt;
  if (intensity < 0.33) return colors.primaryTint;
  if (intensity < 0.66) return colors.primarySoft;
  return colors.primary;
}

export default function CashflowScreen() {
  const { data } = useOnboarding();
  const { activeExpenses } = useFinance();
  const { statements, payments } = useCards();
  const { assets, obligations } = useAssets();
  const month = useMemo(
    () =>
      buildCashflowMonth(
        data.routineExpenses,
        activeExpenses,
        data.cards,
        statements,
        payments,
        assets,
        obligations
      ),
    [
      data.routineExpenses,
      data.cards,
      activeExpenses,
      statements,
      payments,
      assets,
      obligations,
    ]
  );

  const [selected, setSelected] = useState<CashflowDay | null>(null);

  return (
    <Screen scroll>
      <StepHeader
        title="Nakit akışı"
        subtitle={`${month.period} · toplam yük ${formatCurrency(month.monthTotal)}`}
        onBack={() => router.back()}
      />

      <View style={styles.grid}>
        {month.days.map((d) => {
          const intensity = dayIntensity(d.total, month.maxDayTotal);
          const selectedDay = selected?.day === d.day;
          return (
            <Pressable
              key={d.day}
              onPress={() => setSelected(d.total > 0 ? d : null)}
              style={[
                styles.cell,
                { backgroundColor: intensityColor(intensity) },
                selectedDay && styles.cellSelected,
              ]}
            >
              <Text
                variant="caption"
                color={intensity >= 0.66 ? colors.onPrimary : colors.text}
              >
                {d.day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="caption" color={colors.textMuted} style={styles.hint}>
        Koyu gün = daha yüksek ödeme yükü. Rutin, tek seferlik, kart ve varlık
        yükümlülükleri.
      </Text>

      {selected && selected.total > 0 ? (
        <Card style={styles.detail}>
          <Text variant="heading">
            {selected.day}. gün · {formatCurrency(selected.total)}
          </Text>
          {selected.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text variant="callout" style={styles.flex}>
                {item.title}
              </Text>
              <Text variant="subheading">{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: {
    marginTop: spacing['2xl'],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: colors.primaryDarker,
  },
  hint: { marginTop: spacing.md },
  detail: { marginTop: spacing.xl, gap: spacing.sm, padding: spacing.lg },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
