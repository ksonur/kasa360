import type { GoalUnit } from './units';

export type { GoalUnit } from './units';
export type GoalStatus = 'aktif' | 'tamamlandi' | 'iptal';

/** Sanal birikim hedefi — gerçek bakiyeden bağımsız (mental accounting). */
export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  /** Hedef birimi: döviz veya altın (gram). */
  unit: GoalUnit;
  /** YYYY-MM-DD */
  targetDate: string;
  status: GoalStatus;
  deletedAt: string | null;
  createdAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  note?: string;
  deletedAt: string | null;
  createdAt: string;
}

export interface GoalsState {
  goals: Goal[];
  contributions: GoalContribution[];
}
