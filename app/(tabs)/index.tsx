import { useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  CreditCard,
  Home,
  Lightbulb,
  Plus,
  Receipt,
  ShieldCheck,
  Target,
  Wallet,
  X,
} from 'lucide-react-native';
import { Card, ProgressBar, SectionHeader, Text } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import type { UpcomingPayment } from '@/features/dashboard/mockData';
import { useOnboarding } from '@/features/onboarding/store';
import {
  cardDebtTotalFrom,
  cardLimitTotalFrom,
  deriveDashboardFromOnboarding,
  portfolioTotalFrom,
} from '@/features/onboarding/deriveDashboard';
import { useFinance } from '@/features/finance';
import { useCards } from '@/features/cards';
import { useInvestments } from '@/features/investments';
import { formatGoalAmount, isGoalUnit, useGoals } from '@/features/goals';
import { useAssets } from '@/features/assets';
import {
  buildMotivationMessages,
  pickMotivationHeadline,
  useProfile,
} from '@/features/profile';
import { currentPeriod } from '@/features/cards';

export default function DashboardScreen() {
  const { data } = useOnboarding();
  const { activeExpenses, activeExtraIncomes } = useFinance();
  const { statements, payments, installments } = useCards();
  const { movements: investmentMovements, snapshots: investmentSnapshots } =
    useInvestments();
  const { goals, contributions } = useGoals();
  const { assets, obligations } = useAssets();
  const { profile, displayName } = useProfile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const d = deriveDashboardFromOnboarding(
    data,
    activeExpenses,
    {
      statements,
      payments,
      installments,
    },
    investmentMovements,
    investmentSnapshots,
    { goals, contributions },
    activeExtraIncomes,
    { assets, obligations }
  );
  const userName = displayName(d.userName);
  const period = currentPeriod();
  const paymentsThisMonth = payments.filter(
    (p) => p.deletedAt == null && p.date.startsWith(period)
  ).length;
  const motivation = pickMotivationHeadline(
    buildMotivationMessages({
      profile,
      fallbackName: d.userName,
      goals,
      paymentsThisMonth,
    })
  );
  const remaining = d.remaining;
  const denom = d.income > 0 ? d.income : 1;
  const spentRatio = Math.min(1, (d.spent + d.plannedExpense) / denom);
  const portfolio = portfolioTotalFrom(d.investments);
  const cardLimits = cardLimitTotalFrom(d.cards);
  const cardDebt = cardDebtTotalFrom(d.cards);

  const go = (
    href:
      | '/expenses/one-time'
      | '/income/edit'
      | '/expenses/routines'
      | '/income/extra'
      | '/insights'
      | '/reports'
      | '/assets/edit'
  ) => {
    setSheetOpen(false);
    router.push(href);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDarker]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.topBar}>
              <View>
                <Text variant="callout" color={colors.primaryTint}>
                  Merhaba, {userName}
                </Text>
                <Text variant="label" color={colors.primarySoft}>
                  {d.monthLabel}
                </Text>
              </View>
              <View style={styles.topActions}>
                <Pressable
                  style={styles.iconBtn}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Raporlar"
                  onPress={() => router.push('/reports')}
                >
                  <Lightbulb size={20} color={colors.onPrimary} />
                </Pressable>
                <Pressable
                  style={styles.iconBtn}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Yaklaşan ödemeler"
                  onPress={() => router.push('/upcoming')}
                >
                  <Bell size={20} color={colors.onPrimary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.heroBody}>
              <Text variant="label" color={colors.primaryTint}>
                BU AY KALAN
              </Text>
              <Text variant="amountLg" color={colors.onPrimary}>
                {formatCurrency(remaining)}
              </Text>

              <View style={styles.heroBarWrap}>
                <ProgressBar
                  progress={spentRatio}
                  height={10}
                  trackColor="rgba(255,255,255,0.25)"
                  fillColor={colors.onPrimary}
                />
                <View style={styles.heroLegend}>
                  <Text variant="caption" color={colors.primaryTint}>
                    {formatCurrency(d.spent)} tek seferlik
                  </Text>
                  <Text variant="caption" color={colors.primaryTint}>
                    {formatCurrency(d.plannedExpense)} planlı
                  </Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          {motivation ? (
            <Pressable
              style={styles.insightBanner}
              onPress={() => router.push('/goals')}
            >
              <Target size={18} color={colors.primary} />
              <Text variant="callout" style={styles.flex} color={colors.textSecondary}>
                {motivation}
              </Text>
            </Pressable>
          ) : null}

          {d.insightHeadline ? (
            <Pressable
              style={styles.insightBanner}
              onPress={() => router.push('/reports')}
            >
              <Lightbulb size={18} color={colors.primary} />
              <Text variant="callout" style={styles.flex} color={colors.textSecondary}>
                {d.insightHeadline}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.statRow}>
            <StatCard
              label="Gelir"
              amount={d.income}
              color={colors.income}
              icon={<ArrowUpRight size={16} color={colors.income} />}
              tint={colors.incomeTint}
            />
            <StatCard
              label="Harcanan"
              amount={d.spent}
              color={colors.expense}
              icon={<ArrowDownRight size={16} color={colors.expense} />}
              tint={colors.expenseTint}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Yaklaşan ödemeler" />
            <Card outlined elevated={false} style={styles.listCard}>
              {d.upcoming.length === 0 ? (
                <Text variant="callout" color={colors.textMuted} style={styles.emptyPad}>
                  Henüz yaklaşan ödeme yok.
                </Text>
              ) : (
                d.upcoming.map((p, i) => (
                  <View key={p.id}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <UpcomingRow item={p} />
                  </View>
                ))
              )}
            </Card>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Kredi kartları"
              actionLabel={
                d.cards.length
                  ? cardDebt > 0
                    ? `${formatCurrency(cardDebt)} kalan`
                    : `${formatCurrency(cardLimits)} limit`
                  : undefined
              }
            />
            {d.cards.length === 0 ? (
              <Card outlined elevated={false}>
                <Text variant="callout" color={colors.textMuted} style={styles.emptyPad}>
                  Kayıtlı kredi kartı yok.
                </Text>
              </Card>
            ) : (
              <View style={styles.cardList}>
                {d.cards.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => router.push(`/cards/${c.id}`)}
                  >
                    <Card style={styles.debtCard}>
                      <View style={styles.debtHead}>
                        <View style={styles.debtIcon}>
                          <CreditCard size={18} color={colors.primary} />
                        </View>
                        <View style={styles.flex}>
                          <Text variant="subheading">{c.name}</Text>
                          <Text variant="caption" color={colors.textMuted}>
                            {c.dueInDays} gün içinde son ödeme
                          </Text>
                        </View>
                      </View>
                      <View style={styles.debtStats}>
                        <View>
                          <Text variant="caption" color={colors.textMuted}>
                            Kalan
                          </Text>
                          <Text variant="subheading">
                            {c.statementAmount > 0
                              ? formatCurrency(c.statementAmount)
                              : '—'}
                          </Text>
                        </View>
                        <View>
                          <Text variant="caption" color={colors.textMuted}>
                            Taksit yükü
                          </Text>
                          <Text
                            variant="subheading"
                            color={
                              c.nextInstallmentLoad > 0
                                ? colors.primary
                                : colors.textSecondary
                            }
                          >
                            {c.nextInstallmentLoad > 0
                              ? formatCurrency(c.nextInstallmentLoad)
                              : '—'}
                          </Text>
                        </View>
                        <View>
                          <Text variant="caption" color={colors.textMuted}>
                            Limit
                          </Text>
                          <Text variant="subheading">
                            {formatCurrency(c.limit)}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Hedefler"
              actionLabel="Tümü"
              onAction={() => router.push('/goals')}
            />
            {d.goals.length === 0 ? (
              <Pressable onPress={() => router.push('/goals/edit')}>
                <Card outlined elevated={false}>
                  <View style={styles.goalEmpty}>
                    <View style={styles.goalIcon}>
                      <Target size={18} color={colors.primary} />
                    </View>
                    <Text
                      variant="callout"
                      color={colors.textMuted}
                      style={styles.flex}
                    >
                      Henüz hedef yok. Hedef ekle.
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ) : (
              <Card outlined elevated={false} style={styles.listCard}>
                {d.goals.slice(0, 3).map((g, i) => {
                  const progress =
                    g.target > 0 ? Math.min(1, g.saved / g.target) : 0;
                  const unit = isGoalUnit(g.unit) ? g.unit : 'TRY';
                  return (
                    <View key={g.id}>
                      {i > 0 ? <View style={styles.divider} /> : null}
                      <Pressable
                        style={styles.goalRow}
                        onPress={() => router.push(`/goals/${g.id}`)}
                      >
                        <View style={styles.goalIcon}>
                          <Target size={18} color={colors.primary} />
                        </View>
                        <View style={styles.flex}>
                          <Text variant="subheading">{g.title}</Text>
                          <Text variant="caption" color={colors.textMuted}>
                            {g.monthsLeft > 0
                              ? `${g.monthsLeft} ay kaldı`
                              : 'Son tarih'}{' '}
                            · {formatGoalAmount(g.saved, unit)} /{' '}
                            {formatGoalAmount(g.target, unit)}
                          </Text>
                          <View style={styles.goalBar}>
                            <ProgressBar progress={progress} height={6} />
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
            <SectionHeader
              title="Varlıklar"
              actionLabel="Tümü"
              onAction={() => router.push('/assets')}
            />
            {d.assets.length === 0 ? (
              <Pressable onPress={() => router.push('/assets/edit')}>
                <Card outlined elevated={false}>
                  <View style={styles.goalEmpty}>
                    <View style={styles.goalIcon}>
                      <Home size={18} color={colors.primary} />
                    </View>
                    <Text
                      variant="callout"
                      color={colors.textMuted}
                      style={styles.flex}
                    >
                      Ev, arsa veya araç ekle.
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ) : (
              <Card outlined elevated={false} style={styles.listCard}>
                {d.assets.slice(0, 3).map((a, i) => (
                  <View key={a.id}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <Pressable
                      style={styles.goalRow}
                      onPress={() => router.push(`/assets/${a.id}`)}
                    >
                      <View style={styles.goalIcon}>
                        <Home size={18} color={colors.primary} />
                      </View>
                      <View style={styles.flex}>
                        <Text variant="subheading">{a.name}</Text>
                        <Text variant="caption" color={colors.textMuted}>
                          {a.typeLabel}
                          {' · '}
                          {formatCurrency(a.estimatedValue)}
                          {a.nextDueInDays != null
                            ? a.nextDueInDays === 0
                              ? ` · ${a.nextKindLabel} bugün`
                              : ` · ${a.nextKindLabel} ${a.nextDueInDays}g`
                            : ''}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                ))}
              </Card>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Yatırım portföyü"
              actionLabel={d.investments.length ? formatCurrency(portfolio) : undefined}
            />
            <Card outlined elevated={false} style={styles.listCard}>
              {d.investments.length === 0 ? (
                <Text variant="callout" color={colors.textMuted} style={styles.emptyPad}>
                  Kayıtlı yatırım platformu yok.
                </Text>
              ) : (
                d.investments.map((inv, i) => (
                  <View key={inv.id}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <Pressable
                      style={styles.invRow}
                      onPress={() => router.push(`/investments/${inv.id}`)}
                    >
                      <View style={styles.flex}>
                        <Text variant="subheading">{inv.platform}</Text>
                        <Text
                          variant="caption"
                          color={
                            inv.changePct === 0
                              ? colors.textMuted
                              : inv.changePct > 0
                                ? colors.income
                                : colors.expense
                          }
                        >
                          {inv.changePct === 0
                            ? 'Getiri —'
                            : `Getiri ${inv.changePct > 0 ? '+' : ''}${inv.changePct}%`}
                        </Text>
                      </View>
                      <Text variant="subheading">{formatCurrency(inv.balance)}</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </Card>
          </View>
        </View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="Hızlı ekle"
        onPress={() => setSheetOpen(true)}
      >
        <Plus size={26} color={colors.onPrimary} />
      </Pressable>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHead}>
              <Text variant="heading">Hızlı ekle</Text>
              <Pressable onPress={() => setSheetOpen(false)} hitSlop={8}>
                <X size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <SheetAction
              icon={<Receipt size={20} color={colors.primary} />}
              title="Tek seferlik gider"
              subtitle="Plansız harcama gir"
              onPress={() => go('/expenses/one-time')}
            />
            <SheetAction
              icon={<Wallet size={20} color={colors.primary} />}
              title="Geliri düzenle"
              subtitle="Maaş ve mesai"
              onPress={() => go('/income/edit')}
            />
            <SheetAction
              icon={<CalendarClock size={20} color={colors.primary} />}
              title="Rutin giderler"
              subtitle="Listele ve düzenle"
              onPress={() => go('/expenses/routines')}
            />
            <SheetAction
              icon={<Wallet size={20} color={colors.primary} />}
              title="Plansız gelir"
              subtitle="Freelance, hediye, iade"
              onPress={() => go('/income/extra')}
            />
            <SheetAction
              icon={<Lightbulb size={20} color={colors.primary} />}
              title="Raporlar"
              subtitle="Bütçe, eğilim ve hedefler"
              onPress={() => go('/reports')}
            />
            <SheetAction
              icon={<Lightbulb size={20} color={colors.primary} />}
              title="İçgörüler"
              subtitle="What-if ve nakit akışı"
              onPress={() => go('/insights')}
            />
            <SheetAction
              icon={<Home size={20} color={colors.primary} />}
              title="Varlık ekle"
              subtitle="Ev, arsa, araç"
              onPress={() => go('/assets/edit')}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SheetAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
    >
      <View style={styles.sheetIcon}>{icon}</View>
      <View style={styles.flex}>
        <Text variant="subheading">{title}</Text>
        <Text variant="caption" color={colors.textMuted}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function StatCard({
  label,
  amount,
  color,
  tint,
  icon,
}: {
  label: string;
  amount: number;
  color: string;
  tint: string;
  icon: ReactNode;
}) {
  return (
    <Card outlined elevated={false} style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>{icon}</View>
      <Text variant="label" color={colors.textMuted}>
        {label}
      </Text>
      <Text variant="amount" color={color}>
        {formatCurrency(amount)}
      </Text>
    </Card>
  );
}

const KIND_META: Record<UpcomingPayment['kind'], { icon: ReactNode }> = {
  card: { icon: <CreditCard size={18} color={colors.primary} /> },
  expense: { icon: <CalendarClock size={18} color={colors.primary} /> },
  tax: { icon: <CalendarClock size={18} color={colors.primary} /> },
  insurance: { icon: <ShieldCheck size={18} color={colors.primary} /> },
};

function UpcomingRow({ item }: { item: UpcomingPayment }) {
  const urgent = item.dueInDays <= 3;
  const soon = item.dueInDays <= 7;
  const badgeBg = urgent ? colors.dangerTint : soon ? colors.warningTint : colors.surfaceAlt;
  const badgeFg = urgent ? colors.danger : soon ? colors.warning : colors.textSecondary;

  return (
    <View style={styles.upRow}>
      <View style={styles.upIcon}>{KIND_META[item.kind].icon}</View>
      <View style={styles.flex}>
        <Text variant="subheading">{item.title}</Text>
        <Text variant="caption" color={colors.textMuted}>
          {item.detail}
        </Text>
      </View>
      <View style={styles.upRight}>
        <Text variant="subheading">
          {item.amount > 0 ? formatCurrency(item.amount) : '—'}
        </Text>
        <View style={[styles.dueBadge, { backgroundColor: badgeBg }]}>
          <Text variant="caption" color={badgeFg}>
            {item.dueInDays} gün
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing['5xl'] },

  hero: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    borderBottomLeftRadius: radius['2xl'],
    borderBottomRightRadius: radius['2xl'],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: { marginTop: spacing.xl, gap: spacing.xs },
  heroBarWrap: { marginTop: spacing.lg, gap: spacing.sm },
  heroLegend: { flexDirection: 'row', justifyContent: 'space-between' },

  content: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  statRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, gap: spacing.sm, padding: spacing.lg },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { marginTop: spacing['2xl'] },
  listCard: { paddingVertical: spacing.xs, paddingHorizontal: spacing.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  emptyPad: { paddingVertical: spacing.lg },

  upRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  upIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upRight: { alignItems: 'flex-end', gap: spacing.xs },
  dueBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },

  cardList: { gap: spacing.md },
  debtCard: { gap: spacing.md, padding: spacing.lg },
  debtHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  debtStats: { flexDirection: 'row', justifyContent: 'space-between' },
  debtIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryTint,
  },
  goalEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  goalBar: { marginTop: spacing.sm },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  invRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },

  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing['2xl'],
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  fabPressed: { transform: [{ scale: 0.94 }] },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetRowPressed: { backgroundColor: colors.primaryTint },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
