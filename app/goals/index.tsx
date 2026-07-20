import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Plus, SlidersHorizontal, Target } from 'lucide-react-native';
import {
  Card,
  ProgressBar,
  Screen,
  SectionHeader,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import {
  formatGoalAmount,
  goalUnitMeta,
  summarizeActiveGoals,
  useGoals,
} from '@/features/goals';

export default function GoalsListScreen() {
  const { goals, contributions } = useGoals();
  const summaries = summarizeActiveGoals(goals, contributions);

  return (
    <Screen scroll>
      <StepHeader
        title="Hedefler"
        subtitle="Tatil veya satın alım için sanal birikim planları."
        onBack={() => router.back()}
      />

      <Pressable
        style={styles.addRow}
        onPress={() => router.push('/goals/edit')}
      >
        <View style={styles.addIcon}>
          <Plus size={20} color={colors.onPrimary} />
        </View>
        <View style={styles.flex}>
          <Text variant="subheading">Hedef ekle</Text>
          <Text variant="caption" color={colors.textMuted}>
            Tarih, tutar ve aylık ayrım
          </Text>
        </View>
      </Pressable>

      {summaries.length > 0 ? (
        <Pressable
          style={styles.whatIfRow}
          onPress={() => router.push('/insights/what-if')}
        >
          <View style={styles.whatIfIcon}>
            <SlidersHorizontal size={18} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text variant="subheading">What-if</Text>
            <Text variant="caption" color={colors.textMuted}>
              Bu ay ayıramazsam hedef ne kadar gecikir?
            </Text>
          </View>
        </Pressable>
      ) : null}

      {summaries.length === 0 ? (
        <Card outlined elevated={false} style={styles.empty}>
          <Target size={32} color={colors.primary} />
          <Text variant="callout" color={colors.textMuted} style={styles.emptyText}>
            Henüz hedef yok. Yukarıdan ekleyebilirsin.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          <SectionHeader title="Aktif hedefler" />
          {summaries.map((s) => (
            <Pressable
              key={s.goal.id}
              onPress={() => router.push(`/goals/${s.goal.id}`)}
            >
              <Card style={styles.item}>
                <View style={styles.itemHead}>
                  <View style={styles.itemIcon}>
                    <Target size={18} color={colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <Text variant="subheading">
                      {s.goal.title.trim() || 'Hedef'}
                    </Text>
                    <Text variant="caption" color={colors.textMuted}>
                      {goalUnitMeta(s.goal.unit).shortLabel}
                      {' · '}
                      {s.monthsLeft > 0
                        ? `${s.monthsLeft} ay kaldı · aylık ${formatGoalAmount(s.monthlyRequired, s.goal.unit)}`
                        : `Son tarih · kalan ${formatGoalAmount(s.remaining, s.goal.unit)}`}
                    </Text>
                  </View>
                </View>
                <ProgressBar progress={s.progress} height={8} />
                <View style={styles.stats}>
                  <Text variant="caption" color={colors.textMuted}>
                    {formatGoalAmount(s.saved, s.goal.unit)} /{' '}
                    {formatGoalAmount(s.goal.targetAmount, s.goal.unit)}
                  </Text>
                  <Text variant="caption" color={colors.primary}>
                    %{Math.round(s.progress * 100)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing['2xl'],
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatIfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryTint,
  },
  whatIfIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing['2xl'],
  },
  emptyText: { textAlign: 'center' },
  list: { marginTop: spacing.xl, gap: spacing.md },
  item: { gap: spacing.md, padding: spacing.lg },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
