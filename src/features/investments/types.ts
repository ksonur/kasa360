export type InvestmentMovementType = 'yatirma' | 'cekme';

/** Para yatırma / çekme — nakit akışı geçmişi. */
export interface InvestmentMovement {
  id: string;
  platformId: string;
  type: InvestmentMovementType;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  note?: string;
  deletedAt: string | null;
  createdAt: string;
}

/**
 * Ay sonu / dönem portföy değeri.
 * Kar-zarar (MoM / YoY) bu kayıtlardan türetilir.
 */
export interface InvestmentBalanceSnapshot {
  id: string;
  platformId: string;
  /** YYYY-MM */
  period: string;
  balance: number;
  deletedAt: string | null;
  createdAt: string;
}

export interface InvestmentsState {
  movements: InvestmentMovement[];
  snapshots: InvestmentBalanceSnapshot[];
}
