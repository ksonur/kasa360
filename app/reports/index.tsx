import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  CalendarRange,
  FileBarChart,
  SlidersHorizontal,
  Target,
} from 'lucide-react-native';
import {
  Card,
  ProgressBar,
  Screen,
  SectionHeader,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import { useFinance } from '@/features/finance';
import { formatGoalAmount, useGoals } from '@/features/goals';
import {
  budgetSummary,
  categoryTrendMoM,
  goalsReport,
} from '@/features/reports';

export default function ReportsHubScreen() {
  const { data } = useOnboarding();
  const { activeExpenses, activeExtraIncomes } = useFinance();
  const { goals, contributions } = useGoals();

  const budget = budgetSummary(data, activeExpenses, activeExtraIncomes);
  const trend = categoryTrendMoM(activeExpenses, data.routineExpenses);
  const goalsR = goalsReport(goals, contributions);

  return (
    <Screen scroll>
      <StepHeader
        title="Raporlar"
        subtitle={`${budget.monthLabel} · bütçe, eğilim ve hedefler`}
        onBack={() => router.back()}
      />

      {/* In-app widget önizleme */}
      <Card style={styles.widget}>
        <View style={styles.widgetIcon}>
          <FileBarChart size={22} color={colors.onPrimary} />
        </View>
        <Text variant="label" color={colors.primaryTint}>
          BU AY KALAN
        </Text>
        <Text variant="amountLg" color={colors.onPrimary}>
          {formatCurrency(budget.remaining)}
        </Text>
        <Text variant="caption" color={colors.primarySoft}>
          Gelir {formatCurrency(budget.income)} · Harcanan{' '}
          {formatCurrency(budget.spent + budget.plannedExpense)}
        </Text>
        <View style={styles.widgetBar}>
          <ProgressBar
            progress={budget.spentRatio}
            height={8}
            trackColor="rgba(255,255,255,0.25)"
            fillColor={colors.onPrimary}
          />
        </View>
        <Text variant="caption" color={colors.primaryTint}>
          Ayın bitmesine {budget.daysLeftInMonth} gün
        </Text>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Aylık bütçe" />
        <Card outlined elevated={false} style={styles.budgetCard}>
          <Row label="Gelir" value={formatCurrency(budget.income)} />
          <Row
            label="Planlı gider"
            value={formatCurrency(budget.plannedExpense)}
          />
          <Row label="Tek seferlik" value={formatCurrency(budget.spent)} />
          <View style={styles.divider} />
          <Row
            label="Kalan"
            value={formatCurrency(budget.remaining)}
            emphasize
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Kategori eğilimi" />
        {trend.headline ? (
          <Text variant="callout" color={colors.textSecondary} style={styles.pad}>
            {trend.headline}
          </Text>
        ) : null}
        {trend.rows.length === 0 ? (
          <Card outlined elevated={false} style={styles.empty}>
            <Text variant="callout" color={colors.textMuted}>
              Karşılaştırılacak harcama yok.
            </Text>
          </Card>
        ) : (
          <Card outlined elevated={false} style={styles.listCard}>
            {trend.rows.slice(0, 6).map((r, i) => (
              <View key={r.categoryId}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.trendRow}>
                  <View style={styles.flex}>
                    <Text variant="subheading">{r.label}</Text>
                    <Text variant="caption" color={colors.textMuted}>
                      Bu ay {formatCurrency(r.currentAmount)}
                      {r.previousAmount > 0
                        ? ` · geçen ${formatCurrency(r.previousAmount)}`
                        : ''}
                    </Text>
                  </View>
                  <Text
                    variant="subheading"
                    color={
                      r.delta > 0
                        ? colors.expense
                        : r.delta < 0
                          ? colors.income
                          : colors.textSecondary
                    }
                  >
                    {r.deltaPct != null
                      ? `${r.deltaPct > 0 ? '+' : ''}${r.deltaPct}%`
                      : r.delta > 0
                        ? 'yeni'
                        : '—'}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Hedefler"
          actionLabel="Tümü"
          onAction={() => router.push('/goals')}
        />
        {goalsR.headline ? (
          <Text variant="callout" color={colors.textSecondary} style={styles.pad}>
            {goalsR.headline}
          </Text>
        ) : null}
        {goalsR.rows.length === 0 ? (
          <Card outlined elevated={false} style={styles.empty}>
            <Target size={28} color={colors.primary} />
            <Text variant="callout" color={colors.textMuted}>
              Henüz hedef yok.
            </Text>
          </Card>
        ) : (
          <Card outlined elevated={false} style={styles.listCard}>
            {goalsR.rows.slice(0, 5).map((r, i) => {
              const unit = r.summary.goal.unit;
              return (
                <View key={r.summary.goal.id}>
                  {i > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    style={styles.goalRow}
                    onPress={() =>
                      router.push(`/goals/${r.summary.goal.id}`)
                    }
                  >
                    <View style={styles.flex}>
                      <Text variant="subheading">
                        {r.summary.goal.title.trim() || 'Hedef'}
                      </Text>
                      <Text variant="caption" color={colors.textMuted}>
                        {formatGoalAmount(r.summary.saved, unit)} /{' '}
                        {formatGoalAmount(r.summary.goal.targetAmount, unit)}
                        {' · '}
                        {r.statusLabel}
                      </Text>
                      <View style={styles.goalBar}>
                        <ProgressBar progress={r.summary.progress} height={6} />
                      </View>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Araçlar" />
        <Pressable
          style={styles.toolRow}
          onPress={() => router.push('/insights/what-if')}
        >
          <SlidersHorizontal size={18} color={colors.primary} />
          <Text variant="subheading">What-if</Text>
        </Pressable>
        <Pressable
          style={styles.toolRow}
          onPress={() => router.push('/insights/cashflow')}
        >
          <CalendarRange size={18} color={colors.primary} />
          <Text variant="subheading">Nakit akışı</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.budgetRow}>
      <Text
        variant={emphasize ? 'subheading' : 'callout'}
        color={emphasize ? colors.text : colors.textSecondary}
      >
        {label}
      </Text>
      <Text
        variant="subheading"
        color={emphasize ? colors.primary : colors.text}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  widget: {
    marginTop: spacing['2xl'],
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
  },
  widgetIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  widgetBar: { marginTop: spacing.sm },
  section: { marginTop: spacing['2xl'], gap: spacing.sm },
  pad: { marginBottom: spacing.xs },
  budgetCard: { padding: spacing.lg, gap: spacing.md },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  goalRow: { paddingVertical: spacing.md, gap: spacing.sm },
  goalBar: { marginTop: spacing.sm },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
});
