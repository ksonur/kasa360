import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { AmountField, Button, Screen, StepHeader, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  getAmountForMonth,
  keysForYear,
  monthKey,
  monthLabelTr,
} from '@/features/onboarding/monthlyAmounts';

type MonthDraft = { salary: number; overtime: number };

export default function MonthlyIncomeScreen() {
  const { data, setSalaryMonths, setOvertimeMonths, applySalaryToYear, applyOvertimeToYear } =
    useOnboarding();
  const [year, setYear] = useState(new Date().getFullYear());
  const keys = useMemo(() => keysForYear(year), [year]);
  const current = monthKey();

  const buildLocal = (y: number): Record<string, MonthDraft> => {
    const init: Record<string, MonthDraft> = {};
    for (const k of keysForYear(y)) {
      init[k] = {
        salary: getAmountForMonth(data.salaryByMonth, k),
        overtime: getAmountForMonth(data.overtimeByMonth, k),
      };
    }
    return init;
  };

  const [local, setLocal] = useState(() => buildLocal(year));

  const reloadYear = (y: number) => {
    setYear(y);
    setLocal(buildLocal(y));
  };

  const yearSalary = keys.reduce((s, k) => s + (local[k]?.salary ?? 0), 0);
  const yearOvertime = keys.reduce((s, k) => s + (local[k]?.overtime ?? 0), 0);

  const save = () => {
    const salaries: Record<string, number> = {};
    const overtimes: Record<string, number> = {};
    for (const k of keys) {
      salaries[k] = local[k]?.salary ?? 0;
      overtimes[k] = local[k]?.overtime ?? 0;
    }
    setSalaryMonths(salaries);
    setOvertimeMonths(overtimes);
    router.back();
  };

  const fillSalaryYear = () => {
    const base = local[current]?.salary ?? local[keys[0]]?.salary ?? 0;
    applySalaryToYear(base, year);
    setLocal((prev) => {
      const next = { ...prev };
      for (const k of keys) {
        next[k] = { ...next[k], salary: base };
      }
      return next;
    });
  };

  const fillOvertimeYear = () => {
    const base = local[current]?.overtime ?? local[keys[0]]?.overtime ?? 0;
    applyOvertimeToYear(base, year);
    setLocal((prev) => {
      const next = { ...prev };
      for (const k of keys) {
        next[k] = { ...next[k], overtime: base };
      }
      return next;
    });
  };

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          <Button
            label="Bu ayki maaşı tüm yıla uygula"
            variant="secondary"
            onPress={fillSalaryYear}
          />
          <Button
            label="Bu ayki mesaiyi tüm yıla uygula"
            variant="secondary"
            onPress={fillOvertimeYear}
          />
          <Button label="Kaydet" onPress={save} />
        </View>
      }
    >
      <StepHeader
        title="Aylık gelir"
        subtitle="Maaş ve mesai ay ay değişebilir. Panele yansıması için Kaydet."
        onBack={() => router.back()}
      />

      <View style={styles.yearRow}>
        <Pressable onPress={() => reloadYear(year - 1)} hitSlop={8}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="heading">{year}</Text>
        <Pressable onPress={() => reloadYear(year + 1)} hitSlop={8}>
          <ChevronRight size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.yearSum}>
        <Text variant="label" color={colors.textMuted}>
          YILLIK TOPLAM
        </Text>
        <Text variant="amount" color={colors.primary}>
          {formatCurrency(yearSalary + yearOvertime)}
        </Text>
        <Text variant="caption" color={colors.textOnTint}>
          Maaş {formatCurrency(yearSalary)} · Mesai {formatCurrency(yearOvertime)}
        </Text>
      </View>

      <View style={styles.list}>
        {keys.map((k) => (
          <View
            key={k}
            style={[styles.monthCard, k === current && styles.monthCardCurrent]}
          >
            <View style={styles.monthHead}>
              <Text variant="subheading">{monthLabelTr(k)}</Text>
              {k === current ? (
                <Text variant="caption" color={colors.primary}>
                  Bu ay
                </Text>
              ) : null}
            </View>
            <AmountField
              label="Net maaş"
              value={local[k]?.salary ?? 0}
              onChange={(v) =>
                setLocal((prev) => ({
                  ...prev,
                  [k]: { ...prev[k], salary: v, overtime: prev[k]?.overtime ?? 0 },
                }))
              }
            />
            <AmountField
              label="Mesai"
              value={local[k]?.overtime ?? 0}
              onChange={(v) =>
                setLocal((prev) => ({
                  ...prev,
                  [k]: { ...prev[k], overtime: v, salary: prev[k]?.salary ?? 0 },
                }))
              }
            />
            <Text variant="caption" color={colors.textMuted}>
              Ay toplamı{' '}
              {formatCurrency((local[k]?.salary ?? 0) + (local[k]?.overtime ?? 0))}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.md,
  },
  yearSum: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryTint,
    gap: spacing.xs,
  },
  list: { gap: spacing.md, marginTop: spacing.xl },
  monthCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  monthCardCurrent: { borderColor: colors.primary },
  monthHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: { gap: spacing.md },
});
