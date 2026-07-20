import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CreditCard, Plus, Trash2 } from 'lucide-react-native';
import {
  AmountField,
  Button,
  DayStrip,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { CreditCardDraft, useOnboarding } from '@/features/onboarding/store';

const STEP = 3;
const TOTAL = 4;

let seq = 0;
const nextId = () => `card_${seq++}`;

export default function CardsStep() {
  const { data, setCards, setCurrentStep } = useOnboarding();
  const [cards, setLocal] = useState<CreditCardDraft[]>(data.cards);

  useEffect(() => {
    setCurrentStep('cards');
  }, [setCurrentStep]);

  function addCard() {
    setLocal((prev) => [
      ...prev,
      { id: nextId(), name: '', limit: 0, statementDay: null, dueDay: null },
    ]);
  }

  function update(id: string, patch: Partial<CreditCardDraft>) {
    setLocal((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function remove(id: string) {
    setLocal((prev) => prev.filter((c) => c.id !== id));
  }

  function onContinue() {
    setCards(cards.filter((c) => c.name.trim() || c.limit > 0));
    router.push('/onboarding/investments');
  }

  return (
    <Screen
      scroll
      footer={
        <Button
          label={cards.length ? 'Devam et' : 'Kartım yok, atla'}
          variant={cards.length ? 'primary' : 'secondary'}
          onPress={onContinue}
        />
      }
    >
      <StepHeader
        step={STEP}
        totalSteps={TOTAL}
        title="Kredi kartların"
        subtitle="Her kart için limit, ekstre kesim ve son ödeme gününü ekle. Sonra istediğin zaman güncelleyebilirsin."
        onBack={() => router.back()}
        onSkip={onContinue}
      />

      <View style={styles.list}>
        {cards.map((card, index) => (
          <View key={card.id} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardIcon}>
                <CreditCard size={18} color={colors.primary} />
              </View>
              <Text variant="subheading" style={styles.flex}>
                {card.name.trim() || `Kart ${index + 1}`}
              </Text>
              <Pressable
                onPress={() => remove(card.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Kartı sil"
              >
                <Trash2 size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.gap}>
              <Text variant="label" color={colors.textSecondary}>
                Kart adı
              </Text>
              <TextInput
                style={styles.textInput}
                value={card.name}
                onChangeText={(t) => update(card.id, { name: t })}
                placeholder="Örn. Bankam Bonus"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <AmountField
              label="Kart limiti"
              value={card.limit}
              onChange={(v) => update(card.id, { limit: v })}
            />
            <DayStrip
              label="Ekstre kesim günü"
              value={card.statementDay}
              onChange={(d) => update(card.id, { statementDay: d })}
            />
            <DayStrip
              label="Son ödeme günü"
              value={card.dueDay}
              onChange={(d) => update(card.id, { dueDay: d })}
            />
          </View>
        ))}

        <Pressable
          onPress={addCard}
          accessibilityRole="button"
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        >
          <Plus size={20} color={colors.primary} />
          <Text variant="subheading" color={colors.primary}>
            Kart ekle
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: spacing.xs },
  list: { gap: spacing.md, marginTop: spacing['2xl'] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  pressed: { opacity: 0.8 },
});
