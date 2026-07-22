import { isGoalUnit } from './units';
import type { Goal, GoalsState } from './types';
import { loadDoc, saveDoc } from '@/lib/docs';

const EMPTY: GoalsState = {
  goals: [],
  contributions: [],
};

function normalizeGoal(raw: Goal): Goal {
  return {
    ...raw,
    unit: isGoalUnit(raw.unit) ? raw.unit : 'TRY',
  };
}

export async function loadGoalsState(): Promise<GoalsState> {
  const parsed = await loadDoc<GoalsState>('goals', EMPTY, ['@kasa360/goals_v1']);
  return {
    goals: Array.isArray(parsed.goals)
      ? parsed.goals.map((g) => normalizeGoal(g as Goal))
      : [],
    contributions: Array.isArray(parsed.contributions)
      ? parsed.contributions
      : [],
  };
}

export async function saveGoalsState(state: GoalsState): Promise<void> {
  await saveDoc('goals', state);
}
