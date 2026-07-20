import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AmountField,
  Button,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import type { InvestmentDraft } from '@/features/onboarding/types';
import { useOnboarding } from '@/features/onboarding/store';

function newPlatformId(): string {
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function EditInvestmentScreen() {
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { data, setInvestments } = useOnboarding();
  const existing = editId
    ? data.investments.find((p) => p.id === editId)
    : null;
  const isEdit = !!existing;

  const [platform, setPlatform] = useState(existing?.platform ?? '');
  const [opening, setOpening] = useState(existing?.balance ?? 0);

  useEffect(() => {
    if (!existing) return;
    setPlatform(existing.platform);
    setOpening(existing.balance);
  }, [existing?.id]);

  const canSave = platform.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const row: InvestmentDraft = {
      id: existing?.id ?? newPlatformId(),
      platform: platform.trim(),
      balance: Math.round(opening),
    };
    if (isEdit && existing) {
      setInvestments(
        data.investments.map((p) => (p.id === existing.id ? row : p))
      );
    } else {
      setInvestments([...data.investments, row]);
    }
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(
      'Platformu kaldır',
      `"${existing.platform.trim() || 'Platform'}" listeden çıkarılır. Hareket geçmişi kalır ama platforma bağlanamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => {
            setInvestments(data.investments.filter((p) => p.id !== existing.id));
            router.replace('/(tabs)/investments');
          },
        },
      ]
    );
  };

  if (editId && !existing) {
    return (
      <Screen>
        <StepHeader title="Platform bulunamadı" onBack={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          {isEdit ? (
            <Button
              label="Platformu kaldır"
              variant="secondary"
              onPress={remove}
            />
          ) : null}
          <Button
            label={isEdit ? 'Güncelle' : 'Platformu kaydet'}
            disabled={!canSave}
            onPress={save}
          />
        </View>
      }
    >
      <StepHeader
        title={isEdit ? 'Platformu düzenle' : 'Platform ekle'}
        subtitle="Açılış bakiyesi + sonraki yatırma/çekme hareketleri güncel bakiyeyi oluşturur."
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        <Text variant="label" color={colors.textSecondary}>
          Platform adı
        </Text>
        <TextInput
          style={styles.input}
          value={platform}
          onChangeText={setPlatform}
          placeholder="Örn. Midas"
          placeholderTextColor={colors.textMuted}
        />

        <AmountField
          label="Açılış bakiyesi"
          value={opening}
          onChange={setOpening}
        />
        <Text variant="caption" color={colors.textMuted}>
          Bu tutar başlangıç bakiyesidir; güncel bakiye hareketlerle hesaplanır.
        </Text>
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
