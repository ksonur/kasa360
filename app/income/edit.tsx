import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { CalendarRange } from 'lucide-react-native';
import { Button, Screen, StepHeader, AmountSlider, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { totalIncome, useOnboarding } from '@/features/onboarding/store';
import {
  getAmountForMonth,
  isYearSeeded,
  monthKey,
  monthLabelTr,
} from '@/features/onboarding/monthlyAmounts';

const DEFAULT_SALARY = 45000;

export default function EditIncomeScreen() {
  const { data, setSalary, setOvertime } = useOnboarding();
  const currentMonth = monthKey();
  const year = new Date().getFullYear();
  const salarySeeded = isYearSeeded(data.salaryByMonth, year);
  const overtimeSeeded = isYearSeeded(data.overtimeByMonth, year);

  const [salary, setLocalSalary] = useState(() => {
    const v = getAmountForMonth(data.salaryByMonth, currentMonth);
    return v > 0 ? v : DEFAULT_SALARY;
  });
  const [overtime, setLocalOvertime] = useState(
    getAmountForMonth(data.overtimeByMonth, currentMonth)
  );

  useFocusEffect(
    useCallback(() => {
      const s = getAmountForMonth(data.salaryByMonth, currentMonth);
      setLocalSalary(s > 0 ? s : DEFAULT_SALARY);
      setLocalOvertime(getAmountForMonth(data.overtimeByMonth, currentMonth));
    }, [data.salaryByMonth, data.overtimeByMonth, currentMonth])
  );

  const save = () => {
    setSalary(salary, currentMonth);
    setOvertime(overtime, currentMonth);
    router.back();
  };

  return (
    <Screen scroll footer={<Button label="Kaydet" onPress={save} />}>
      <StepHeader
        title="Geliri düzenle"
        subtitle={`${monthLabelTr(currentMonth)} ${year} — maaş ve mesai bu ay için.`}
        onBack={() => router.back()}
      />

      <View style={styles.body}>
        <AmountSlider
          label={`Net maaş — ${monthLabelTr(currentMonth)}`}
          value={salary}
          onChange={setLocalSalary}
          max={150000}
          step={500}
          hint={
            salarySeeded
              ? 'Yalnızca bu ayı günceller. Tüm aylar için aşağıdaki listeyi kullan.'
              : `İlk kayıtta ${year} yılının tüm aylarına bu maaş yazılır.`
          }
        />
        <AmountSlider
          label={`Mesai — ${monthLabelTr(currentMonth)}`}
          value={overtime}
          onChange={setLocalOvertime}
          max={50000}
          step={250}
          hint={
            overtimeSeeded
              ? 'Yalnızca bu ayı günceller.'
              : `İlk kayıtta ${year} yılının tüm aylarına bu mesai yazılır.`
          }
        />

        <Pressable
          style={styles.monthLink}
          onPress={() => router.push('/income/monthly')}
        >
          <View style={styles.monthIcon}>
            <CalendarRange size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text variant="subheading">Aylık gelir düzenle</Text>
            <Text variant="caption" color={colors.textMuted}>
              {year} — maaş ve mesaiyi ay ay ayarla
            </Text>
          </View>
        </Pressable>

        <View style={styles.totalCard}>
          <Text variant="label" color={colors.textOnTint}>
            BU AY TOPLAM GELİR
          </Text>
          <Text variant="amountLg" color={colors.primaryDarker}>
            {formatCurrency(
              totalIncome(
                {
                  ...data,
                  salaryByMonth: { ...data.salaryByMonth, [currentMonth]: salary },
                  overtimeByMonth: {
                    ...data.overtimeByMonth,
                    [currentMonth]: overtime,
                  },
                },
                currentMonth
              )
            )}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { gap: spacing.lg, marginTop: spacing['2xl'] },
  monthLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  monthIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.xs,
    alignItems: 'center',
  },
});
