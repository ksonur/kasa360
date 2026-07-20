import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChartLine, LineChart, Plus } from 'lucide-react-native';
import { Card, ProgressBar, Screen, SectionHeader, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  formatReturnPct,
  portfolioTotal,
  summarizePlatforms,
  useInvestments,
} from '@/features/investments';

export default function InvestmentsTab() {
  const { data } = useOnboarding();
  const { movements, snapshots } = useInvestments();
  const platforms = data.investments;
  const total = portfolioTotal(platforms, movements, snapshots);
  const summaries = summarizePlatforms(platforms, movements, snapshots);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="title">Yatırım</Text>
        <Text variant="callout" color={colors.textSecondary}>
          Aylık bakiye ile geçen ay / yıl kar-zarar
        </Text>
      </View>

      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            <Text variant="label" color={colors.textMuted}>
              TOPLAM PORTFÖY
            </Text>
            <Text variant="amountLg">{formatCurrency(total)}</Text>
            <Text variant="caption" color={colors.textMuted}>
              {platforms.length} platform
            </Text>
          </View>
          <Pressable
            style={styles.chartBtn}
            onPress={() => router.push('/investments/chart')}
            accessibilityRole="button"
            accessibilityLabel="Aylık değişim grafiği"
          >
            <ChartLine size={22} color={colors.onPrimary} />
            <Text variant="caption" color={colors.onPrimary}>
              Grafik
            </Text>
          </Pressable>
        </View>
      </Card>

      <Pressable
        style={styles.addRow}
        onPress={() => router.push('/investments/edit')}
      >
        <View style={styles.addIcon}>
          <Plus size={20} color={colors.onPrimary} />
        </View>
        <View style={styles.flex}>
          <Text variant="subheading">Platform ekle</Text>
          <Text variant="caption" color={colors.textMuted}>
            Ad ve açılış bakiyesi
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.addRowSecondary}
        onPress={() => router.push('/investments/balance')}
      >
        <View style={styles.addIconSecondary}>
          <Plus size={20} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text variant="subheading">Aylık bakiye gir</Text>
          <Text variant="caption" color={colors.textMuted}>
            Kar-zarar oranını hesapla
          </Text>
        </View>
      </Pressable>

      {platforms.length === 0 ? (
        <Card outlined elevated={false} style={styles.empty}>
          <LineChart size={32} color={colors.primary} />
          <Text variant="callout" color={colors.textMuted} style={styles.emptyText}>
            Henüz platform yok. Yukarıdan ekleyebilirsin.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          <SectionHeader title="Platformlar" />
          {summaries.map((s) => (
            <Pressable
              key={s.platform.id}
              onPress={() => router.push(`/investments/${s.platform.id}`)}
            >
              <Card style={styles.item}>
                <View style={styles.itemHead}>
                  <View style={styles.itemIcon}>
                    <LineChart size={18} color={colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <Text variant="subheading">
                      {s.platform.platform.trim() || 'Platform'}
                    </Text>
                    <Text variant="caption" color={colors.textMuted}>
                      Portföy payı %{s.sharePct}
                      {!s.hasCurrentSnapshot ? ' · bu ay bakiyesi yok' : ''}
                    </Text>
                  </View>
                  <Text variant="subheading">{formatCurrency(s.balance)}</Text>
                </View>
                <ProgressBar
                  progress={total > 0 ? Math.min(1, s.balance / total) : 0}
                  height={6}
                />
                <View style={styles.returnRow}>
                  <Text
                    variant="caption"
                    color={
                      s.momPct == null
                        ? colors.textMuted
                        : s.momPct >= 0
                          ? colors.income
                          : colors.expense
                    }
                  >
                    Ay {formatReturnPct(s.momPct)}
                  </Text>
                  <Text
                    variant="caption"
                    color={
                      s.yoyPct == null
                        ? colors.textMuted
                        : s.yoyPct >= 0
                          ? colors.income
                          : colors.expense
                    }
                  >
                    Yıl {formatReturnPct(s.yoyPct)}
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
  header: { gap: spacing.xs, marginTop: spacing.sm },
  hero: {
    marginTop: spacing.xl,
    gap: spacing.xs,
    padding: spacing.xl,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  chartBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    minWidth: 72,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addRowSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
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
  addIconSecondary: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
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
  returnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
