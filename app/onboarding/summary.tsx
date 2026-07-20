import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle2, CreditCard, LineChart, Receipt, Wallet } from 'lucide-react-native';
import { Button, Card, ListRow, Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import {
  totalIncome,
  totalRoutineExpense,
  useOnboarding,
} from '@/features/onboarding/store';
import { AUTH_BYPASS, useAuth } from '@/features/auth';

export default function SummaryStep() {
  const { data, setCurrentStep, completeOnboarding } = useOnboarding();
  const { markOnboardingCompleted } = useAuth();
  const [busy, setBusy] = useState(false);
  const income = totalIncome(data);
  const expense = totalRoutineExpense(data);
  const cardLimit = data.cards.reduce((s, c) => s + c.limit, 0);
  const portfolio = data.investments.reduce((s, i) => s + i.balance, 0);
  const remaining = income - expense;

  useEffect(() => {
    setCurrentStep('summary');
  }, [setCurrentStep]);

  const goToPanel = async () => {
    setBusy(true);
    try {
      await completeOnboarding();
      if (!AUTH_BYPASS) {
        const { error } = await markOnboardingCompleted();
        if (error) {
          Alert.alert(
            'Senkron uyarısı',
            `Kurulum kaydedildi ama sunucuya yazılamadı: ${error}`
          );
        }
      }
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        <Button label="Panele git" loading={busy} onPress={goToPanel} />
      }
    >
      <View style={styles.hero}>
        <View style={styles.badge}>
          <CheckCircle2 size={40} color={colors.primary} />
        </View>
        <Text variant="title" center>
          Kurulum tamam!
        </Text>
        <Text variant="body" color={colors.textSecondary} center style={styles.heroText}>
          İşte finansal özetin. Bu bilgileri panelden istediğin zaman
          güncelleyebilirsin.
        </Text>
      </View>

      <Card style={styles.remainingCard} elevated>
        <Text variant="label" color={colors.textOnTint}>
          TAHMİNİ AYLIK KALAN
        </Text>
        <Text variant="amountLg" color={colors.primaryDarker}>
          {formatCurrency(remaining)}
        </Text>
        <Text variant="caption" color={colors.textOnTint}>
          {formatCurrency(income)} gelir − {formatCurrency(expense)} rutin gider
        </Text>
      </Card>

      <Card outlined elevated={false} style={styles.summaryList}>
        <ListRow
          title="Aylık gelir"
          subtitle="Maaş + mesai"
          value={formatCurrency(income)}
          valueColor={colors.income}
          leading={<Wallet size={20} color={colors.primary} />}
        />
        <View style={styles.divider} />
        <ListRow
          title="Rutin giderler"
          subtitle={`${data.routineExpenses.length} kalem`}
          value={formatCurrency(expense)}
          valueColor={colors.expense}
          leading={<Receipt size={20} color={colors.primary} />}
        />
        <View style={styles.divider} />
        <ListRow
          title="Kredi kartları"
          subtitle={`${data.cards.length} kart · toplam limit`}
          value={formatCurrency(cardLimit)}
          leading={<CreditCard size={20} color={colors.primary} />}
        />
        <View style={styles.divider} />
        <ListRow
          title="Yatırım portföyü"
          subtitle={`${data.investments.length} platform`}
          value={formatCurrency(portfolio)}
          valueColor={colors.income}
          leading={<LineChart size={20} color={colors.primary} />}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.md, marginTop: spacing['2xl'] },
  badge: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { maxWidth: 300 },
  remainingCard: {
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing['2xl'],
  },
  summaryList: { marginTop: spacing.lg, paddingVertical: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
