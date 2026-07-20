export { GoalsProvider, useGoals } from './store';
export type {
  Goal,
  GoalContribution,
  GoalStatus,
  GoalUnit,
  GoalsState,
} from './types';
export {
  activeGoals,
  activeContributions,
  contributionsForGoal,
  savedAmount,
  monthsLeft,
  monthlyRequired,
  progressRatio,
  summarizeGoal,
  summarizeActiveGoals,
  toDashboardGoals,
} from './derive';
export type { GoalSummary } from './derive';
export {
  GOAL_UNITS,
  formatGoalAmount,
  goalUnitMeta,
  isGoalUnit,
} from './units';
export type { GoalUnitMeta } from './units';
