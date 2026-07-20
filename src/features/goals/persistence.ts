import AsyncStorage from '@react-native-async-storage/async-storage';
import { isGoalUnit } from './units';
import type { Goal, GoalsState } from './types';

const STORAGE_KEY = '@kasa360/goals_v1';

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
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as GoalsState;
    return {
      goals: Array.isArray(parsed.goals)
        ? parsed.goals.map((g) => normalizeGoal(g as Goal))
        : [],
      contributions: Array.isArray(parsed.contributions)
        ? parsed.contributions
        : [],
    };
  } catch {
    return EMPTY;
  }
}

export async function saveGoalsState(state: GoalsState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
