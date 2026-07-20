import {
  monthsLeft,
  monthlyRequired,
  savedAmount,
  type Goal,
  type GoalContribution,
} from '@/features/goals';

export interface WhatIfInput {
  goal: Goal;
  contributions: GoalContribution[];
  /**
   * Bu ay hedefe ayıramayacağın tutar — hedef biriminde
   * (TRY/USD/EUR/GBP/gram). TL ile karıştırılmaz.
   */
  extraSpend: number;
}

export interface WhatIfResult {
  saved: number;
  remaining: number;
  monthsLeftNow: number;
  monthlyRequiredNow: number;
  /** Ekstra harcama sonrası (saved aynı; aylık kapasite düşmüş gibi gecikme) */
  monthsLeftAfter: number;
  monthlyRequiredAfter: number;
  delayMonths: number;
}

/**
 * Fazla harcama → hedefe aylık ayırabileceğin tutar düşer varsayımıyla
 * gecikme tahmini. Basit model: ekstra harcama = o ay katkı yapılamaması;
 * remaining aynı kalır, monthlyRequired artar / süre uzar.
 */
export function simulateGoalDelay(input: WhatIfInput): WhatIfResult {
  const saved = savedAmount(input.contributions, input.goal.id);
  const remaining = Math.max(0, input.goal.targetAmount - saved);
  const monthsNow = monthsLeft(input.goal.targetDate);
  const monthlyNow = monthlyRequired(input.goal.targetAmount, saved, monthsNow);

  const extra = Math.max(0, Math.round(input.extraSpend));
  // Bu ay ayıramadığın tutar → kalan süreye yayılır
  const effectiveRemaining = remaining + extra;
  const monthlyAfter =
    monthsNow <= 0
      ? effectiveRemaining
      : Math.ceil(effectiveRemaining / monthsNow);

  // Sabit aylık kapasite = eski monthlyRequired varsay; kaç ay gerekir?
  const capacity = monthlyNow > 0 ? monthlyNow : effectiveRemaining;
  const monthsNeeded =
    capacity <= 0
      ? 0
      : Math.ceil(effectiveRemaining / capacity);
  const delayMonths = Math.max(0, monthsNeeded - monthsNow);

  return {
    saved,
    remaining,
    monthsLeftNow: monthsNow,
    monthlyRequiredNow: monthlyNow,
    monthsLeftAfter: monthsNeeded,
    monthlyRequiredAfter: monthlyAfter,
    delayMonths,
  };
}
