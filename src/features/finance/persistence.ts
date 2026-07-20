import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExtraIncome, FinanceState, LocalTransaction } from './types';

const STORAGE_KEY = '@kasa360/finance_v1';
/** Eski tek liste anahtarı — bir kez migrate edilir. */
const LEGACY_TX_KEY = '@kasa360/transactions_v1';

const EMPTY: FinanceState = {
  transactions: [],
  extraIncomes: [],
};

export async function loadFinanceState(): Promise<FinanceState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FinanceState;
      return {
        transactions: Array.isArray(parsed.transactions)
          ? parsed.transactions
          : [],
        extraIncomes: Array.isArray(parsed.extraIncomes)
          ? parsed.extraIncomes
          : [],
      };
    }

    const legacy = await AsyncStorage.getItem(LEGACY_TX_KEY);
    if (legacy) {
      const list = JSON.parse(legacy) as LocalTransaction[];
      const migrated: FinanceState = {
        transactions: Array.isArray(list) ? list : [],
        extraIncomes: [],
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    return EMPTY;
  } catch {
    return EMPTY;
  }
}

export async function saveFinanceState(state: FinanceState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** @deprecated — loadFinanceState kullan */
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
