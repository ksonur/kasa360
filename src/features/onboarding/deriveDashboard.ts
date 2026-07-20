import { EXPENSE_CATEGORIES } from './categories';
import type { OnboardingState } from './types';
import { totalIncome, totalRoutineExpense } from './store';
import type {
  CardDebt,
  Goal as DashboardGoal,
  InvestmentHolding,
  UpcomingPayment,
} from '@/features/dashboard/mockData';
import type { ExtraIncome, LocalTransaction } from '@/features/finance/types';
import {
  sumExtraIncomeThisMonth,
  sumSpentThisMonth,
} from '@/features/finance/store';
import { categorySpendThisMonth } from '@/features/insights/categorySpend';
import type { CardPayment, CardStatement, InstallmentPurchase } from '@/features/cards/types';
import {
  currentPeriod,
  daysUntilDayOfMonth,
  nextMonthInstallmentLoad,
  openPeriodForCard,
  remainingForPeriod,
} from '@/features/cards/derive';
import type {
  InvestmentBalanceSnapshot,
  InvestmentMovement,
} from '@/features/investments/types';
import {
  displayBalance,
  monthOverMonthPct,
} from '@/features/investments/derive';
import type { Goal, GoalContribution } from '@/features/goals/types';
import { toDashboardGoals } from '@/features/goals/derive';
import type { Asset, AssetObligation } from '@/features/assets/types';
import {
  toDashboardAssets,
  toUpcomingPayments as assetUpcomingPayments,
} from '@/features/assets/derive';
import type { DashboardAssetRow } from '@/features/assets/derive';

function daysUntilDate(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - todayStart.getTime()) / 86400000);
}

function monthLabel(d = new Date()): string {
  return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

function displayName(email: string): string {
  const local = email.trim().split('@')[0];
  if (!local) return 'Kullanıcı';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function categoryLabel(categoryId: string, customLabel?: string): string {
  if (categoryId === 'diger' && customLabel?.trim()) return customLabel.trim();
  return EXPENSE_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export interface CardsDashboardInput {
  statements: CardStatement[];
  payments: CardPayment[];
  installments: InstallmentPurchase[];
}

export interface GoalsDashboardInput {
  goals: Goal[];
  contributions: GoalContribution[];
}

export interface AssetsDashboardInput {
  assets: Asset[];
  obligations: AssetObligation[];
}

/** Onboarding + tek seferlik + kart + yatırım + hedefler + varlıklar → dashboard modeli. */
export function deriveDashboardFromOnboarding(
  data: OnboardingState,
  transactions: LocalTransaction[] = [],
  cardsData: CardsDashboardInput = {
    statements: [],
    payments: [],
    installments: [],
  },
  investmentMovements: InvestmentMovement[] = [],
  investmentSnapshots: InvestmentBalanceSnapshot[] = [],
  goalsData: GoalsDashboardInput = { goals: [], contributions: [] },
  extraIncomes: ExtraIncome[] = [],
  assetsData: AssetsDashboardInput = { assets: [], obligations: [] }
) {
  const baseIncome = totalIncome(data);
  const extraIncome = sumExtraIncomeThisMonth(extraIncomes);
  const income = baseIncome + extraIncome;
  const plannedExpense = totalRoutineExpense(data);
  const spent = sumSpentThisMonth(transactions);
  const remaining = income - plannedExpense - spent;
  const period = currentPeriod();
  const categoryInsight = categorySpendThisMonth(
    transactions,
    data.routineExpenses
  );

  const upcoming: UpcomingPayment[] = [];

  for (const e of data.routineExpenses) {
    if (e.dueDay == null || e.amount <= 0) continue;
    upcoming.push({
      id: `exp-${e.categoryId}`,
      title: categoryLabel(e.categoryId, e.customLabel),
      detail: 'Rutin gider',
      amount: e.amount,
      dueInDays: daysUntilDayOfMonth(e.dueDay),
      kind: 'expense',
    });
  }

  for (const c of data.cards) {
    if (c.dueDay == null) continue;
    const cardPeriod =
      openPeriodForCard(cardsData.statements, c.id) ?? period;
    const remain = remainingForPeriod(
      cardsData.statements,
      cardsData.payments,
      c.id,
      cardPeriod
    );
    upcoming.push({
      id: `card-${c.id}`,
      title: c.name.trim() || 'Kredi kartı',
      detail: 'Kredi kartı son ödeme',
      amount: remain,
      dueInDays: daysUntilDayOfMonth(c.dueDay),
      kind: 'card',
    });
  }

  for (const t of transactions) {
    if (t.deletedAt != null) continue;
    const due = daysUntilDate(t.date);
    if (due < 0 || due > 31) continue;
    upcoming.push({
      id: `tx-${t.id}`,
      title: categoryLabel(t.categoryId, t.customLabel),
      detail: 'Tek seferlik gider',
      amount: t.amount,
      dueInDays: due,
      kind: 'expense',
    });
  }

  upcoming.push(
    ...assetUpcomingPayments(assetsData.assets, assetsData.obligations)
  );

  upcoming.sort((a, b) => a.dueInDays - b.dueInDays);

  const cards: CardDebt[] = data.cards.map((c) => {
    const cardPeriod =
      openPeriodForCard(cardsData.statements, c.id) ?? period;
    const remain = remainingForPeriod(
      cardsData.statements,
      cardsData.payments,
      c.id,
      cardPeriod
    );
    return {
      id: c.id,
      name: c.name.trim() || 'Kredi kartı',
      statementAmount: remain,
      limit: c.limit,
      dueInDays: c.dueDay != null ? daysUntilDayOfMonth(c.dueDay) : 30,
      nextInstallmentLoad: nextMonthInstallmentLoad(
        cardsData.installments,
        c.id
      ),
    };
  });

  const investments: InvestmentHolding[] = data.investments.map((i) => ({
    id: i.id,
    platform: i.platform.trim() || 'Platform',
    balance: displayBalance(
      i.balance,
      investmentMovements,
      investmentSnapshots,
      i.id
    ),
    changePct:
      monthOverMonthPct(
        investmentSnapshots,
        i.id,
        currentPeriod(),
        investmentMovements
      ) ?? 0,
  }));

  const goals: DashboardGoal[] = toDashboardGoals(
    goalsData.goals,
    goalsData.contributions
  );

  const assets: DashboardAssetRow[] = toDashboardAssets(
    assetsData.assets,
    assetsData.obligations
  );

  return {
    userName: displayName(data.email),
    monthLabel: monthLabel(),
    income,
    extraIncome,
    spent,
    plannedExpense,
    remaining,
    upcoming: upcoming.slice(0, 12),
    cards,
    goals,
    investments,
    assets,
    insightHeadline: categoryInsight.headline,
  };
}

export function portfolioTotalFrom(investments: InvestmentHolding[]): number {
  return investments.reduce((s, i) => s + i.balance, 0);
}

export function cardLimitTotalFrom(cards: CardDebt[]): number {
  return cards.reduce((s, c) => s + c.limit, 0);
}

export function cardDebtTotalFrom(cards: CardDebt[]): number {
  return cards.reduce((s, c) => s + c.statementAmount, 0);
}
