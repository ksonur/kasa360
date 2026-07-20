import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  CategoryChip,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  BalanceTrendChart,
  chartSeriesForPlatform,
  chartSeriesPortfolio,
  formatReturnPct,
  netCashFlowBetweenPeriods,
  performancePct,
  useInvestments,
} from '@/features/investments';

export default function InvestmentChartScreen() {
  const { platformId: paramPlatformId } = useLocalSearchParams<{
    platformId?: string;
  }>();
  const { data } = useOnboarding();
  const { snapshots, movements } = useInvestments();
  const platforms = data.investments;

  const [platformId, setPlatformId] = useState<string | 'all'>(
    paramPlatformId ?? 'all'
  );

  const points = useMemo(() => {
    if (platformId === 'all') {
      return chartSeriesPortfolio(
        snapshots,
        platforms.map((p) => p.id),
        movements
      );
    }
    return chartSeriesForPlatform(snapshots, platformId, movements);
  }, [platformId, snapshots, platforms, movements]);

  const last = points[points.length - 1];
  const first = points[0];
  const rangeNet =
    first && last
      ? platformId === 'all'
        ? platforms.reduce(
            (s, p) =>
              s +
              netCashFlowBetweenPeriods(
                movements,
                p.id,
                first.period,
                last.period
              ),
            0
          )
        : netCashFlowBetweenPeriods(
            movements,
            platformId,
            first.period,
            last.period
          )
      : 0;
  const rangePct =
    first && last
      ? performancePct(last.balance, first.balance, rangeNet)
      : null;

  const title =
    platformId === 'all'
      ? 'Portföy grafiği'
      : platforms.find((p) => p.id === platformId)?.platform.trim() ||
        'Platform grafiği';

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Aylık bakiye gir"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/investments/balance',
              params:
                platformId !== 'all' ? { platformId } : undefined,
            })
          }
        />
      }
    >
      <StepHeader
        title={title}
        subtitle="Getiri; para yatırma/çekme hariç tutulur."
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        {platforms.length > 0 ? (
          <>
            <Text variant="label" color={colors.textSecondary}>
              Kapsam
            </Text>
            <View style={styles.chips}>
              <CategoryChip
                label="Tüm portföy"
                selected={platformId === 'all'}
                onPress={() => setPlatformId('all')}
              />
              {platforms.map((p) => (
                <CategoryChip
                  key={p.id}
                  label={p.platform.trim() || 'Platform'}
                  selected={platformId === p.id}
                  onPress={() => setPlatformId(p.id)}
                />
              ))}
            </View>
          </>
        ) : null}

        <Card style={styles.chartCard}>
          <BalanceTrendChart points={points} height={220} />
        </Card>

        {last ? (
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text variant="caption" color={colors.textMuted}>
                Son bakiye
              </Text>
              <Text variant="subheading">{formatCurrency(last.balance)}</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="caption" color={colors.textMuted}>
                Son ay getiri
              </Text>
              <Text
                variant="subheading"
                color={
                  last.momPct == null
                    ? colors.textMuted
                    : last.momPct >= 0
                      ? colors.income
                      : colors.expense
                }
              >
                {formatReturnPct(last.momPct)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text variant="caption" color={colors.textMuted}>
                Dönem toplam
              </Text>
              <Text
                variant="subheading"
                color={
                  rangePct == null
                    ? colors.textMuted
                    : rangePct >= 0
                      ? colors.income
                      : colors.expense
                }
              >
                {formatReturnPct(rangePct)}
              </Text>
            </View>
          </View>
        ) : (
          <Text variant="callout" color={colors.textMuted}>
            Grafik çizmek için aylık bakiye kayıtları gerekli.
          </Text>
        )}

        {points.length > 0 ? (
          <View style={styles.list}>
            <Text variant="heading">Aylık getiri</Text>
            {[...points].reverse().map((p) => (
              <View key={p.period} style={styles.row}>
                <Text variant="callout" style={styles.flex}>
                  {p.label}
                </Text>
                <Text variant="subheading">{formatCurrency(p.balance)}</Text>
                <Text
                  variant="caption"
                  color={
                    p.momPct == null
                      ? colors.textMuted
                      : p.momPct >= 0
                        ? colors.income
                        : colors.expense
                  }
                  style={styles.pct}
                >
                  {formatReturnPct(p.momPct)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chartCard: { padding: spacing.md },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  stat: { flex: 1, gap: spacing.xs },
  list: { gap: spacing.sm, marginTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  flex: { flex: 1 },
  pct: { minWidth: 48, textAlign: 'right' },
});
