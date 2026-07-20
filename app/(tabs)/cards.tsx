import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CreditCard, Plus } from 'lucide-react-native';
import { Card, ProgressBar, Screen, SectionHeader, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  periodLabel,
  summarizeCard,
  useCards,
} from '@/features/cards';

export default function CardsTab() {
  const { data } = useOnboarding();
  const { statements, payments, installments } = useCards();
  const cards = data.cards;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="title">Kartlar</Text>
        <Text variant="callout" color={colors.textSecondary}>
          Açık ekstre kalanı
        </Text>
      </View>

      <Pressable
        style={styles.addRow}
        onPress={() => router.push('/cards/edit')}
      >
        <View style={styles.addIcon}>
          <Plus size={20} color={colors.onPrimary} />
        </View>
        <View style={styles.flex}>
          <Text variant="subheading">Kart ekle</Text>
          <Text variant="caption" color={colors.textMuted}>
            Limit, ekstre ve son ödeme günü
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.addRowSecondary}
        onPress={() => router.push('/cards/installment')}
      >
        <View style={styles.addIconSecondary}>
          <Plus size={20} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text variant="subheading">Taksitli alışveriş ekle</Text>
          <Text variant="caption" color={colors.textMuted}>
            Gelecek ay yükünü hesapla
          </Text>
        </View>
      </Pressable>

      {cards.length === 0 ? (
        <Card outlined elevated={false} style={styles.empty}>
          <CreditCard size={32} color={colors.primary} />
          <Text variant="callout" color={colors.textMuted} style={styles.emptyText}>
            Henüz kredi kartı yok. Yukarıdan “Kart ekle” ile ekleyebilirsin.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          <SectionHeader title="Kartlarım" />
          {cards.map((card) => {
            const s = summarizeCard(card, statements, payments, installments);
            const usage =
              card.limit > 0 ? Math.min(1, s.remaining / card.limit) : 0;
            return (
              <Pressable
                key={card.id}
                onPress={() => router.push(`/cards/${card.id}`)}
              >
                <Card style={styles.cardItem}>
                  <View style={styles.cardHead}>
                    <View style={styles.cardIcon}>
                      <CreditCard size={18} color={colors.primary} />
                    </View>
                    <View style={styles.flex}>
                      <Text variant="subheading">
                        {card.name.trim() || 'Kredi kartı'}
                      </Text>
                      <Text variant="caption" color={colors.textMuted}>
                        {s.statementAmount > 0
                          ? `${periodLabel(s.period)} · `
                          : ''}
                        {s.dueInDays != null
                          ? `${s.dueInDays} gün içinde son ödeme`
                          : 'Son ödeme günü yok'}
                      </Text>
                    </View>
                  </View>
                  <ProgressBar progress={usage} height={6} />
                  <View style={styles.stats}>
                    <View>
                      <Text variant="caption" color={colors.textMuted}>
                        Kalan
                      </Text>
                      <Text variant="subheading" color={colors.expense}>
                        {formatCurrency(s.remaining)}
                      </Text>
                    </View>
                    <View>
                      <Text variant="caption" color={colors.textMuted}>
                        Taksit yükü
                      </Text>
                      <Text
                        variant="subheading"
                        color={
                          s.nextInstallmentLoad > 0
                            ? colors.primary
                            : colors.textSecondary
                        }
                      >
                        {s.nextInstallmentLoad > 0
                          ? formatCurrency(s.nextInstallmentLoad)
                          : '—'}
                      </Text>
                    </View>
                    <View>
                      <Text variant="caption" color={colors.textMuted}>
                        Limit
                      </Text>
                      <Text variant="subheading">{formatCurrency(card.limit)}</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: spacing.xs, marginTop: spacing.sm },
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
  cardItem: { gap: spacing.md, padding: spacing.lg },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
});
