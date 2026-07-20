export type InstallmentPaymentMethod = 'kredi_karti' | 'nakit';
export type InstallmentStatus = 'aktif' | 'kapatildi';

/** Aylık ekstre — doğrulama referansı; spent toplamına eklenmez. */
export interface CardStatement {
  id: string;
  creditCardId: string;
  /** YYYY-MM */
  period: string;
  amount: number;
  deletedAt: string | null;
  createdAt: string;
}

export interface CardPayment {
  id: string;
  creditCardId: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  /** Ödemenin uygulandığı ekstre dönemi (YYYY-MM). */
  statementPeriod: string;
  note?: string;
  deletedAt: string | null;
  createdAt: string;
}

export interface InstallmentPurchase {
  id: string;
  itemName: string;
  totalAmount: number;
  installmentCount: number;
  monthlyAmount: number;
  /** YYYY-MM-DD ilk taksit */
  startDate: string;
  paymentMethod: InstallmentPaymentMethod;
  creditCardId?: string;
  status: InstallmentStatus;
  closedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface CardsState {
  statements: CardStatement[];
  payments: CardPayment[];
  installments: InstallmentPurchase[];
}
