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
import { loadInvestmentsState, saveInvestmentsState } from './persistence';
import { currentPeriod } from './derive';
import type {
  InvestmentBalanceSnapshot,
  InvestmentMovement,
  InvestmentMovementType,
  InvestmentsState,
} from './types';

interface AddMovementInput {
  platformId: string;
  type: InvestmentMovementType;
  amount: number;
  date: string;
  note?: string;
}

interface UpsertSnapshotInput {
  platformId: string;
  period: string;
  balance: number;
}

interface InvestmentsContextValue {
  movements: InvestmentMovement[];
  snapshots: InvestmentBalanceSnapshot[];
  hydrating: boolean;
  addMovement: (input: AddMovementInput) => void;
  softDeleteMovement: (id: string) => void;
  upsertSnapshot: (input: UpsertSnapshotInput) => void;
  softDeleteSnapshot: (id: string) => void;
}

const InvestmentsContext = createContext<InvestmentsContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 300;

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function InvestmentsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InvestmentsState>({
    movements: [],
    snapshots: [],
  });
  const [hydrating, setHydrating] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let mounted = true;
    loadInvestmentsState().then((s) => {
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
      void saveInvestmentsState(state);
    }, SAVE_DEBOUNCE_MS);
  }, [state, hydrating]);

  const addMovement = useCallback((input: AddMovementInput) => {
    const row: InvestmentMovement = {
      id: newId('imov'),
      platformId: input.platformId,
      type: input.type,
      amount: Math.round(input.amount),
      date: input.date,
      note: input.note?.trim() || undefined,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      movements: [row, ...prev.movements],
    }));
  }, []);

  const softDeleteMovement = useCallback((id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      movements: prev.movements.map((m) =>
        m.id === id ? { ...m, deletedAt: at } : m
      ),
    }));
  }, []);

  const upsertSnapshot = useCallback((input: UpsertSnapshotInput) => {
    const balance = Math.round(input.balance);
    const period = input.period || currentPeriod();
    setState((prev) => {
      const existing = prev.snapshots.find(
        (s) =>
          s.deletedAt == null &&
          s.platformId === input.platformId &&
          s.period === period
      );
      if (existing) {
        return {
          ...prev,
          snapshots: prev.snapshots.map((s) =>
            s.id === existing.id ? { ...s, balance } : s
          ),
        };
      }
      const row: InvestmentBalanceSnapshot = {
        id: newId('isnap'),
        platformId: input.platformId,
        period,
        balance,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, snapshots: [row, ...prev.snapshots] };
    });
  }, []);

  const softDeleteSnapshot = useCallback((id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      snapshots: prev.snapshots.map((s) =>
        s.id === id ? { ...s, deletedAt: at } : s
      ),
    }));
  }, []);

  const value = useMemo<InvestmentsContextValue>(
    () => ({
      movements: state.movements,
      snapshots: state.snapshots,
      hydrating,
      addMovement,
      softDeleteMovement,
      upsertSnapshot,
      softDeleteSnapshot,
    }),
    [
      state,
      hydrating,
      addMovement,
      softDeleteMovement,
      upsertSnapshot,
      softDeleteSnapshot,
    ]
  );

  return (
    <InvestmentsContext.Provider value={value}>
      {children}
    </InvestmentsContext.Provider>
  );
}

export function useInvestments(): InvestmentsContextValue {
  const ctx = useContext(InvestmentsContext);
  if (!ctx) {
    throw new Error('useInvestments, InvestmentsProvider içinde kullanılmalı');
  }
  return ctx;
}
