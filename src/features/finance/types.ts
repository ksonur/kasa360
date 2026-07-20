export type PaymentMethod = 'nakit' | 'kredi_karti' | 'banka_hesabi';

/** Tek seferlik gider — DATABASE.md transactions alanlarına hizalı (local). */
export interface LocalTransaction {
  id: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  categoryId: string;
  customLabel?: string;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
  /** YYYY-MM — kredi kartı harcamasında ekstre dönemi */
  statementPeriod?: string;
  note?: string;
  deletedAt: string | null;
  createdAt: string;
}

/** Maaş/mesai dışı plansız gelir. */
export interface ExtraIncome {
  id: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  sourceLabel: string;
  paymentMethod: PaymentMethod;
  deletedAt: string | null;
  createdAt: string;
}

export interface FinanceState {
  transactions: LocalTransaction[];
  extraIncomes: ExtraIncome[];
}

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'nakit', label: 'Nakit' },
  { id: 'kredi_karti', label: 'Kredi kartı' },
  { id: 'banka_hesabi', label: 'Banka hesabı' },
];
