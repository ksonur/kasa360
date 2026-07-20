import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen, StepHeader, AmountSlider, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import {
  getAmountForMonth,
  isYearSeeded,
  monthKey,
} from '@/features/onboarding/monthlyAmounts';

const STEP = 1;
const TOTAL = 4;
const DEFAULT_SALARY = 45000;

export default function IncomeStep() {
  const { data, setSalary, setOvertime, setCurrentStep } = useOnboarding();
  const year = new Date().getFullYear();
  const currentMonth = monthKey();
  const salarySeeded = isYearSeeded(data.salaryByMonth, year);
  const overtimeSeeded = isYearSeeded(data.overtimeByMonth, year);

  const [draftSalary, setDraftSalary] = useState(() => {
    const v = getAmountForMonth(data.salaryByMonth, currentMonth);
    return v > 0 ? v : DEFAULT_SALARY;
  });
  const [draftOvertime, setDraftOvertime] = useState(() =>
    getAmountForMonth(data.overtimeByMonth, currentMonth)
  );

  useEffect(() => {
    setCurrentStep('income');
  }, [setCurrentStep]);

  const previewIncome = draftSalary + draftOvertime;

  const onContinue = () => {
    setSalary(draftSalary, currentMonth);
    setOvertime(draftOvertime, currentMonth);
    router.push('/onboarding/expenses');
  };

  return (
    <Screen scroll footer={<Button label="Devam et" onPress={onContinue} />}>
      <StepHeader
        step={STEP}
        totalSteps={TOTAL}
        title="Aylık gelirin"
        subtitle="Maaş ve mesai ilk kez girildiğinde bu yılın tüm aylarına yazılır; sonra ay ay değiştirebilirsin."
        onBack={() => router.back()}
      />

      <View style={styles.body}>
        <AmountSlider
          label="Net maaş"
          value={draftSalary}
          onChange={setDraftSalary}
          max={150000}
          step={500}
          hint={
            salarySeeded
              ? `${year} maaşı tohumlandı — devam’da yalnızca bu ay güncellenir.`
              : `İlk kayıtta ${year} yılının 12 ayına aynı maaş yazılacak.`
          }
        />

        <AmountSlider
          label="Mesai / ek ödeme"
          value={draftOvertime}
          onChange={setDraftOvertime}
          max={50000}
          step={250}
          hint={
            overtimeSeeded
              ? `${year} mesaisi tohumlandı — devam’da yalnızca bu ay güncellenir.`
              : `İlk kayıtta ${year} yılının 12 ayına aynı mesai yazılacak.`
          }
        />

        <View style={styles.totalCard}>
          <Text variant="label" color={colors.textOnTint}>
            BU AY TOPLAM GELİR
          </Text>
          <Text variant="amountLg" color={colors.primaryDarker}>
            {formatCurrency(previewIncome)}
          </Text>
          <Text variant="caption" color={colors.textOnTint}>
            Maaş {formatCurrency(draftSalary)} + mesai {formatCurrency(draftOvertime)}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg, marginTop: spacing['2xl'] },
  totalCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.xs,
    alignItems: 'center',
  },
});
