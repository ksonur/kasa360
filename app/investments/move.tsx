import { useMemo, useState } from 'react';
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
  displayBalance,
  useInvestments,
  type InvestmentMovementType,
} from '@/features/investments';
import { todayISO } from '@/features/finance';

export default function InvestmentMoveScreen() {
  const {
    platformId: paramPlatformId,
    type: paramType,
  } = useLocalSearchParams<{ platformId?: string; type?: string }>();
  const { data } = useOnboarding();
  const { movements, snapshots, addMovement } = useInvestments();
  const platforms = data.investments;

  const initialType: InvestmentMovementType =
    paramType === 'cekme' ? 'cekme' : 'yatirma';

  const [platformId, setPlatformId] = useState(
    paramPlatformId ?? platforms[0]?.id ?? ''
  );
  const [type, setType] = useState<InvestmentMovementType>(initialType);
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  const platform = useMemo(
    () => platforms.find((p) => p.id === platformId),
    [platforms, platformId]
  );
  const currentBalance = platform
    ? displayBalance(platform.balance, movements, snapshots, platform.id)
    : 0;

  const canSave =
    !!platformId &&
    amount > 0 &&
    (type === 'yatirma' || amount <= currentBalance);

  const save = () => {
    if (!canSave) return;
    addMovement({
      platformId,
      type,
      amount,
      date,
      note: note.trim() || undefined,
    });
    router.back();
  };

  if (platforms.length === 0) {
    return (
      <Screen>
        <StepHeader title="Hareket ekle" onBack={() => router.back()} />
        <Text variant="callout" color={colors.textMuted} style={styles.pad}>
          Önce bir yatırım platformu eklemelisin.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <Button
          label={type === 'yatirma' ? 'Yatır' : 'Çek'}
          disabled={!canSave}
          onPress={save}
        />
      }
    >
      <StepHeader
        title={type === 'yatirma' ? 'Para yatır' : 'Para çek'}
        subtitle={
          platform
            ? `Güncel bakiye ${formatCurrency(currentBalance)}`
            : 'Platform seç'
        }
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        <Text variant="label" color={colors.textSecondary}>
          İşlem
        </Text>
        <View style={styles.chips}>
          <CategoryChip
            label="Yatırma"
            selected={type === 'yatirma'}
            onPress={() => setType('yatirma')}
          />
          <CategoryChip
            label="Çekme"
            selected={type === 'cekme'}
            onPress={() => setType('cekme')}
          />
        </View>

        <Text variant="label" color={colors.textSecondary}>
          Platform
        </Text>
        <View style={styles.chips}>
          {platforms.map((p) => (
            <CategoryChip
              key={p.id}
              label={p.platform.trim() || 'Platform'}
              selected={platformId === p.id}
              onPress={() => setPlatformId(p.id)}
            />
          ))}
        </View>

        <AmountField label="Tutar" value={amount} onChange={setAmount} />
        {type === 'cekme' && amount > currentBalance ? (
          <Text variant="caption" color={colors.danger}>
            Çekme tutarı bakiyeden fazla olamaz.
          </Text>
        ) : null}

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
          placeholder="Örn. Maaş aktarımı"
          placeholderTextColor={colors.textMuted}
        />
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
});
