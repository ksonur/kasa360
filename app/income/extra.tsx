import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
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
import {
  PAYMENT_METHODS,
  todayISO,
  useFinance,
  type PaymentMethod,
} from '@/features/finance';

export default function ExtraIncomeScreen() {
  const { addExtraIncome } = useFinance();
  const [sourceLabel, setSourceLabel] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('banka_hesabi');
  const [busy, setBusy] = useState(false);

  const canSave =
    sourceLabel.trim().length > 0 &&
    amount > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date);

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await addExtraIncome({
        amount,
        date,
        sourceLabel: sourceLabel.trim(),
        paymentMethod,
      });
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Kaydet"
          disabled={!canSave || busy}
          onPress={() => void save()}
        />
      }
    >
      <StepHeader
        title="Plansız gelir"
        subtitle="Freelance, hediye, iade vb. — maaş/mesai dışı."
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        <Text variant="label" color={colors.textSecondary}>
          Kaynak
        </Text>
        <TextInput
          style={styles.input}
          value={sourceLabel}
          onChangeText={setSourceLabel}
          placeholder="Örn. Freelance proje"
          placeholderTextColor={colors.textMuted}
        />

        <AmountField label="Tutar" value={amount} onChange={setAmount} />

        <DateField
          label="Tarih"
          value={date}
          onChange={(iso) => {
            if (iso) setDate(iso);
          }}
        />

        <Text variant="label" color={colors.textSecondary}>
          Ödeme yöntemi
        </Text>
        <View style={styles.chips}>
          {PAYMENT_METHODS.map((m) => (
            <CategoryChip
              key={m.id}
              label={m.label}
              selected={paymentMethod === m.id}
              onPress={() => setPaymentMethod(m.id)}
            />
          ))}
        </View>
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
});
