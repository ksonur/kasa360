import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LineChart, Plus, Trash2 } from 'lucide-react-native';
import { AmountField, Button, Screen, StepHeader, Text } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { InvestmentDraft, useOnboarding } from '@/features/onboarding/store';

const STEP = 4;
const TOTAL = 4;

let seq = 0;
const nextId = () => `inv_${seq++}`;

export default function InvestmentsStep() {
  const { data, setInvestments, setCurrentStep } = useOnboarding();
  const [items, setLocal] = useState<InvestmentDraft[]>(data.investments);

  useEffect(() => {
    setCurrentStep('investments');
  }, [setCurrentStep]);

  function add() {
    setLocal((prev) => [...prev, { id: nextId(), platform: '', balance: 0 }]);
  }
  function update(id: string, patch: Partial<InvestmentDraft>) {
    setLocal((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function remove(id: string) {
    setLocal((prev) => prev.filter((i) => i.id !== id));
  }

  function onFinish() {
    setInvestments(items.filter((i) => i.platform.trim() || i.balance > 0));
    router.replace('/onboarding/summary');
  }

  return (
    <Screen
      scroll
      footer={
        <Button label="Kurulumu tamamla" onPress={onFinish} />
      }
    >
      <StepHeader
        step={STEP}
        totalSteps={TOTAL}
        title="Yatırımların"
        subtitle="Kullandığın platformları ve o platformdaki toplam bakiyeni gir. Varlık detayına şimdi gerek yok."
        onBack={() => router.back()}
        onSkip={onFinish}
      />

      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardIcon}>
                <LineChart size={18} color={colors.primary} />
              </View>
              <Text variant="subheading" style={styles.flex}>
                {item.platform.trim() || `Platform ${index + 1}`}
              </Text>
              <Pressable
                onPress={() => remove(item.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Platformu sil"
              >
                <Trash2 size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.gap}>
              <Text variant="label" color={colors.textSecondary}>
                Platform adı
              </Text>
              <TextInput
                style={styles.textInput}
                value={item.platform}
                onChangeText={(t) => update(item.id, { platform: t })}
                placeholder="Örn. Midas, Binance, banka fonu"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <AmountField
              label="Toplam bakiye"
              value={item.balance}
              onChange={(v) => update(item.id, { balance: v })}
            />
          </View>
        ))}

        <Pressable
          onPress={add}
          accessibilityRole="button"
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        >
          <Plus size={20} color={colors.primary} />
          <Text variant="subheading" color={colors.primary}>
            Platform ekle
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
