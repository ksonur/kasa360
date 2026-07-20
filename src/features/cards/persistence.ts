import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardPayment, CardsState } from './types';

const STORAGE_KEY = '@kasa360/cards_v1';

const EMPTY: CardsState = {
  statements: [],
  payments: [],
  installments: [],
};

function normalizePayment(raw: CardPayment): CardPayment {
  const statementPeriod =
    typeof raw.statementPeriod === 'string' &&
    /^\d{4}-\d{2}$/.test(raw.statementPeriod)
      ? raw.statementPeriod
      : typeof raw.date === 'string' && raw.date.length >= 7
        ? raw.date.slice(0, 7)
        : '';
  return { ...raw, statementPeriod };
}

export async function loadCardsState(): Promise<CardsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CardsState;
    return {
      statements: Array.isArray(parsed.statements) ? parsed.statements : [],
      payments: Array.isArray(parsed.payments)
        ? parsed.payments.map((p) => normalizePayment(p as CardPayment))
        : [],
      installments: Array.isArray(parsed.installments)
        ? parsed.installments
        : [],
    };
  } catch {
    return EMPTY;
  }
}

export async function saveCardsState(state: CardsState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
