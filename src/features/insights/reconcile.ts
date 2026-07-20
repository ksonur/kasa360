import type { LocalTransaction } from '@/features/finance/types';
import type { CardStatement } from '@/features/cards/types';
import { statementForPeriod } from '@/features/cards/derive';

export interface ReconcileResult {
  creditCardId: string;
  period: string;
  statementAmount: number;
  transactionsTotal: number;
  /** ekstre − Σ kart harcamaları (pozitif = detaylandırılmamış) */
  gap: number;
  hasStatement: boolean;
  matched: boolean;
}

function periodOf(tx: LocalTransaction): string {
  return tx.statementPeriod ?? tx.date.slice(0, 7);
}

export function sumCardTransactionsForPeriod(
  transactions: LocalTransaction[],
  creditCardId: string,
  period: string
): number {
  return transactions
    .filter(
      (t) =>
        t.deletedAt == null &&
        t.paymentMethod === 'kredi_karti' &&
        t.creditCardId === creditCardId &&
        periodOf(t) === period &&
        // Uzlaştırma satırı tekrar sayılmasın
        t.note !== 'detaylandirilmamis_ekstre'
    )
    .reduce((s, t) => s + t.amount, 0);
}

/**
 * Ekstre tutarı bütçeye eklenmez; sadece doğrulama.
 * gap > 0 → ekstre > girilen harcamalar.
 */
export function reconcileCardPeriod(
  statements: CardStatement[],
  transactions: LocalTransaction[],
  creditCardId: string,
  period: string
): ReconcileResult {
  const st = statementForPeriod(statements, creditCardId, period);
  const statementAmount = st?.amount ?? 0;
  const transactionsTotal = sumCardTransactionsForPeriod(
    transactions,
    creditCardId,
    period
  );
  const gap = statementAmount - transactionsTotal;
  return {
    creditCardId,
    period,
    statementAmount,
    transactionsTotal,
    gap,
    hasStatement: !!st,
    matched: !!st && gap === 0,
  };
}
