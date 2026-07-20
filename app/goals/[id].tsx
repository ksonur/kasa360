import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, SlidersHorizontal, Target, Trash2, Wallet } from 'lucide-react-native';
import {
  Button,
  Card,
  ProgressBar,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import {
  contributionsForGoal,
  formatGoalAmount,
  goalUnitMeta,
  summarizeGoal,
  useGoals,
} from '@/features/goals';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    goals,
    contributions,
    softDeleteContribution,
    setGoalStatus,
  } = useGoals();

  const goal = goals.find((g) => g.id === id && g.deletedAt == null);

  if (!goal) {
    return (
      <Screen>
        <StepHeader title="Hedef bulunamadı" onBack={() => router.back()} />
      </Screen>
    );
  }

  const summary = summarizeGoal(goal, contributions);
  const history = contributionsForGoal(contributions, goal.id);
  const unitLabel = goalUnitMeta(goal.unit).label;

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          <Button
            label="Katkı ekle"
            onPress={() =>
              router.push({
                pathname: '/goals/contribute',
                params: { goalId: goal.id },
              })
            }
          />
          {goal.status === 'aktif' && summary.remaining <= 0 ? (
            <Button
              label="Hedefi tamamla"
              variant="secondary"
              onPress={() => {
                setGoalStatus(goal.id, 'tamamlandi');
                router.back();
              }}
            />
          ) : null}
        </View>
      }
    >
      <StepHeader
        title={goal.title.trim() || 'Hedef'}
        subtitle={`${unitLabel} · ${goal.targetDate} · ${formatGoalAmount(goal.targetAmount, goal.unit)}`}
        onBack={() => router.back()}
      />

      <View style={styles.linkRow}>
        <Pressable
          style={styles.editLink}
          onPress={() =>
            router.push({ pathname: '/goals/edit', params: { id: goal.id } })
          }
        >
          <Pencil size={16} color={colors.primary} />
          <Text variant="caption" color={colors.primary}>
            Düzenle
          </Text>
        </Pressable>
        <Pressable
          style={styles.editLink}
          onPress={() => router.push('/insights/what-if')}
        >
          <SlidersHorizontal size={16} color={colors.primary} />
          <Text variant="caption" color={colors.primary}>
            What-if
          </Text>
        </Pressable>
      </View>

      <Card style={styles.hero}>
        <View style={styles.heroIcon}>
          <Target size={22} color={colors.primary} />
        </View>
        <Text variant="label" color={colors.textMuted}>
          BİRİKEN
        </Text>
        <Text variant="amountLg">
          {formatGoalAmount(summary.saved, goal.unit)}
        </Text>
        <ProgressBar progress={summary.progress} height={10} />
        <Text variant="caption" color={colors.textMuted}>
          Kalan {formatGoalAmount(summary.remaining, goal.unit)} · %
          {Math.round(summary.progress * 100)}
        </Text>
        <View style={styles.metaRow}>
          <View>
            <Text variant="caption" color={colors.textMuted}>
              Aylık gereken
            </Text>
            <Text variant="subheading" color={colors.primary}>
              {formatGoalAmount(summary.monthlyRequired, goal.unit)}
            </Text>
          </View>
          <View>
            <Text variant="caption" color={colors.textMuted}>
              Kalan süre
            </Text>
            <Text variant="subheading">
              {summary.monthsLeft > 0 ? `${summary.monthsLeft} ay` : 'Bugün'}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <Text variant="heading">Katkı geçmişi</Text>
        {history.length === 0 ? (
          <Text variant="callout" color={colors.textMuted} style={styles.pad}>
            Henüz katkı yok.
          </Text>
        ) : (
          history.map((c) => (
            <View key={c.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Wallet size={16} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text variant="subheading">
                  {formatGoalAmount(c.amount, goal.unit)}
                </Text>
                <Text variant="caption" color={colors.textMuted}>
                  {c.date}
                  {c.note ? ` · ${c.note}` : ''}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Katkıyı sil"
                hitSlop={8}
                onPress={() => {
                  Alert.alert(
                    'Katkıyı sil',
                    'Kayıt soft-delete ile kaldırılır; ilerleyiş güncellenir.',
                    [
                      { text: 'Vazgeç', style: 'cancel' },
                      {
                        text: 'Sil',
                        style: 'destructive',
                        onPress: () => softDeleteContribution(c.id),
                      },
                    ]
                  );
                }}
              >
                <Trash2 size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hero: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  section: { marginTop: spacing['2xl'], gap: spacing.md },
  pad: { paddingVertical: spacing.sm },
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
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { gap: spacing.md },
});
