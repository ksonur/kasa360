import type { CardPayment, CardsState } from './types';
import { loadDoc, saveDoc } from '@/lib/docs';

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
  const parsed = await loadDoc<CardsState>('cards', EMPTY, ['@kasa360/cards_v1']);
  return {
    statements: Array.isArray(parsed.statements) ? parsed.statements : [],
    payments: Array.isArray(parsed.payments)
      ? parsed.payments.map((p) => normalizePayment(p as CardPayment))
      : [],
    installments: Array.isArray(parsed.installments) ? parsed.installments : [],
  };
}

export async function saveCardsState(state: CardsState): Promise<void> {
  await saveDoc('cards', state);
}
