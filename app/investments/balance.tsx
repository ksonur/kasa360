import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AmountField,
  Button,
  CategoryChip,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  currentPeriod,
  formatReturnPct,
  monthOverMonthPct,
  periodLabel,
  snapshotForPeriod,
  useInvestments,
  yearOverYearPct,
} from '@/features/investments';

const MONTH_LABELS = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

/** Bugünden geriye YEARS_BACK yıl + içinde bulunulan yıl. */
const YEARS_BACK = 5;

function parsePeriod(period: string): { year: number; month: number } {
  const [y, m] = period.split('-').map(Number);
  return { year: y, month: m };
}

function toPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function availableYears(now = new Date()): number[] {
  const cy = now.getFullYear();
  return Array.from({ length: YEARS_BACK + 1 }, (_, i) => cy - i);
}

function maxMonthForYear(year: number, now = new Date()): number {
  if (year < now.getFullYear()) return 12;
  if (year > now.getFullYear()) return 0;
  return now.getMonth() + 1;
}

export default function InvestmentBalanceScreen() {
  const { platformId: paramPlatformId } = useLocalSearchParams<{
    platformId?: string;
  }>();
  const { data } = useOnboarding();
  const { snapshots, movements, upsertSnapshot } = useInvestments();
  const platforms = data.investments;

  const nowPeriod = currentPeriod();
  const initial = parsePeriod(nowPeriod);

  const [platformId, setPlatformId] = useState(
    paramPlatformId ?? platforms[0]?.id ?? ''
  );
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const period = toPeriod(year, month);
  const years = useMemo(() => availableYears(), []);
  const maxMonth = maxMonthForYear(year);

  useEffect(() => {
    if (month > maxMonth && maxMonth > 0) {
      setMonth(maxMonth);
    }
  }, [year, month, maxMonth]);

  const existing = useMemo(
    () =>
      platformId ? snapshotForPeriod(snapshots, platformId, period) : null,
    [snapshots, platformId, period]
  );
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    setBalance(existing?.balance ?? 0);
  }, [existing?.id, existing?.balance, platformId, period]);

  const previewMom = useMemo(() => {
    if (!platformId || balance <= 0) return null;
    const draft = {
      id: existing?.id ?? 'preview',
      platformId,
      period,
      balance,
      deletedAt: null,
      createdAt: '',
    };
    const others = snapshots.filter(
      (s) =>
        s.deletedAt == null &&
        !(s.platformId === platformId && s.period === period)
    );
    return monthOverMonthPct(
      [...others, draft],
      platformId,
      period,
      movements
    );
  }, [platformId, period, balance, snapshots, movements, existing?.id]);

  const previewYoy = useMemo(() => {
    if (!platformId || balance <= 0) return null;
    const draft = {
      id: existing?.id ?? 'preview',
      platformId,
      period,
      balance,
      deletedAt: null,
      createdAt: '',
    };
    const others = snapshots.filter(
      (s) =>
        s.deletedAt == null &&
        !(s.platformId === platformId && s.period === period)
    );
    return yearOverYearPct(
      [...others, draft],
      platformId,
      period,
      movements
    );
  }, [platformId, period, balance, snapshots, movements, existing?.id]);

  const canSave = !!platformId && balance > 0 && period <= nowPeriod;

  const save = () => {
    if (!canSave) return;
    upsertSnapshot({ platformId, period, balance });
    router.back();
  };

  if (platforms.length === 0) {
    return (
      <Screen>
        <StepHeader title="Aylık bakiye" onBack={() => router.back()} />
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
        <Button label="Kaydet" disabled={!canSave} onPress={save} />
      }
    >
      <StepHeader
        title="Aylık portföy bakiyesi"
        subtitle="Geçmiş aylar dahil ay sonu toplamını gir; geçen ay / yıla göre kar-zarar hesaplanır."
        onBack={() => router.back()}
      />

      <View style={styles.block}>
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

        <Text variant="label" color={colors.textSecondary}>
          Yıl
        </Text>
        <View style={styles.chips}>
          {years.map((y) => (
            <CategoryChip
              key={y}
              label={`${y}`}
              selected={year === y}
              onPress={() => setYear(y)}
            />
          ))}
        </View>

        <Text variant="label" color={colors.textSecondary}>
          Ay
        </Text>
        <View style={styles.chips}>
          {MONTH_LABELS.slice(0, maxMonth).map((label, idx) => {
            const m = idx + 1;
            return (
              <CategoryChip
                key={m}
                label={label}
                selected={month === m}
                onPress={() => setMonth(m)}
              />
            );
          })}
        </View>

        <Text variant="callout" color={colors.textSecondary}>
          Seçili dönem: {periodLabel(period)}
        </Text>

        <AmountField
          label="Platformdaki toplam tutar"
          value={balance}
          onChange={setBalance}
        />
        {existing ? (
          <Text variant="caption" color={colors.textMuted}>
            Mevcut kayıt güncellenecek · {formatCurrency(existing.balance)}
          </Text>
        ) : (
          <Text variant="caption" color={colors.textMuted}>
            Bu dönem için yeni kayıt oluşturulacak.
          </Text>
        )}

        {balance > 0 ? (
          <View style={styles.preview}>
            <Text variant="label" color={colors.textMuted}>
              GETİRİ ÖNİZLEME
            </Text>
            <Text variant="caption" color={colors.textMuted}>
              Para yatırma/çekme getiriye dahil edilmez.
            </Text>
            <View style={styles.previewRow}>
              <Text variant="callout">Geçen aya göre</Text>
              <Text
                variant="subheading"
                color={
                  previewMom == null
                    ? colors.textMuted
                    : previewMom >= 0
                      ? colors.income
                      : colors.expense
                }
              >
                {formatReturnPct(previewMom)}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text variant="callout">Geçen yıla göre</Text>
              <Text
                variant="subheading"
                color={
                  previewYoy == null
                    ? colors.textMuted
                    : previewYoy >= 0
                      ? colors.income
                      : colors.expense
                }
              >
                {formatReturnPct(previewYoy)}
              </Text>
            </View>
            <Text variant="caption" color={colors.textMuted}>
              Karşılaştırma için önceki dönem bakiyesi gerekir.
            </Text>
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
