import type { OnboardingState } from '@/features/onboarding/types';
import { totalIncome, totalRoutineExpense } from '@/features/onboarding/store';
import type { ExtraIncome, LocalTransaction } from '@/features/finance/types';
import {
  sumExtraIncomeThisMonth,
  sumSpentThisMonth,
} from '@/features/finance/store';

export interface BudgetMonthSummary {
  /** YYYY-MM */
  period: string;
  monthLabel: string;
  income: number;
  baseIncome: number;
  extraIncome: number;
  plannedExpense: number;
  spent: number;
  remaining: number;
  /** 0–1 */
  spentRatio: number;
  daysLeftInMonth: number;
  daysInMonth: number;
}

function periodOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/**
 * Aylık bütçe özeti — dashboard remaining ile aynı formül.
 * remaining = income − planned − spent
 */
export function budgetSummary(
  data: OnboardingState,
  transactions: LocalTransaction[],
  extraIncomes: ExtraIncome[] = [],
  ref = new Date()
): BudgetMonthSummary {
  const baseIncome = totalIncome(data);
  const extraIncome = sumExtraIncomeThisMonth(extraIncomes, ref);
  const income = baseIncome + extraIncome;
  const plannedExpense = totalRoutineExpense(data);
  const spent = sumSpentThisMonth(transactions, ref);
  const remaining = income - plannedExpense - spent;
  const denom = income > 0 ? income : 1;
  const spentRatio = Math.min(
    1,
    Math.max(0, (spent + plannedExpense) / denom)
  );

  const dim = daysInMonth(ref);
  const day = ref.getDate();
  const daysLeftInMonth = Math.max(0, dim - day);

  return {
    period: periodOf(ref),
    monthLabel: ref.toLocaleDateString('tr-TR', {
      month: 'long',
      year: 'numeric',
    }),
    income: Math.round(income),
    baseIncome: Math.round(baseIncome),
    extraIncome: Math.round(extraIncome),
    plannedExpense: Math.round(plannedExpense),
    spent: Math.round(spent),
    remaining: Math.round(remaining),
    spentRatio,
    daysLeftInMonth,
    daysInMonth: dim,
  };
}
