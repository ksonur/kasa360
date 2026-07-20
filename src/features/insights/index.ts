export { simulateGoalDelay } from './whatIf';
export type { WhatIfInput, WhatIfResult } from './whatIf';

export { buildCashflowMonth, dayIntensity } from './cashflow';
export type { CashflowDay, CashflowDayItem, CashflowMonth } from './cashflow';

export { categorySpendThisMonth } from './categorySpend';
export type { CategorySpendInsight, CategorySpendRow } from './categorySpend';

export {
  reconcileCardPeriod,
  sumCardTransactionsForPeriod,
} from './reconcile';
export type { ReconcileResult } from './reconcile';
