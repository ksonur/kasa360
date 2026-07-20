import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CreditCard, Pencil, Receipt, Trash2, Wallet } from 'lucide-react-native';
import { Button, Card, Screen, StepHeader, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  activeInstallments,
  paymentsForPeriod,
  periodLabel,
  remainingInstallments,
  summarizeCard,
  useCards,
} from '@/features/cards';
import { useFinance } from '@/features/finance';
import { reconcileCardPeriod } from '@/features/insights';

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useOnboarding();
  const {
    statements,
    payments,
    installments,
    softDeletePayment,
    softDeleteInstallment,
  } = useCards();
  const { activeExpenses, addExpense } = useFinance();

  const card = data.cards.find((c) => c.id === id);

  if (!card) {
    return (
      <Screen>
        <StepHeader title="Kart bulunamadı" onBack={() => router.back()} />
      </Screen>
    );
  }

  const summary = summarizeCard(card, statements, payments, installments);
  const period = summary.period;
  const periodPayments = paymentsForPeriod(payments, card.id, period);
  const cardInstallments = activeInstallments(installments).filter(
    (i) => i.creditCardId === card.id || (i.paymentMethod === 'kredi_karti' && !i.creditCardId)
  );
  const reconcile = reconcileCardPeriod(
    statements,
    activeExpenses,
    card.id,
    period
  );

  const confirmGap = () => {
    if (reconcile.gap <= 0) return;
    Alert.alert(
      'Detaylandırılmamış harcama',
      `Ekstre ile girilen harcamalar arasında ${formatCurrency(reconcile.gap)} fark var. Bu tutarı tek seferlik gider olarak eklemek ister misin? (Bütçeye ekstre ayrıca eklenmez.)`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ekle',
          onPress: () => {
            void addExpense({
              amount: reconcile.gap,
              date: `${period}-01`,
              categoryId: 'diger',
              customLabel: 'Detaylandırılmamış ekstre',
              paymentMethod: 'kredi_karti',
              creditCardId: card.id,
              statementPeriod: period,
              note: 'detaylandirilmamis_ekstre',
            });
          },
        },
      ]
    );
  };

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          <Button
            label="Ekstre gir"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: '/cards/statement', params: { cardId: card.id } })
            }
          />
          <Button
            label="Ödeme yap"
            onPress={() =>
              router.push({ pathname: '/cards/pay', params: { cardId: card.id } })
            }
          />
        </View>
      }
    >
      <StepHeader
        title={card.name.trim() || 'Kredi kartı'}
        subtitle={`${periodLabel(period)} · Limit ${formatCurrency(card.limit)}`}
        onBack={() => router.back()}
      />
      <Pressable
        style={styles.editCardLink}
        onPress={() =>
          router.push({ pathname: '/cards/edit', params: { id: card.id } })
        }
      >
        <Pencil size={16} color={colors.primary} />
        <Text variant="caption" color={colors.primary}>
          Kart bilgilerini düzenle
        </Text>
      </Pressable>

      <Card style={styles.hero}>
        <View style={styles.heroIcon}>
          <CreditCard size={22} color={colors.primary} />
        </View>
        <Text variant="label" color={colors.textMuted}>
          DÖNEM KALAN
        </Text>
        <Text variant="amountLg" color={colors.expense}>
          {formatCurrency(summary.remaining)}
        </Text>
        <Text variant="caption" color={colors.textMuted}>
          Ekstre {formatCurrency(summary.statementAmount)} − Ödenen{' '}
          {formatCurrency(summary.paid)}
        </Text>
        {summary.dueInDays != null ? (
          <Text variant="caption" color={colors.primary}>
            Son ödeme {summary.dueInDays} gün içinde
          </Text>
        ) : null}
        {summary.nextInstallmentLoad > 0 ? (
          <Text variant="caption" color={colors.primary}>
            Gelecek ay taksit yükü {formatCurrency(summary.nextInstallmentLoad)}
          </Text>
        ) : null}
      </Card>

      {reconcile.hasStatement ? (
        <Card
          outlined
          elevated={false}
          style={
            reconcile.gap !== 0
              ? { ...styles.reconcile, ...styles.reconcileWarn }
              : styles.reconcile
          }
        >
          <Text variant="label" color={colors.textMuted}>
            EKSTRE UZLAŞTIRMA
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Ekstre {formatCurrency(reconcile.statementAmount)} · Harcamalar{' '}
            {formatCurrency(reconcile.transactionsTotal)}
          </Text>
          {reconcile.matched ? (
            <Text variant="callout" color={colors.income}>
              Dönem eşleşti — çift sayım yok.
            </Text>
          ) : reconcile.gap > 0 ? (
            <>
              <Text variant="callout" color={colors.expense}>
                Detaylandırılmamış fark: {formatCurrency(reconcile.gap)}
              </Text>
              <Pressable onPress={confirmGap} style={styles.reconcileAction}>
                <Text variant="caption" color={colors.primary}>
                  Farkı gider olarak ekle (onaylı)
                </Text>
              </Pressable>
            </>
          ) : (
            <Text variant="callout" color={colors.textSecondary}>
              Girilen harcamalar ekstreden{' '}
              {formatCurrency(Math.abs(reconcile.gap))} fazla.
            </Text>
          )}
        </Card>
      ) : null}

      <View style={styles.section}>
        <Text variant="heading">Ödeme geçmişi</Text>
        {periodPayments.length === 0 ? (
          <Text variant="callout" color={colors.textMuted} style={styles.pad}>
            Bu dönemde ödeme yok.
          </Text>
        ) : (
          periodPayments.map((p) => (
            <View key={p.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Wallet size={16} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text variant="subheading">{formatCurrency(p.amount)}</Text>
                <Text variant="caption" color={colors.textMuted}>
                  {p.date}
                  {p.note ? ` · ${p.note}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Alert.alert('Ödemeyi sil', 'Kayıt soft-delete ile kaldırılır.', [
                    { text: 'Vazgeç', style: 'cancel' },
                    {
                      text: 'Sil',
                      style: 'destructive',
                      onPress: () => softDeletePayment(p.id),
                    },
                  ]);
                }}
              >
                <Text variant="caption" color={colors.danger}>
                  Sil
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text variant="heading">Aktif taksitler</Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/cards/installment',
                params: { cardId: card.id },
              })
            }
            hitSlop={8}
          >
            <Text variant="caption" color={colors.primary}>
              Ekle
            </Text>
          </Pressable>
        </View>
        {cardInstallments.length === 0 ? (
          <Text variant="callout" color={colors.textMuted} style={styles.pad}>
            Bu karta bağlı taksit yok.
          </Text>
        ) : (
          cardInstallments.map((i) => {
            const rem = remainingInstallments(i);
            return (
              <View key={i.id} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Receipt size={16} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text variant="subheading">{i.itemName}</Text>
                  <Text variant="caption" color={colors.textMuted}>
                    {formatCurrency(i.monthlyAmount)}/ay · {rem}/{i.installmentCount}{' '}
                    kaldı
                  </Text>
                </View>
                <View style={styles.rowActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Taksiti düzenle"
                    hitSlop={8}
                    onPress={() =>
                      router.push({
                        pathname: '/cards/installment',
                        params: { id: i.id, cardId: card.id },
                      })
                    }
                  >
                    <Pencil size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Taksiti sil"
                    hitSlop={8}
                    onPress={() => {
                      Alert.alert(
                        'Taksiti sil',
                        `"${i.itemName}" kaydı soft-delete ile kaldırılır.`,
                        [
                          { text: 'Vazgeç', style: 'cancel' },
                          {
                            text: 'Sil',
                            style: 'destructive',
                            onPress: () => softDeleteInstallment(i.id),
                          },
                        ]
                      );
                    }}
                  >
                    <Trash2 size={18} color={colors.danger} />
                  </Pressable>
                </View>
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
  editCardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  hero: {
    marginTop: spacing.lg,
    gap: spacing.xs,
    padding: spacing.xl,
  },
  reconcile: {
    marginTop: spacing.lg,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  reconcileWarn: {
    borderColor: colors.expense,
  },
  reconcileAction: { marginTop: spacing.sm },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  section: { marginTop: spacing['2xl'], gap: spacing.md },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  footer: { gap: spacing.md },
});
