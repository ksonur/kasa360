import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AmountField,
  Button,
  CategoryChip,
  DateField,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  openPeriodForCard,
  periodLabel,
  remainingForPeriod,
  useCards,
} from '@/features/cards';
import { todayISO } from '@/features/finance';
import { formatCurrency } from '@/theme';

export default function PayCardScreen() {
  const { cardId: paramCardId } = useLocalSearchParams<{ cardId?: string }>();
  const { data } = useOnboarding();
  const { statements, payments, addPayment } = useCards();
  const cards = data.cards;

  const [cardId, setCardId] = useState(paramCardId ?? cards[0]?.id ?? '');
  const statementPeriod = useMemo(
    () => (cardId ? openPeriodForCard(statements, cardId) : null),
    [cardId, statements]
  );
  const remaining =
    cardId && statementPeriod
      ? remainingForPeriod(statements, payments, cardId, statementPeriod)
      : 0;

  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  useEffect(() => {
    if (remaining > 0) setAmount(remaining);
  }, [cardId, statementPeriod, remaining]);

  const save = () => {
    if (!cardId || amount <= 0 || !statementPeriod) return;
    addPayment({
      creditCardId: cardId,
      amount,
      date,
      statementPeriod,
      note: note.trim() || undefined,
    });
    router.back();
  };

  if (cards.length === 0) {
    return (
      <Screen>
        <StepHeader title="Ödeme yap" onBack={() => router.back()} />
        <Text variant="callout" color={colors.textMuted} style={styles.pad}>
          Önce bir kredi kartı eklemelisin.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Ödemeyi kaydet"
          disabled={!cardId || amount <= 0 || !statementPeriod}
          onPress={save}
        />
      }
    >
      <StepHeader
        title="Karta ödeme"
        subtitle={
          statementPeriod
            ? remaining > 0
              ? `${periodLabel(statementPeriod)} kalan: ${formatCurrency(remaining)}`
              : `${periodLabel(statementPeriod)} · kalan yok (istediğin tutarı yaz)`
            : 'Önce bu kart için ekstre gir.'
        }
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

        {statementPeriod ? (
          <Text variant="caption" color={colors.textMuted}>
            Ekstre dönemi: {periodLabel(statementPeriod)}
          </Text>
        ) : (
          <Text variant="caption" color={colors.danger}>
            Bu kartta ekstre yok. Önce ekstre gir, sonra ödeme kaydet.
          </Text>
        )}

        <AmountField label="Ödeme tutarı" value={amount} onChange={setAmount} />

        <DateField
          label="Tarih"
          value={date}
          onChange={(iso) => {
            if (iso) setDate(iso);
          }}
        />

        <Text variant="label" color={colors.textSecondary}>
          Not (opsiyonel)
        </Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Örn. Minimum ödeme"
          placeholderTextColor={colors.textMuted}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    minHeight: 52,
  },
  pad: { marginTop: spacing.xl },
});
