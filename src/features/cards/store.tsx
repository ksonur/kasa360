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
import { loadCardsState, saveCardsState } from './persistence';
import { computeMonthlyAmount, currentPeriod } from './derive';
import type {
  CardPayment,
  CardStatement,
  CardsState,
  InstallmentPaymentMethod,
  InstallmentPurchase,
} from './types';

interface AddStatementInput {
  creditCardId: string;
  period: string;
  amount: number;
}

interface AddPaymentInput {
  creditCardId: string;
  amount: number;
  date: string;
  /** Ödemenin uygulandığı ekstre dönemi (YYYY-MM). */
  statementPeriod: string;
  note?: string;
}

interface AddInstallmentInput {
  itemName: string;
  totalAmount: number;
  installmentCount: number;
  startDate: string;
  paymentMethod: InstallmentPaymentMethod;
  creditCardId?: string;
}

interface UpdateInstallmentInput extends AddInstallmentInput {
  id: string;
}

interface CardsContextValue {
  statements: CardStatement[];
  payments: CardPayment[];
  installments: InstallmentPurchase[];
  hydrating: boolean;
  upsertStatement: (input: AddStatementInput) => void;
  softDeleteStatement: (id: string) => void;
  addPayment: (input: AddPaymentInput) => void;
  softDeletePayment: (id: string) => void;
  addInstallment: (input: AddInstallmentInput) => void;
  updateInstallment: (input: UpdateInstallmentInput) => void;
  closeInstallment: (id: string) => void;
  softDeleteInstallment: (id: string) => void;
}

const CardsContext = createContext<CardsContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 300;

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function CardsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CardsState>({
    statements: [],
    payments: [],
    installments: [],
  });
  const [hydrating, setHydrating] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let mounted = true;
    loadCardsState().then((s) => {
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
      void saveCardsState(state);
    }, SAVE_DEBOUNCE_MS);
  }, [state, hydrating]);

  const upsertStatement = useCallback((input: AddStatementInput) => {
    const amount = Math.round(input.amount);
    const period = input.period || currentPeriod();
    setState((prev) => {
      const existing = prev.statements.find(
        (s) =>
          s.deletedAt == null &&
          s.creditCardId === input.creditCardId &&
          s.period === period
      );
      if (existing) {
        return {
          ...prev,
          statements: prev.statements.map((s) =>
            s.id === existing.id ? { ...s, amount } : s
          ),
        };
      }
      const row: CardStatement = {
        id: newId('st'),
        creditCardId: input.creditCardId,
        period,
        amount,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, statements: [row, ...prev.statements] };
    });
  }, []);

  const softDeleteStatement = useCallback((id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      statements: prev.statements.map((s) =>
        s.id === id ? { ...s, deletedAt: at } : s
      ),
    }));
  }, []);

  const addPayment = useCallback((input: AddPaymentInput) => {
    const statementPeriod =
      input.statementPeriod && /^\d{4}-\d{2}$/.test(input.statementPeriod)
        ? input.statementPeriod
        : input.date.slice(0, 7);
    const row: CardPayment = {
      id: newId('pay'),
      creditCardId: input.creditCardId,
      amount: Math.round(input.amount),
      date: input.date,
      statementPeriod,
      note: input.note,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, payments: [row, ...prev.payments] }));
  }, []);

  const softDeletePayment = useCallback((id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === id ? { ...p, deletedAt: at } : p
      ),
    }));
  }, []);

  const addInstallment = useCallback((input: AddInstallmentInput) => {
    const count = Math.max(1, Math.round(input.installmentCount));
    const total = Math.round(input.totalAmount);
    const monthly = computeMonthlyAmount(total, count);
    const row: InstallmentPurchase = {
      id: newId('inst'),
      itemName: input.itemName.trim(),
      totalAmount: total,
      installmentCount: count,
      monthlyAmount: monthly,
      startDate: input.startDate,
      paymentMethod: input.paymentMethod,
      creditCardId: input.creditCardId,
      status: 'aktif',
      closedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      installments: [row, ...prev.installments],
    }));
  }, []);

  const updateInstallment = useCallback((input: UpdateInstallmentInput) => {
    const count = Math.max(1, Math.round(input.installmentCount));
    const total = Math.round(input.totalAmount);
    const monthly = computeMonthlyAmount(total, count);
    setState((prev) => ({
      ...prev,
      installments: prev.installments.map((i) =>
        i.id === input.id && i.deletedAt == null
          ? {
              ...i,
              itemName: input.itemName.trim(),
              totalAmount: total,
              installmentCount: count,
              monthlyAmount: monthly,
              startDate: input.startDate,
              paymentMethod: input.paymentMethod,
              creditCardId:
                input.paymentMethod === 'kredi_karti'
                  ? input.creditCardId
                  : undefined,
            }
          : i
      ),
    }));
  }, []);

  const closeInstallment = useCallback((id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      installments: prev.installments.map((i) =>
        i.id === id ? { ...i, status: 'kapatildi', closedAt: at } : i
      ),
    }));
  }, []);

  const softDeleteInstallment = useCallback((id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      installments: prev.installments.map((i) =>
        i.id === id ? { ...i, deletedAt: at } : i
      ),
    }));
  }, []);

  const value = useMemo<CardsContextValue>(
    () => ({
      statements: state.statements,
      payments: state.payments,
      installments: state.installments,
      hydrating,
      upsertStatement,
      softDeleteStatement,
      addPayment,
      softDeletePayment,
      addInstallment,
      updateInstallment,
      closeInstallment,
      softDeleteInstallment,
    }),
    [
      state,
      hydrating,
      upsertStatement,
      softDeleteStatement,
      addPayment,
      softDeletePayment,
      addInstallment,
      updateInstallment,
      closeInstallment,
      softDeleteInstallment,
    ]
  );

  return <CardsContext.Provider value={value}>{children}</CardsContext.Provider>;
}

export function useCards(): CardsContextValue {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error('useCards, CardsProvider içinde kullanılmalı');
  return ctx;
}
