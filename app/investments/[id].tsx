import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartLine,
  LineChart,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { Button, Card, Screen, StepHeader, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  displayBalance,
  formatReturnPct,
  monthOverMonthPct,
  movementsForPlatform,
  periodLabel,
  platformSharePct,
  portfolioTotal,
  snapshotsForPlatform,
  useInvestments,
  yearOverYearPct,
} from '@/features/investments';

export default function InvestmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useOnboarding();
  const {
    movements,
    snapshots,
    softDeleteMovement,
    softDeleteSnapshot,
  } = useInvestments();

  const platform = data.investments.find((p) => p.id === id);

  if (!platform) {
    return (
      <Screen>
        <StepHeader title="Platform bulunamadı" onBack={() => router.back()} />
      </Screen>
    );
  }

  const balance = displayBalance(
    platform.balance,
    movements,
    snapshots,
    platform.id
  );
  const total = portfolioTotal(data.investments, movements, snapshots);
  const share = platformSharePct(balance, total);
  const mom = monthOverMonthPct(snapshots, platform.id, undefined, movements);
  const yoy = yearOverYearPct(snapshots, platform.id, undefined, movements);
  const history = movementsForPlatform(movements, platform.id);
  const monthBalances = snapshotsForPlatform(snapshots, platform.id);

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          <Button
            label="Aylık bakiye gir"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/investments/balance',
                params: { platformId: platform.id },
              })
            }
          />
          <View style={styles.footerRow}>
            <View style={styles.flex}>
              <Button
                label="Para yatır"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/investments/move',
                    params: { platformId: platform.id, type: 'yatirma' },
                  })
                }
              />
            </View>
            <View style={styles.flex}>
              <Button
                label="Para çek"
                onPress={() =>
                  router.push({
                    pathname: '/investments/move',
                    params: { platformId: platform.id, type: 'cekme' },
                  })
                }
              />
            </View>
          </View>
        </View>
      }
    >
      <StepHeader
        title={platform.platform.trim() || 'Platform'}
        subtitle={`Açılış ${formatCurrency(platform.balance)} · pay %${share}`}
        onBack={() => router.back()}
      />

      <View style={styles.linkRow}>
        <Pressable
          style={styles.editLink}
          onPress={() =>
            router.push({
              pathname: '/investments/edit',
              params: { id: platform.id },
            })
          }
        >
          <Pencil size={16} color={colors.primary} />
          <Text variant="caption" color={colors.primary}>
            Düzenle
          </Text>
        </Pressable>
        <Pressable
          style={styles.editLink}
          onPress={() =>
            router.push({
              pathname: '/investments/chart',
              params: { platformId: platform.id },
            })
          }
        >
          <ChartLine size={16} color={colors.primary} />
          <Text variant="caption" color={colors.primary}>
            Grafik
          </Text>
        </Pressable>
      </View>

      <Card style={styles.hero}>
        <View style={styles.heroIcon}>
          <LineChart size={22} color={colors.primary} />
        </View>
        <Text variant="label" color={colors.textMuted}>
          GÜNCEL BAKİYE
        </Text>
        <Text variant="amountLg">{formatCurrency(balance)}</Text>
        <View style={styles.returnRow}>
          <View>
            <Text variant="caption" color={colors.textMuted}>
              Getiri (ay)
            </Text>
            <Text
              variant="subheading"
              color={
                mom == null
                  ? colors.textMuted
                  : mom >= 0
                    ? colors.income
                    : colors.expense
              }
            >
              {formatReturnPct(mom)}
            </Text>
          </View>
          <View>
            <Text variant="caption" color={colors.textMuted}>
              Getiri (yıl)
            </Text>
            <Text
              variant="subheading"
              color={
                yoy == null
                  ? colors.textMuted
                  : yoy >= 0
                    ? colors.income
                    : colors.expense
              }
            >
              {formatReturnPct(yoy)}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <Text variant="heading">Aylık bakiyeler</Text>
        {monthBalances.length === 0 ? (
          <Text variant="callout" color={colors.textMuted} style={styles.pad}>
            Henüz aylık bakiye yok. Kar-zarar için ay sonu tutarını gir.
          </Text>
        ) : (
          monthBalances.map((s) => (
            <View key={s.id} style={styles.row}>
              <View style={styles.flex}>
                <Text variant="subheading">{periodLabel(s.period)}</Text>
                <Text variant="caption" color={colors.textMuted}>
                  {formatCurrency(s.balance)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Aylık bakiyeyi sil"
                hitSlop={8}
                onPress={() => {
                  Alert.alert(
                    'Aylık bakiyeyi sil',
                    'Kayıt soft-delete ile kaldırılır.',
                    [
                      { text: 'Vazgeç', style: 'cancel' },
                      {
                        text: 'Sil',
                        style: 'destructive',
                        onPress: () => softDeleteSnapshot(s.id),
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

      <View style={styles.section}>
        <Text variant="heading">Hareket geçmişi</Text>
        {history.length === 0 ? (
          <Text variant="callout" color={colors.textMuted} style={styles.pad}>
            Henüz yatırma/çekme yok.
          </Text>
        ) : (
          history.map((m) => {
            const isIn = m.type === 'yatirma';
            return (
              <View key={m.id} style={styles.row}>
                <View
                  style={[
                    styles.rowIcon,
                    isIn ? styles.rowIconIn : styles.rowIconOut,
                  ]}
                >
                  {isIn ? (
                    <ArrowDownLeft size={16} color={colors.income} />
                  ) : (
                    <ArrowUpRight size={16} color={colors.expense} />
                  )}
                </View>
                <View style={styles.flex}>
                  <Text variant="subheading">
                    {isIn ? 'Yatırma' : 'Çekme'} · {formatCurrency(m.amount)}
                  </Text>
                  <Text variant="caption" color={colors.textMuted}>
                    {m.date}
                    {m.note ? ` · ${m.note}` : ''}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Hareketi sil"
                  hitSlop={8}
                  onPress={() => {
                    Alert.alert(
                      'Hareketi sil',
                      'Kayıt soft-delete ile kaldırılır.',
                      [
                        { text: 'Vazgeç', style: 'cancel' },
                        {
                          text: 'Sil',
                          style: 'destructive',
                          onPress: () => softDeleteMovement(m.id),
                        },
                      ]
                    );
                  }}
                >
                  <Trash2 size={18} color={colors.danger} />
                </Pressable>
              </View>
            );
          })
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
    gap: spacing.xs,
    padding: spacing.xl,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  returnRow: {
    flexDirection: 'row',
    gap: spacing['2xl'],
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconIn: { backgroundColor: colors.incomeTint },
  rowIconOut: { backgroundColor: colors.expenseTint },
  footer: { gap: spacing.md },
  footerRow: { flexDirection: 'row', gap: spacing.md },
});
