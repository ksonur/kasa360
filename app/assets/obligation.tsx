import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AmountField,
  Button,
  CategoryChip,
  DateField,
  DaySelector,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, spacing } from '@/theme';
import {
  MONTH_NAMES_TR,
  OBLIGATION_KIND_META,
  useAssets,
  type AssetType,
  type ObligationKind,
} from '@/features/assets';
import { todayISO } from '@/features/finance';

const PROPERTY_KINDS: ObligationKind[] = [
  'emlak_vergisi',
  'dask',
  'konut_sigortasi',
];
const VEHICLE_KINDS: ObligationKind[] = ['mtv', 'trafik', 'kasko'];

function kindsForType(type: AssetType): ObligationKind[] {
  return type === 'arac' ? VEHICLE_KINDS : PROPERTY_KINDS;
}

function isAnnualKind(kind: ObligationKind): boolean {
  return (
    kind === 'dask' ||
    kind === 'konut_sigortasi' ||
    kind === 'trafik' ||
    kind === 'kasko'
  );
}

export default function ObligationEditScreen() {
  const { id, assetId } = useLocalSearchParams<{
    id?: string;
    assetId?: string;
  }>();
  const { assets, obligations, upsertObligation } = useAssets();

  const existing = id
    ? obligations.find((o) => o.id === id && o.deletedAt == null)
    : null;

  const resolvedAssetId = existing?.assetId ?? assetId;
  const asset = assets.find(
    (a) => a.id === resolvedAssetId && a.deletedAt == null
  );

  const allowedKinds = useMemo(
    () => (asset ? kindsForType(asset.type) : PROPERTY_KINDS),
    [asset?.type]
  );

  const [kind, setKind] = useState<ObligationKind>(
    existing?.kind ?? allowedKinds[0]
  );
  const [amount, setAmount] = useState(existing?.amount ?? 0);
  const [month, setMonth] = useState(existing?.month ?? 1);
  const [day, setDay] = useState(existing?.day ?? 31);
  const [startDate, setStartDate] = useState(
    existing?.startDate ?? todayISO()
  );

  useEffect(() => {
    if (!existing) return;
    setKind(existing.kind);
    setAmount(existing.amount ?? 0);
    setMonth(existing.month ?? 1);
    setDay(existing.day ?? 31);
    setStartDate(existing.startDate ?? todayISO());
  }, [existing?.id]);

  useEffect(() => {
    if (!allowedKinds.includes(kind)) {
      setKind(allowedKinds[0]);
    }
  }, [allowedKinds, kind]);

  if (!asset) {
    return (
      <Screen>
        <StepHeader title="Varlık bulunamadı" onBack={() => router.back()} />
      </Screen>
    );
  }

  const annual = isAnnualKind(kind);
  const canSave = annual
    ? /^\d{4}-\d{2}-\d{2}$/.test(startDate)
    : month >= 1 && month <= 12 && day >= 1 && day <= 31;

  const save = () => {
    if (!canSave) return;
    upsertObligation({
      id: existing?.id,
      assetId: asset.id,
      kind,
      amount: amount > 0 ? amount : null,
      month: annual ? null : month,
      day: annual ? null : day,
      startDate: annual ? startDate : null,
    });
    router.back();
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label={existing ? 'Güncelle' : 'Kaydet'}
          disabled={!canSave}
          onPress={save}
        />
      }
    >
      <StepHeader
        title={existing ? 'Yükümlülüğü düzenle' : 'Yükümlülük ekle'}
        subtitle={asset.name.trim() || 'Varlık'}
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        <Text variant="label" color={colors.textSecondary}>
          Tür
        </Text>
        <View style={styles.chips}>
          {allowedKinds.map((k) => (
            <CategoryChip
              key={k}
              label={OBLIGATION_KIND_META[k].label}
              selected={kind === k}
              onPress={() => setKind(k)}
            />
          ))}
        </View>

        <AmountField
          label="Tutar (opsiyonel)"
          value={amount}
          onChange={setAmount}
        />

        {annual ? (
          <DateField
            label="Başlangıç / yenileme tarihi"
            value={startDate}
            onChange={(iso) => setStartDate(iso ?? todayISO())}
            hint="Yıllık yenileme bu tarihin yıldönümünde hatırlatılır."
          />
        ) : (
          <>
            <Text variant="label" color={colors.textSecondary}>
              Ay
            </Text>
            <View style={styles.chips}>
              {MONTH_NAMES_TR.map((label, i) => (
                <CategoryChip
                  key={label}
                  label={label}
                  selected={month === i + 1}
                  onPress={() => setMonth(i + 1)}
                />
              ))}
            </View>
            <DaySelector
              label="Gün"
              value={day}
              onChange={setDay}
              hint="Dönem son ödeme günü"
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing['2xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
