import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AmountField, Button, CategoryChip, Screen, StepHeader, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  currentPeriod,
  periodLabel,
  statementForPeriod,
  useCards,
} from '@/features/cards';

function shiftPeriod(period: string, delta: number): string {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}

export default function StatementScreen() {
  const { cardId: paramCardId } = useLocalSearchParams<{ cardId?: string }>();
  const { data } = useOnboarding();
  const { statements, upsertStatement } = useCards();
  const cards = data.cards;

  const [cardId, setCardId] = useState(paramCardId ?? cards[0]?.id ?? '');
  /** TR akışı: açık ekstre genelde geçen ay. */
  const [period, setPeriod] = useState(() =>
    shiftPeriod(currentPeriod(), -1)
  );
  const existing = useMemo(
    () => (cardId ? statementForPeriod(statements, cardId, period) : null),
    [statements, cardId, period]
  );
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    setAmount(existing?.amount ?? 0);
  }, [existing?.id, existing?.amount, cardId, period]);

  const save = () => {
    if (!cardId || amount <= 0) return;
    upsertStatement({ creditCardId: cardId, period, amount });
    router.back();
  };

  if (cards.length === 0) {
    return (
      <Screen>
        <StepHeader title="Ekstre gir" onBack={() => router.back()} />
        <Text variant="callout" color={colors.textMuted} style={styles.pad}>
          Önce bir kredi kartı eklemelisin.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll footer={<Button label="Kaydet" disabled={!cardId || amount <= 0} onPress={save} />}>
      <StepHeader
        title="Ekstre gir"
        subtitle="Ekstre tutarı bütçe harcamasına eklenmez; doğrulama içindir."
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        <Text variant="label" color={colors.textSecondary}>
          Kart
        </Text>
        <View style={styles.chips}>
          {cards.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name.trim() || 'Kart'}
              selected={cardId === c.id}
              onPress={() => setCardId(c.id)}
            />
          ))}
        </View>

        <Text variant="label" color={colors.textSecondary}>
          Dönem
        </Text>
        <View style={styles.chips}>
          {[0, -1].map((delta) => {
            const p = shiftPeriod(currentPeriod(), delta);
            return (
              <CategoryChip
                key={p}
                label={periodLabel(p)}
                selected={period === p}
                onPress={() => setPeriod(p)}
              />
            );
          })}
        </View>

        <AmountField label="Ekstre tutarı" value={amount} onChange={setAmount} />
        {existing ? (
          <Text variant="caption" color={colors.textMuted}>
            Mevcut kayıt güncellenecek · {formatCurrency(existing.amount)}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pad: { marginTop: spacing.xl },
});
