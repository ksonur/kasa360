import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { loadGoalsState, saveGoalsState } from './persistence';
import type {
  Goal,
  GoalContribution,
  GoalsState,
  GoalStatus,
  GoalUnit,
} from './types';

interface UpsertGoalInput {
  id?: string;
  title: string;
  targetAmount: number;
  targetDate: string;
  unit: GoalUnit;
}

interface AddContributionInput {
  goalId: string;
  amount: number;
  date: string;
  note?: string;
}

interface GoalsContextValue {
  goals: Goal[];
  contributions: GoalContribution[];
  hydrating: boolean;
  upsertGoal: (input: UpsertGoalInput) => string;
  softDeleteGoal: (id: string) => void;
  setGoalStatus: (id: string, status: GoalStatus) => void;
  addContribution: (input: AddContributionInput) => void;
  softDeleteContribution: (id: string) => void;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 300;

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GoalsState>({
    goals: [],
    contributions: [],
  });
  const [hydrating, setHydrating] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let mounted = true;
    loadGoalsState().then((s) => {
      if (!mounted) return;
      setState(s);
      setHydrating(false);
    });
    return () => {
      mounted = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (hydrating) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveGoalsState(state);
    }, SAVE_DEBOUNCE_MS);
  }, [state, hydrating]);

  const upsertGoal = useCallback((input: UpsertGoalInput): string => {
    const title = input.title.trim();
    const targetAmount = Math.round(input.targetAmount);
    const targetDate = input.targetDate;
    const unit = input.unit;
    const resultId = input.id ?? newId('goal');

    setState((prev) => {
      if (input.id) {
        return {
          ...prev,
          goals: prev.goals.map((g) =>
            g.id === input.id && g.deletedAt == null
              ? { ...g, title, targetAmount, targetDate, unit }
              : g
          ),
        };
      }
      const row: Goal = {
        id: resultId,
        title,
        targetAmount,
        unit,
        targetDate,
        status: 'aktif',
        deletedAt: null,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, goals: [row, ...prev.goals] };
    });

    return resultId;
  }, []);

  const softDeleteGoal = useCallback((id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id ? { ...g, deletedAt: at } : g
      ),
    }));
  }, []);

  const setGoalStatus = useCallback((id: string, status: GoalStatus) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id && g.deletedAt == null ? { ...g, status } : g
      ),
    }));
  }, []);

  const addContribution = useCallback((input: AddContributionInput) => {
    const row: GoalContribution = {
      id: newId('gcon'),
      goalId: input.goalId,
      amount: Math.round(input.amount),
      date: input.date,
      note: input.note?.trim() || undefined,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      contributions: [row, ...prev.contributions],
    }));
  }, []);

  const softDeleteContribution = useCallback((id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      contributions: prev.contributions.map((c) =>
        c.id === id ? { ...c, deletedAt: at } : c
      ),
    }));
  }, []);

  const value = useMemo<GoalsContextValue>(
    () => ({
      goals: state.goals,
      contributions: state.contributions,
      hydrating,
      upsertGoal,
      softDeleteGoal,
      setGoalStatus,
      addContribution,
      softDeleteContribution,
    }),
    [
      state,
      hydrating,
      upsertGoal,
      softDeleteGoal,
      setGoalStatus,
      addContribution,
      softDeleteContribution,
    ]
  );

  return (
    <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
  );
}

export function useGoals(): GoalsContextValue {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals, GoalsProvider içinde kullanılmalı');
  return ctx;
}
