import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
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
import { EXPENSE_CATEGORIES } from '@/features/onboarding/categories';
import { useOnboarding } from '@/features/onboarding/store';
import {
  PAYMENT_METHODS,
  shiftISO,
  todayISO,
  useFinance,
  type PaymentMethod,
} from '@/features/finance';

type Phase = 'category' | 'details' | 'payment';

export default function OneTimeExpenseScreen() {
  const { data } = useOnboarding();
  const { addExpense } = useFinance();
  const [phase, setPhase] = useState<Phase>('category');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [creditCardId, setCreditCardId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cards = data.cards;
  const step = phase === 'category' ? 1 : phase === 'details' ? 2 : 3;

  const canProceedCategory = !!categoryId && (categoryId !== 'diger' || customLabel.trim().length > 0);
  const canProceedDetails = amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const canSave =
    !!paymentMethod &&
    (paymentMethod !== 'kredi_karti' || !!creditCardId || cards.length === 0);

  const datePresets = useMemo(
    () => [
      { label: 'Bugün', value: todayISO() },
      { label: 'Dün', value: shiftISO(-1) },
    ],
    []
  );

  const save = async () => {
    if (!categoryId || !paymentMethod) return;
    setBusy(true);
    setError(null);
    try {
      await addExpense({
        amount,
        date,
        categoryId,
        customLabel: categoryId === 'diger' ? customLabel.trim() : undefined,
        paymentMethod,
        creditCardId:
          paymentMethod === 'kredi_karti' ? creditCardId ?? cards[0]?.id : undefined,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt başarısız');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        phase === 'category' ? (
          <Button
            label="Devam et"
            disabled={!canProceedCategory}
            onPress={() => setPhase('details')}
          />
        ) : phase === 'details' ? (
          <Button
            label="Devam et"
            disabled={!canProceedDetails}
            onPress={() => setPhase('payment')}
          />
        ) : (
          <Button label="Kaydet" disabled={!canSave} loading={busy} onPress={save} />
        )
      }
    >
      <StepHeader
        step={step}
        totalSteps={3}
        title="Tek seferlik gider"
        subtitle="Plansız bir harcama gir. Ödeme yöntemi zorunlu."
        onBack={() => {
          if (phase === 'category') router.back();
          else if (phase === 'details') setPhase('category');
          else setPhase('details');
        }}
      />

      {phase === 'category' ? (
        <View style={styles.block}>
          <Text variant="label" color={colors.textSecondary}>
            Kategori
          </Text>
          <View style={styles.chips}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={cat.label}
                selected={categoryId === cat.id}
                onPress={() => setCategoryId(cat.id)}
              />
            ))}
          </View>
          {categoryId === 'diger' ? (
            <TextInput
              style={styles.input}
              value={customLabel}
              onChangeText={setCustomLabel}
              placeholder="Gider adı"
              placeholderTextColor={colors.textMuted}
            />
          ) : null}
        </View>
      ) : null}

      {phase === 'details' ? (
        <View style={styles.block}>
          <AmountField label="Tutar" value={amount} onChange={setAmount} />
          <Text variant="label" color={colors.textSecondary}>
            Tarih
          </Text>
          <View style={styles.chips}>
            {datePresets.map((p) => (
              <CategoryChip
                key={p.label}
                label={p.label}
                selected={date === p.value}
                onPress={() => setDate(p.value)}
              />
            ))}
          </View>
          <DateField
            label="Takvimden seç"
            value={date}
            onChange={(iso) => {
              if (iso) setDate(iso);
            }}
          />
        </View>
      ) : null}

      {phase === 'payment' ? (
        <View style={styles.block}>
          <Text variant="label" color={colors.textSecondary}>
            Ödeme yöntemi
          </Text>
          <View style={styles.methodList}>
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => {
                  setPaymentMethod(m.id);
                  if (m.id !== 'kredi_karti') setCreditCardId(undefined);
                }}
                style={[
                  styles.methodRow,
                  paymentMethod === m.id && styles.methodRowSelected,
                ]}
              >
                <Text
                  variant="subheading"
                  color={paymentMethod === m.id ? colors.primary : colors.text}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {paymentMethod === 'kredi_karti' && cards.length > 0 ? (
            <View style={styles.gap}>
              <Text variant="label" color={colors.textSecondary}>
                Kart seç
              </Text>
              {cards.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCreditCardId(c.id)}
                  style={[
                    styles.methodRow,
                    creditCardId === c.id && styles.methodRowSelected,
                  ]}
                >
                  <Text variant="callout">{c.name.trim() || 'Kredi kartı'}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {paymentMethod === 'kredi_karti' && cards.length === 0 ? (
            <Text variant="caption" color={colors.textMuted}>
              Kayıtlı kart yok — gider yine de kredi kartı olarak işaretlenecek.
            </Text>
          ) : null}

          {error ? (
            <Text variant="caption" color={colors.danger}>
              {error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  gap: { gap: spacing.sm },
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
  methodList: { gap: spacing.sm },
  methodRow: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  methodRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
});
