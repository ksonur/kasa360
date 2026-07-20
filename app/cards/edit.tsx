import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AmountField,
  Button,
  DayStrip,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import type { CreditCardDraft } from '@/features/onboarding/types';
import { useOnboarding } from '@/features/onboarding/store';

function newCardId(): string {
  return `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function EditCardScreen() {
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { data, setCards } = useOnboarding();
  const existing = editId ? data.cards.find((c) => c.id === editId) : null;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [limit, setLimit] = useState(existing?.limit ?? 0);
  const [statementDay, setStatementDay] = useState<number | null>(
    existing?.statementDay ?? null
  );
  const [dueDay, setDueDay] = useState<number | null>(existing?.dueDay ?? null);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setLimit(existing.limit);
    setStatementDay(existing.statementDay);
    setDueDay(existing.dueDay);
  }, [existing?.id]);

  const canSave = name.trim().length > 0 && limit > 0;

  const save = () => {
    if (!canSave) return;
    const row: CreditCardDraft = {
      id: existing?.id ?? newCardId(),
      name: name.trim(),
      limit: Math.round(limit),
      statementDay,
      dueDay,
    };
    if (isEdit && existing) {
      setCards(data.cards.map((c) => (c.id === existing.id ? row : c)));
    } else {
      setCards([...data.cards, row]);
    }
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(
      'Kartı kaldır',
      `"${existing.name.trim() || 'Kart'}" listeden çıkarılır. Ekstre/ödeme geçmişi kalır ama karta bağlanamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => {
            setCards(data.cards.filter((c) => c.id !== existing.id));
            router.replace('/(tabs)/cards');
          },
        },
      ]
    );
  };

  if (editId && !existing) {
    return (
      <Screen>
        <StepHeader title="Kart bulunamadı" onBack={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          {isEdit ? (
            <Button label="Kartı kaldır" variant="secondary" onPress={remove} />
          ) : null}
          <Button
            label={isEdit ? 'Güncelle' : 'Kartı kaydet'}
            disabled={!canSave}
            onPress={save}
          />
        </View>
      }
    >
      <StepHeader
        title={isEdit ? 'Kartı düzenle' : 'Kart ekle'}
        subtitle="Limit, ekstre kesim ve son ödeme günü. Sonradan güncelleyebilirsin."
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        <Text variant="label" color={colors.textSecondary}>
          Kart adı
        </Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Örn. Bankam Bonus"
          placeholderTextColor={colors.textMuted}
        />

        <AmountField label="Kart limiti" value={limit} onChange={setLimit} />
        <DayStrip
          label="Ekstre kesim günü"
          value={statementDay}
          onChange={setStatementDay}
        />
        <DayStrip label="Son ödeme günü" value={dueDay} onChange={setDueDay} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  footer: { gap: spacing.md },
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
