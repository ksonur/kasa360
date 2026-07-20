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
import {
  clearDraft,
  loadDraft,
  saveDraft,
  type OnboardingDraft,
  type OnboardingStep,
} from './persistence';
import type {
  CreditCardDraft,
  InvestmentDraft,
  OnboardingState,
  RoutineExpenseDraft,
} from './types';
import {
  getAmountForMonth,
  isYearSeeded,
  monthKey,
  seedYearAmount,
  type MonthKey,
} from './monthlyAmounts';

export type {
  CreditCardDraft,
  InvestmentDraft,
  OnboardingState,
  RoutineExpenseDraft,
} from './types';

/**
 * Maaş & mesai: ilk girişte yılın tüm ayları; sonra ay bazlı düzenleme.
 */

interface OnboardingContextValue {
  data: OnboardingState;
  completed: boolean;
  currentStep: OnboardingStep;
  hydrating: boolean;
  setEmail: (email: string) => void;
  /**
   * Maaş güncelle — yıl tohumlanmamışsa 12 aya yazar, aksi halde sadece ayı.
   */
  setSalary: (amount: number, month?: MonthKey) => void;
  applySalaryToYear: (amount: number, year?: number) => void;
  setSalaryMonths: (months: Record<string, number>) => void;
  setOvertime: (amount: number, month?: MonthKey) => void;
  applyOvertimeToYear: (amount: number, year?: number) => void;
  setOvertimeMonth: (month: MonthKey, amount: number) => void;
  setOvertimeMonths: (months: Record<string, number>) => void;
  setRoutineExpenses: (list: RoutineExpenseDraft[]) => void;
  setCards: (list: CreditCardDraft[]) => void;
  setInvestments: (list: InvestmentDraft[]) => void;
  setCurrentStep: (step: OnboardingStep) => void;
  completeOnboarding: () => Promise<void>;
  reset: () => Promise<void>;
}

export const INITIAL_ONBOARDING: OnboardingState = {
  email: '',
  salaryByMonth: {},
  overtimeByMonth: {},
  routineExpenses: [],
  cards: [],
  investments: [],
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 300;

function patchMonthMap(
  current: Record<string, number>,
  amount: number,
  month: MonthKey
): Record<string, number> {
  const value = Math.round(amount);
  const year = Number(month.slice(0, 4));
  if (!isYearSeeded(current, year)) {
    return { ...current, ...seedYearAmount(value, year) };
  }
  return { ...current, [month]: value };
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingState>(INITIAL_ONBOARDING);
  const [completed, setCompleted] = useState(false);
  const [currentStep, setCurrentStepState] = useState<OnboardingStep>('income');
  const [hydrating, setHydrating] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  const persist = useCallback((draft: OnboardingDraft) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveDraft(draft);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadDraft().then((draft) => {
      if (!mounted) return;
      if (draft) {
        setData(draft.data);
        setCompleted(draft.completed);
        setCurrentStepState(draft.currentStep);
      }
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
    persist({ data, completed, currentStep });
  }, [data, completed, currentStep, hydrating, persist]);

  const setEmail = useCallback((email: string) => {
    setData((d) => ({ ...d, email }));
  }, []);

  const setSalary = useCallback((amount: number, month: MonthKey = monthKey()) => {
    setData((d) => ({
      ...d,
      salaryByMonth: patchMonthMap(d.salaryByMonth, amount, month),
    }));
  }, []);

  const applySalaryToYear = useCallback((amount: number, year = new Date().getFullYear()) => {
    const seeded = seedYearAmount(amount, year);
    setData((d) => ({
      ...d,
      salaryByMonth: { ...d.salaryByMonth, ...seeded },
    }));
  }, []);

  const setSalaryMonths = useCallback((months: Record<string, number>) => {
    const rounded: Record<string, number> = {};
    for (const [k, v] of Object.entries(months)) {
      rounded[k] = Math.round(v);
    }
    setData((d) => ({
      ...d,
      salaryByMonth: { ...d.salaryByMonth, ...rounded },
    }));
  }, []);

  const setOvertime = useCallback((amount: number, month: MonthKey = monthKey()) => {
    setData((d) => ({
      ...d,
      overtimeByMonth: patchMonthMap(d.overtimeByMonth, amount, month),
    }));
  }, []);

  const applyOvertimeToYear = useCallback((amount: number, year = new Date().getFullYear()) => {
    const seeded = seedYearAmount(amount, year);
    setData((d) => ({
      ...d,
      overtimeByMonth: { ...d.overtimeByMonth, ...seeded },
    }));
  }, []);

  const setOvertimeMonth = useCallback((month: MonthKey, amount: number) => {
    setData((d) => ({
      ...d,
      overtimeByMonth: {
        ...d.overtimeByMonth,
        [month]: Math.round(amount),
      },
    }));
  }, []);

  const setOvertimeMonths = useCallback((months: Record<string, number>) => {
    const rounded: Record<string, number> = {};
    for (const [k, v] of Object.entries(months)) {
      rounded[k] = Math.round(v);
    }
    setData((d) => ({
      ...d,
      overtimeByMonth: { ...d.overtimeByMonth, ...rounded },
    }));
  }, []);

  const setRoutineExpenses = useCallback((routineExpenses: RoutineExpenseDraft[]) => {
    setData((d) => ({ ...d, routineExpenses }));
  }, []);

  const setCards = useCallback((cards: CreditCardDraft[]) => {
    setData((d) => ({ ...d, cards }));
  }, []);

  const setInvestments = useCallback((investments: InvestmentDraft[]) => {
    setData((d) => ({ ...d, investments }));
  }, []);

  const setCurrentStep = useCallback((step: OnboardingStep) => {
    setCurrentStepState(step);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setCompleted(true);
    setCurrentStepState('summary');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await saveDraft({ data, completed: true, currentStep: 'summary' });
  }, [data]);

  const reset = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    skipNextSave.current = true;
    setData(INITIAL_ONBOARDING);
    setCompleted(false);
    setCurrentStepState('income');
    await clearDraft();
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      data,
      completed,
      currentStep,
      hydrating,
      setEmail,
      setSalary,
      applySalaryToYear,
      setSalaryMonths,
      setOvertime,
      applyOvertimeToYear,
      setOvertimeMonth,
      setOvertimeMonths,
      setRoutineExpenses,
      setCards,
      setInvestments,
      setCurrentStep,
      completeOnboarding,
      reset,
    }),
    [
      data,
      completed,
      currentStep,
      hydrating,
      setEmail,
      setSalary,
      applySalaryToYear,
      setSalaryMonths,
      setOvertime,
      applyOvertimeToYear,
      setOvertimeMonth,
      setOvertimeMonths,
      setRoutineExpenses,
      setCards,
      setInvestments,
      setCurrentStep,
      completeOnboarding,
      reset,
    ]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding, OnboardingProvider içinde kullanılmalı');
  return ctx;
}

/** Seçili ay için maaş + mesai (varsayılan: bu ay). */
export function totalIncome(s: OnboardingState, month: MonthKey = monthKey()): number {
  return (
    getAmountForMonth(s.salaryByMonth, month) + getAmountForMonth(s.overtimeByMonth, month)
  );
}

export function totalRoutineExpense(s: OnboardingState): number {
  return s.routineExpenses.reduce((sum, e) => sum + e.amount, 0);
}
