import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
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
import {
  ASSET_TYPES,
  assetTypeLabel,
  useAssets,
  type AssetType,
} from '@/features/assets';

type Step = 0 | 1 | 2;

export default function AssetEditScreen() {
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { assets, upsertAsset, softDeleteAsset } = useAssets();
  const existing = editId
    ? assets.find((a) => a.id === editId && a.deletedAt == null)
    : null;
  const isEdit = !!existing;

  const [step, setStep] = useState<Step>(isEdit ? 1 : 0);
  const [type, setType] = useState<AssetType>(existing?.type ?? 'ev');
  const [name, setName] = useState(existing?.name ?? '');
  const [purchasePrice, setPurchasePrice] = useState(
    existing?.purchasePrice ?? 0
  );
  const [estimatedValue, setEstimatedValue] = useState(
    existing?.estimatedValue ?? 0
  );
  const [brandModel, setBrandModel] = useState(existing?.brandModel ?? '');
  const [daskStart, setDaskStart] = useState('');
  const [konutStart, setKonutStart] = useState('');
  const [trafikStart, setTrafikStart] = useState('');
  const [kaskoStart, setKaskoStart] = useState('');

  useEffect(() => {
    if (!existing) return;
    setType(existing.type);
    setName(existing.name);
    setPurchasePrice(existing.purchasePrice ?? 0);
    setEstimatedValue(existing.estimatedValue);
    setBrandModel(existing.brandModel ?? '');
  }, [existing?.id]);

  const canStep1 = name.trim().length > 0 && estimatedValue > 0;

  const save = () => {
    if (!canStep1) return;
    const id = upsertAsset({
      id: existing?.id,
      type,
      name: name.trim(),
      purchasePrice:
        type === 'arac' ? null : purchasePrice > 0 ? purchasePrice : null,
      estimatedValue,
      brandModel: type === 'arac' ? brandModel.trim() || null : null,
      daskStartDate: !isEdit && daskStart ? daskStart : null,
      konutStartDate: !isEdit && konutStart ? konutStart : null,
      trafikStartDate: !isEdit && trafikStart ? trafikStart : null,
      kaskoStartDate: !isEdit && kaskoStart ? kaskoStart : null,
    });
    if (isEdit) {
      router.back();
    } else {
      router.replace(`/assets/${id}`);
    }
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(
      'Varlığı kaldır',
      `"${existing.name.trim() || assetTypeLabel(existing.type)}" ve yükümlülükleri soft-delete ile kaldırılır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => {
            softDeleteAsset(existing.id);
            router.replace('/assets');
          },
        },
      ]
    );
  };

  if (editId && !existing) {
    return (
      <Screen>
        <StepHeader title="Varlık bulunamadı" onBack={() => router.back()} />
      </Screen>
    );
  }

  const stepTitles = ['Tür seç', 'Temel bilgiler', 'Yükümlülük tarihleri'];
  const subtitle = isEdit
    ? 'Bilgileri güncelle. Yükümlülükleri detaydan düzenle.'
    : `${step + 1}/3 · ${stepTitles[step]}`;

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          {isEdit ? (
            <Button label="Varlığı kaldır" variant="secondary" onPress={remove} />
          ) : null}
          {step > 0 && !isEdit ? (
            <Button
              label="Geri"
              variant="secondary"
              onPress={() => setStep((s) => (s - 1) as Step)}
            />
          ) : null}
          {!isEdit && step < 2 ? (
            <Button
              label="Devam"
              disabled={step === 1 && !canStep1}
              onPress={() => {
                if (step === 0) setStep(1);
                else if (canStep1) setStep(2);
              }}
            />
          ) : (
            <Button
              label={isEdit ? 'Güncelle' : 'Kaydet'}
              disabled={!canStep1}
              onPress={save}
            />
          )}
        </View>
      }
    >
      <StepHeader
        title={isEdit ? 'Varlığı düzenle' : 'Varlık ekle'}
        subtitle={subtitle}
        onBack={() => router.back()}
      />

      {step === 0 && !isEdit ? (
        <View style={styles.block}>
          <Text variant="label" color={colors.textSecondary}>
            Varlık türü
          </Text>
          <View style={styles.chips}>
            {ASSET_TYPES.map((t) => (
              <CategoryChip
                key={t.id}
                label={t.label}
                selected={type === t.id}
                onPress={() => setType(t.id)}
              />
            ))}
          </View>
          <Text variant="caption" color={colors.textMuted}>
            {type === 'arac'
              ? 'MTV Ocak/Temmuz otomatik eklenir. Trafik ve kasko tarihlerini sonraki adımda girebilirsin.'
              : 'Emlak vergisi Mayıs/Kasım otomatik eklenir. DASK ve konut sigortası sonraki adımda.'}
          </Text>
        </View>
      ) : null}

      {(step === 1 || isEdit) && (
        <View style={styles.block}>
          {!isEdit ? (
            <Text variant="caption" color={colors.textMuted}>
              Tür: {assetTypeLabel(type)}
            </Text>
          ) : (
            <View style={styles.chips}>
              {ASSET_TYPES.map((t) => (
                <CategoryChip
                  key={t.id}
                  label={t.label}
                  selected={type === t.id}
                  onPress={() => setType(t.id)}
                />
              ))}
            </View>
          )}

          <Text variant="label" color={colors.textSecondary}>
            Ad
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={
              type === 'arac' ? 'Örn. Aile arabası' : 'Örn. Kadıköy daire'
            }
            placeholderTextColor={colors.textMuted}
          />

          {type === 'arac' ? (
            <>
              <Text variant="label" color={colors.textSecondary}>
                Marka / Model
              </Text>
              <TextInput
                style={styles.input}
                value={brandModel}
                onChangeText={setBrandModel}
                placeholder="Örn. Toyota Corolla"
                placeholderTextColor={colors.textMuted}
              />
            </>
          ) : (
            <AmountField
              label="Satın alma bedeli (opsiyonel)"
              value={purchasePrice}
              onChange={setPurchasePrice}
            />
          )}

          <AmountField
            label="Tahmini güncel değer"
            value={estimatedValue}
            onChange={setEstimatedValue}
          />
        </View>
      )}

      {step === 2 && !isEdit ? (
        <View style={styles.block}>
          <Text variant="callout" color={colors.textSecondary}>
            Tarihler opsiyonel. Boş bırakırsan sonra detaydan ekleyebilirsin.
          </Text>
          {(type === 'ev' || type === 'arsa') && (
            <>
              <DateField
                label="DASK başlangıç"
                value={daskStart || null}
                onChange={(iso) => setDaskStart(iso ?? '')}
                optional
              />
              <DateField
                label="Konut sigortası başlangıç"
                value={konutStart || null}
                onChange={(iso) => setKonutStart(iso ?? '')}
                optional
              />
            </>
          )}
          {type === 'arac' ? (
            <>
              <DateField
                label="Trafik sigortası başlangıç"
                value={trafikStart || null}
                onChange={(iso) => setTrafikStart(iso ?? '')}
                optional
              />
              <DateField
                label="Kasko başlangıç"
                value={kaskoStart || null}
                onChange={(iso) => setKaskoStart(iso ?? '')}
                optional
              />
            </>
          ) : null}
          <Text variant="caption" color={colors.textMuted}>
            {type === 'arac'
              ? 'MTV dönemleri (Ocak / Temmuz) otomatik oluşturulur.'
              : 'Emlak vergisi dönemleri (Mayıs / Kasım) otomatik oluşturulur.'}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
