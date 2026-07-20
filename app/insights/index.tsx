import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  CalendarRange,
  FileBarChart,
  Lightbulb,
  SlidersHorizontal,
} from 'lucide-react-native';
import { Card, Screen, StepHeader, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import { useFinance } from '@/features/finance';
import { categorySpendThisMonth } from '@/features/insights';

export default function InsightsHubScreen() {
  const { data } = useOnboarding();
  const { activeExpenses } = useFinance();
  const insight = categorySpendThisMonth(
    activeExpenses,
    data.routineExpenses
  );

  return (
    <Screen scroll>
      <StepHeader
        title="İçgörüler"
        subtitle="What-if, nakit akışı ve kategori özeti."
        onBack={() => router.back()}
      />

      {insight.headline ? (
        <Card style={styles.headline}>
          <Lightbulb size={20} color={colors.primary} />
          <Text variant="callout" style={styles.flex}>
            {insight.headline}
          </Text>
        </Card>
      ) : null}

      <View style={styles.list}>
        <Pressable
          style={styles.row}
          onPress={() => router.push('/reports')}
        >
          <View style={styles.icon}>
            <FileBarChart size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text variant="subheading">Raporlar</Text>
            <Text variant="caption" color={colors.textMuted}>
              Bütçe özeti, kategori eğilimi, hedefler
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={() => router.push('/insights/what-if')}
        >
          <View style={styles.icon}>
            <SlidersHorizontal size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text variant="subheading">What-if hesaplayıcı</Text>
            <Text variant="caption" color={colors.textMuted}>
              Fazla harcama → hedef gecikmesi
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={() => router.push('/insights/cashflow')}
        >
          <View style={styles.icon}>
            <CalendarRange size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text variant="subheading">Nakit akışı takvimi</Text>
            <Text variant="caption" color={colors.textMuted}>
              Ay içi ödeme yoğunluğu
            </Text>
          </View>
        </Pressable>
      </View>

      {insight.rows.length > 0 ? (
        <View style={styles.section}>
          <Text variant="heading">Bu ay kategoriler</Text>
          {insight.rows.slice(0, 5).map((r) => (
            <View key={r.categoryId} style={styles.catRow}>
              <Text variant="callout" style={styles.flex}>
                {r.label}
              </Text>
              <Text variant="subheading">
                {r.amount.toLocaleString('tr-TR')} ₺
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headline: {
    marginTop: spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  list: { marginTop: spacing.xl, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: spacing['2xl'], gap: spacing.sm },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
