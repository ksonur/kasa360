import type { Goal, GoalContribution } from './types';

export function activeGoals(list: Goal[]): Goal[] {
  return list.filter((g) => g.deletedAt == null && g.status === 'aktif');
}

export function activeContributions(
  list: GoalContribution[]
): GoalContribution[] {
  return list.filter((c) => c.deletedAt == null);
}

export function contributionsForGoal(
  contributions: GoalContribution[],
  goalId: string
): GoalContribution[] {
  return activeContributions(contributions)
    .filter((c) => c.goalId === goalId)
    .slice()
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export function savedAmount(
  contributions: GoalContribution[],
  goalId: string
): number {
  return contributionsForGoal(contributions, goalId).reduce(
    (s, c) => s + Math.round(c.amount),
    0
  );
}

/** Bugünden hedef tarihe kalan ay sayısı (en az 0). */
export function monthsLeft(targetDate: string, asOf = new Date()): number {
  const [y, m, d] = targetDate.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const start = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  if (target <= start) return 0;
  const months =
    (target.getFullYear() - start.getFullYear()) * 12 +
    (target.getMonth() - start.getMonth());
  // Aynı ay içinde ileriki gün → 1 ay say
  if (months === 0) return 1;
  // Gün farkı: hedef günü henüz gelmediyse tam ay, geçtiyse +1 gerekebilir
  // Basit: takvim ay farkı yeterli; kalan kısmi ay için +1
  return target.getDate() >= start.getDate() ? months : Math.max(1, months);
}

/** Aylık ayrılması gereken tutar (tam sayı). */
export function monthlyRequired(
  targetAmount: number,
  saved: number,
  months: number
): number {
  const remaining = Math.max(0, Math.round(targetAmount) - Math.round(saved));
  if (remaining <= 0) return 0;
  if (months <= 0) return remaining;
  return Math.ceil(remaining / months);
}

export function progressRatio(saved: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(1, Math.round(saved) / Math.round(target));
}

export interface GoalSummary {
  goal: Goal;
  saved: number;
  remaining: number;
  monthsLeft: number;
  monthlyRequired: number;
  progress: number;
}

export function summarizeGoal(
  goal: Goal,
  contributions: GoalContribution[],
  asOf = new Date()
): GoalSummary {
  const saved = savedAmount(contributions, goal.id);
  const months = monthsLeft(goal.targetDate, asOf);
  const remaining = Math.max(0, goal.targetAmount - saved);
  return {
    goal,
    saved,
    remaining,
    monthsLeft: months,
    monthlyRequired: monthlyRequired(goal.targetAmount, saved, months),
    progress: progressRatio(saved, goal.targetAmount),
  };
}

export function summarizeActiveGoals(
  goals: Goal[],
  contributions: GoalContribution[],
  asOf = new Date()
): GoalSummary[] {
  return activeGoals(goals)
    .map((g) => summarizeGoal(g, contributions, asOf))
    .sort((a, b) => a.goal.targetDate.localeCompare(b.goal.targetDate));
}

/** Dashboard Goal satırı. */
export function toDashboardGoals(
  goals: Goal[],
  contributions: GoalContribution[]
): {
  id: string;
  title: string;
  saved: number;
  target: number;
  monthsLeft: number;
  unit: Goal['unit'];
}[] {
  return summarizeActiveGoals(goals, contributions).map((s) => ({
    id: s.goal.id,
    title: s.goal.title.trim() || 'Hedef',
    saved: s.saved,
    target: s.goal.targetAmount,
    monthsLeft: s.monthsLeft,
    unit: s.goal.unit,
  }));
}
