import type { Goal, GoalContribution } from '@/features/goals/types';
import {
  summarizeActiveGoals,
  summarizeGoal,
  type GoalSummary,
} from '@/features/goals/derive';

export type GoalTrackStatus = 'on_track' | 'behind' | 'completed' | 'due_soon';

export interface GoalReportRow {
  summary: GoalSummary;
  status: GoalTrackStatus;
  statusLabel: string;
}

export interface GoalsReport {
  rows: GoalReportRow[];
  onTrackCount: number;
  behindCount: number;
  completedCount: number;
  headline: string | null;
}

function trackStatus(s: GoalSummary): GoalTrackStatus {
  if (s.goal.status === 'tamamlandi' || s.remaining <= 0) return 'completed';
  if (s.monthsLeft <= 1) return 'due_soon';
  if (s.monthsLeft >= 3 && s.progress < 0.2) return 'behind';
  if (s.monthsLeft >= 2 && s.progress < 0.1) return 'behind';
  if (s.monthsLeft <= 2 && s.progress < 0.5) return 'behind';
  return 'on_track';
}

function statusLabel(status: GoalTrackStatus): string {
  switch (status) {
    case 'on_track':
      return 'Yolunda';
    case 'behind':
      return 'Geride';
    case 'completed':
      return 'Tamamlandı';
    case 'due_soon':
      return 'Yaklaşıyor';
  }
}

/**
 * Aktif (+ tamamlanan) hedeflerin ilerleyiş özeti.
 */
export function goalsReport(
  goals: Goal[],
  contributions: GoalContribution[],
  asOf = new Date()
): GoalsReport {
  const active = summarizeActiveGoals(goals, contributions, asOf);

  const activeRows: GoalReportRow[] = active.map((summary) => {
    const status = trackStatus(summary);
    return { summary, status, statusLabel: statusLabel(status) };
  });

  const completedRows: GoalReportRow[] = goals
    .filter((g) => g.deletedAt == null && g.status === 'tamamlandi')
    .slice(0, 5)
    .map((g) => {
      const summary = summarizeGoal(g, contributions, asOf);
      return {
        summary: {
          ...summary,
          remaining: 0,
          progress: Math.min(1, Math.max(summary.progress, 1)),
        },
        status: 'completed' as const,
        statusLabel: statusLabel('completed'),
      };
    });

  const rows = [...activeRows, ...completedRows];
  const onTrackCount = activeRows.filter(
    (r) => r.status === 'on_track' || r.status === 'due_soon'
  ).length;
  const behindCount = activeRows.filter((r) => r.status === 'behind').length;
  const completedCount = completedRows.length;

  let headline: string | null = null;
  if (behindCount > 0) {
    headline = `${behindCount} hedef tempo gerisinde — aylık ayrımı gözden geçir.`;
  } else if (onTrackCount > 0) {
    headline = `${onTrackCount} aktif hedef yolunda.`;
  } else if (completedCount > 0) {
    headline = `${completedCount} hedef tamamlandı. Tebrikler!`;
  }

  return {
    rows,
    onTrackCount,
    behindCount,
    completedCount,
    headline,
  };
}
