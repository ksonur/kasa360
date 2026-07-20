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
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  computeMonthlyAmount,
  futureLoadByMonth,
  periodLabel,
  useCards,
  type InstallmentPaymentMethod,
} from '@/features/cards';
import { todayISO } from '@/features/finance';

export default function InstallmentScreen() {
  const { id: editId, cardId: paramCardId } = useLocalSearchParams<{
    id?: string;
    cardId?: string;
  }>();
  const { data } = useOnboarding();
  const { addInstallment, updateInstallment, installments } = useCards();
  const cards = data.cards;
  const existing = editId
    ? installments.find((i) => i.id === editId && i.deletedAt == null)
    : null;
  const isEdit = !!existing;

  const [itemName, setItemName] = useState(existing?.itemName ?? '');
  const [total, setTotal] = useState(existing?.totalAmount ?? 0);
  const [count, setCount] = useState(existing?.installmentCount ?? 3);
  const [startDate, setStartDate] = useState(existing?.startDate ?? todayISO());
  const [method, setMethod] = useState<InstallmentPaymentMethod>(
    existing?.paymentMethod ?? 'kredi_karti'
  );
  const [cardId, setCardId] = useState(
    existing?.creditCardId ?? paramCardId ?? cards[0]?.id
  );

  useEffect(() => {
    if (!existing) return;
    setItemName(existing.itemName);
    setTotal(existing.totalAmount);
    setCount(existing.installmentCount);
    setStartDate(existing.startDate);
    setMethod(existing.paymentMethod);
    setCardId(existing.creditCardId ?? cards[0]?.id);
  }, [existing?.id]);

  const monthly = computeMonthlyAmount(total, count);

  const previewLoad = useMemo(() => {
    if (total <= 0 || count <= 0 || !itemName.trim()) return null;
    const draft = {
      id: existing?.id ?? 'preview',
      itemName,
      totalAmount: total,
      installmentCount: count,
      monthlyAmount: monthly,
      startDate,
      paymentMethod: method,
      creditCardId: method === 'kredi_karti' ? cardId : undefined,
      status: 'aktif' as const,
      closedAt: null,
      deletedAt: null,
      createdAt: existing?.createdAt ?? '',
    };
    const others = installments.filter(
      (i) => i.deletedAt == null && i.id !== draft.id
    );
    const scopedId =
      method === 'kredi_karti' && cardId ? cardId : undefined;
    return futureLoadByMonth([...others, draft], 4, new Date(), scopedId);
  }, [
    itemName,
    total,
    count,
    monthly,
    startDate,
    method,
    cardId,
    installments,
    existing?.id,
    existing?.createdAt,
  ]);

  const canSave =
    itemName.trim().length > 0 &&
    total > 0 &&
    count >= 2 &&
    (method !== 'kredi_karti' || !!cardId || cards.length === 0);

  const save = () => {
    if (!canSave) return;
    const payload = {
      itemName: itemName.trim(),
      totalAmount: total,
      installmentCount: count,
      startDate,
      paymentMethod: method,
      creditCardId: method === 'kredi_karti' ? cardId : undefined,
    };
    if (isEdit && existing) {
      updateInstallment({ id: existing.id, ...payload });
    } else {
      addInstallment(payload);
    }
    router.back();
  };

  if (editId && !existing) {
    return (
      <Screen>
        <StepHeader title="Taksit bulunamadı" onBack={() => router.back()} />
        <Text variant="callout" color={colors.textMuted} style={styles.pad}>
          Bu taksit silinmiş veya mevcut değil.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <Button
          label={isEdit ? 'Güncelle' : 'Kaydet'}
          disabled={!canSave}
          onPress={save}
        />
      }
    >
      <StepHeader
        title={isEdit ? 'Taksiti düzenle' : 'Taksitli alışveriş'}
        subtitle="Toplam tutar ve taksit sayısıyla aylık yük hesaplanır."
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        <Text variant="label" color={colors.textSecondary}>
          Eşya / hizmet
        </Text>
        <TextInput
          style={styles.input}
          value={itemName}
          onChangeText={setItemName}
          placeholder="Örn. Telefon"
          placeholderTextColor={colors.textMuted}
        />

        <AmountField label="Toplam tutar" value={total} onChange={setTotal} />

        <Text variant="label" color={colors.textSecondary}>
          Taksit sayısı
        </Text>
        <View style={styles.chips}>
          {[2, 3, 4, 6, 9, 12].map((n) => (
            <CategoryChip
              key={n}
              label={`${n}`}
              selected={count === n}
              onPress={() => setCount(n)}
            />
          ))}
        </View>

        <Text variant="callout" color={colors.textSecondary}>
          Aylık taksit ≈ {formatCurrency(monthly)}
        </Text>

        <DateField
          label="İlk taksit tarihi"
          value={startDate}
          onChange={(iso) => {
            if (iso) setStartDate(iso);
          }}
        />

        <Text variant="label" color={colors.textSecondary}>
          Ödeme yöntemi
        </Text>
        <View style={styles.chips}>
          <CategoryChip
            label="Kredi kartı"
            selected={method === 'kredi_karti'}
            onPress={() => setMethod('kredi_karti')}
          />
          <CategoryChip
            label="Nakit"
            selected={method === 'nakit'}
            onPress={() => setMethod('nakit')}
          />
        </View>

        {method === 'kredi_karti' && cards.length > 0 ? (
          <>
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
          </>
        ) : null}

        {previewLoad ? (
          <View style={styles.preview}>
            <Text variant="label" color={colors.textMuted}>
              {method === 'kredi_karti' && cardId
                ? 'BU KART — GELECEK TAKSİT YÜKÜ'
                : 'GELECEK TAKSİT YÜKÜ'}
            </Text>
            {Object.entries(previewLoad).map(([period, amt]) =>
              amt > 0 ? (
                <View key={period} style={styles.previewRow}>
                  <Text variant="callout">{periodLabel(period)}</Text>
                  <Text variant="subheading">{formatCurrency(amt)}</Text>
                </View>
              ) : null
            )}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pad: { padding: spacing.lg },
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
  preview: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryTint,
    gap: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
