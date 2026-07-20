import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  CalendarClock,
  CreditCard,
  ShieldCheck,
} from 'lucide-react-native';
import { Card, Screen, StepHeader, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import { useFinance } from '@/features/finance';
import { useCards } from '@/features/cards';
import { useAssets } from '@/features/assets';
import { deriveDashboardFromOnboarding } from '@/features/onboarding/deriveDashboard';
import {
  offsetLabel,
  plannedInNextDays,
  useNotifications,
} from '@/features/notifications';
import type { UpcomingPayment } from '@/features/dashboard/mockData';

const KIND_META: Record<
  UpcomingPayment['kind'],
  { icon: ReactNode }
> = {
  card: { icon: <CreditCard size={18} color={colors.primary} /> },
  expense: { icon: <CalendarClock size={18} color={colors.primary} /> },
  tax: { icon: <CalendarClock size={18} color={colors.primary} /> },
  insurance: { icon: <ShieldCheck size={18} color={colors.primary} /> },
};

export default function UpcomingScreen() {
  const { data } = useOnboarding();
  const { activeExpenses } = useFinance();
  const { statements, payments, installments } = useCards();
  const { assets, obligations } = useAssets();
  const { planned, preferences } = useNotifications();
  const d = deriveDashboardFromOnboarding(
    data,
    activeExpenses,
    {
      statements,
      payments,
      installments,
    },
    [],
    [],
    { goals: [], contributions: [] },
    [],
    { assets, obligations }
  );
  const upcomingReminders = plannedInNextDays(planned, 7);

  return (
    <Screen scroll>
      <StepHeader
        title="Yaklaşan ödemeler"
        subtitle="Son 31 günde vadesi gelen kart, vergi ve sigorta."
        onBack={() => router.back()}
      />

      <Card outlined elevated={false} style={styles.list}>
        {d.upcoming.length === 0 ? (
          <Text variant="callout" color={colors.textMuted} style={styles.empty}>
            Önümüzdeki 31 günde yaklaşan ödeme yok.
          </Text>
        ) : (
          d.upcoming.map((item, i) => {
            const urgent = item.dueInDays <= 3;
            const soon = item.dueInDays <= 7;
            const badgeBg = urgent
              ? colors.dangerTint
              : soon
                ? colors.warningTint
                : colors.surfaceAlt;
            const badgeFg = urgent
              ? colors.danger
              : soon
                ? colors.warning
                : colors.textSecondary;
            return (
              <View key={item.id}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.row}>
                  <View style={styles.icon}>{KIND_META[item.kind].icon}</View>
                  <View style={styles.flex}>
                    <Text variant="subheading">{item.title}</Text>
                    <Text variant="caption" color={colors.textMuted}>
                      {item.detail}
                    </Text>
                  </View>
                  <View style={styles.right}>
                    <Text variant="subheading">
                      {item.amount > 0 ? formatCurrency(item.amount) : '—'}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                      <Text variant="caption" color={badgeFg}>
                        {item.dueInDays} gün
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </Card>

      {preferences.enabled ? (
        <View style={styles.reminders}>
          <Text variant="heading" style={styles.remindersTitle}>
            Planlanan hatırlatmalar
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Önümüzdeki 7 günde tetiklenecek kademeli bildirimler.
          </Text>
          <Card outlined elevated={false} style={styles.listPad}>
            {upcomingReminders.length === 0 ? (
              <Text
                variant="callout"
                color={colors.textMuted}
                style={styles.empty}
              >
                Bu hafta planlı hatırlatma yok.
              </Text>
            ) : (
              upcomingReminders.map((r, i) => (
                <View key={r.dedupeKey}>
                  {i > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <Text variant="subheading">{r.title}</Text>
                      <Text variant="caption" color={colors.textMuted}>
                        {offsetLabel(r.offsetDays)} · vade {r.dueDate}
                      </Text>
                    </View>
                    <Text variant="caption" color={colors.primary}>
                      {new Date(r.fireAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  empty: { paddingVertical: spacing.xl },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  reminders: { marginTop: spacing['2xl'], gap: spacing.sm },
  remindersTitle: { marginBottom: spacing.xs },
  listPad: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
});
