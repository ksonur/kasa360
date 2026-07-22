import type { ExtraIncome, FinanceState, LocalTransaction } from './types';
import { loadDoc, saveDoc } from '@/lib/docs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMPTY: FinanceState = {
  transactions: [],
  extraIncomes: [],
};

async function migrateLegacyFinance(): Promise<void> {
  const legacy = await AsyncStorage.getItem('@kasa360/finance_v1');
  if (legacy) return;
  const oldTx = await AsyncStorage.getItem('@kasa360/transactions_v1');
  if (!oldTx) return;
  try {
    const list = JSON.parse(oldTx) as LocalTransaction[];
    const migrated: FinanceState = {
      transactions: Array.isArray(list) ? list : [],
      extraIncomes: [],
    };
    await AsyncStorage.setItem('@kasa360/finance_v1', JSON.stringify(migrated));
  } catch {
    // ignore
  }
}

export async function loadFinanceState(): Promise<FinanceState> {
  await migrateLegacyFinance();
  const parsed = await loadDoc<FinanceState>('finance', EMPTY, [
    '@kasa360/finance_v1',
  ]);
  return {
    transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    extraIncomes: Array.isArray(parsed.extraIncomes) ? parsed.extraIncomes : [],
  };
}

export async function saveFinanceState(state: FinanceState): Promise<void> {
  await saveDoc('finance', state);
}

/** @deprecated */
export async function loadTransactions(): Promise<LocalTransaction[]> {
  const s = await loadFinanceState();
  return s.transactions;
}

/** @deprecated */
export async function saveTransactions(list: LocalTransaction[]): Promise<void> {
  const s = await loadFinanceState();
  await saveFinanceState({ ...s, transactions: list });
}

export type { ExtraIncome };
