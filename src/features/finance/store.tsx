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
import { loadFinanceState, saveFinanceState } from './persistence';
import type {
  ExtraIncome,
  FinanceState,
  LocalTransaction,
  PaymentMethod,
} from './types';

interface AddExpenseInput {
  amount: number;
  date: string;
  categoryId: string;
  customLabel?: string;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
  statementPeriod?: string;
  note?: string;
}

interface AddExtraIncomeInput {
  amount: number;
  date: string;
  sourceLabel: string;
  paymentMethod: PaymentMethod;
}

interface FinanceContextValue {
  transactions: LocalTransaction[];
  extraIncomes: ExtraIncome[];
  hydrating: boolean;
  addExpense: (input: AddExpenseInput) => Promise<void>;
  softDelete: (id: string) => Promise<void>;
  addExtraIncome: (input: AddExtraIncomeInput) => Promise<void>;
  softDeleteExtraIncome: (id: string) => Promise<void>;
  activeExpenses: LocalTransaction[];
  activeExtraIncomes: ExtraIncome[];
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 300;

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>({
    transactions: [],
    extraIncomes: [],
  });
  const [hydrating, setHydrating] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let mounted = true;
    loadFinanceState().then((s) => {
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
      void saveFinanceState(state);
    }, SAVE_DEBOUNCE_MS);
  }, [state, hydrating]);

  const addExpense = useCallback(async (input: AddExpenseInput) => {
    const period =
      input.statementPeriod ??
      (input.paymentMethod === 'kredi_karti' ? input.date.slice(0, 7) : undefined);
    const row: LocalTransaction = {
      id: newId('tx'),
      amount: Math.round(input.amount),
      date: input.date,
      categoryId: input.categoryId,
      customLabel: input.customLabel,
      paymentMethod: input.paymentMethod,
      creditCardId: input.creditCardId,
      statementPeriod: period,
      note: input.note,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      transactions: [row, ...prev.transactions],
    }));
  }, []);

  const softDelete = useCallback(async (id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id ? { ...t, deletedAt: at } : t
      ),
    }));
  }, []);

  const addExtraIncome = useCallback(async (input: AddExtraIncomeInput) => {
    const row: ExtraIncome = {
      id: newId('xin'),
      amount: Math.round(input.amount),
      date: input.date,
      sourceLabel: input.sourceLabel.trim(),
      paymentMethod: input.paymentMethod,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      extraIncomes: [row, ...prev.extraIncomes],
    }));
  }, []);

  const softDeleteExtraIncome = useCallback(async (id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      extraIncomes: prev.extraIncomes.map((e) =>
        e.id === id ? { ...e, deletedAt: at } : e
      ),
    }));
  }, []);

  const activeExpenses = useMemo(
    () => state.transactions.filter((t) => t.deletedAt == null),
    [state.transactions]
  );

  const activeExtraIncomes = useMemo(
    () => state.extraIncomes.filter((e) => e.deletedAt == null),
    [state.extraIncomes]
  );

  const value = useMemo(
    () => ({
      transactions: state.transactions,
      extraIncomes: state.extraIncomes,
      hydrating,
      addExpense,
      softDelete,
      addExtraIncome,
      softDeleteExtraIncome,
      activeExpenses,
      activeExtraIncomes,
    }),
    [
      state,
      hydrating,
      addExpense,
      softDelete,
      addExtraIncome,
      softDeleteExtraIncome,
      activeExpenses,
      activeExtraIncomes,
    ]
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance, FinanceProvider içinde kullanılmalı');
  return ctx;
}

export function isSameMonth(dateStr: string, ref = new Date()): boolean {
  const [y, m] = dateStr.split('-').map(Number);
  return y === ref.getFullYear() && m === ref.getMonth() + 1;
}

export function sumSpentThisMonth(
  list: LocalTransaction[],
  ref = new Date()
): number {
  return list
    .filter((t) => t.deletedAt == null && isSameMonth(t.date, ref))
    .reduce((s, t) => s + t.amount, 0);
}

export function sumExtraIncomeThisMonth(
  list: ExtraIncome[],
  ref = new Date()
): number {
  return list
    .filter((e) => e.deletedAt == null && isSameMonth(e.date, ref))
    .reduce((s, e) => s + e.amount, 0);
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shiftISO(days: number, from = new Date()): string {
  const d = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate() + days
  );
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
