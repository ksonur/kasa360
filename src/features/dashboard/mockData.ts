/**
 * Dashboard için geçici örnek veri. Backend (Supabase) bağlanana kadar UI'ı
 * gerçekçi değerlerle beslemek için kullanılır. Tüm tutarlar tam sayı (numeric).
 *
 * NOT: Gerçek uygulamada bu değerler `transactions` tablosundan türetilecek
 * (bkz. DATABASE.md — bütçe/dashboard her zaman transactions'tan beslenir).
 */

export interface UpcomingPayment {
  id: string;
  title: string;
  detail: string;
  amount: number;
  dueInDays: number;
  kind: 'card' | 'expense' | 'tax' | 'insurance';
}

export interface CardDebt {
  id: string;
  name: string;
  statementAmount: number;
  limit: number;
  dueInDays: number;
  /** Gelecek ay bu karta düşen taksit yükü */
  nextInstallmentLoad: number;
}

export interface Goal {
  id: string;
  title: string;
  saved: number;
  target: number;
  monthsLeft: number;
  /** TRY | USD | EUR | GBP | ALTIN — yoksa TRY varsayılır */
  unit?: string;
}

export interface InvestmentHolding {
  id: string;
  platform: string;
  balance: number;
  changePct: number;
}

export const dashboard = {
  userName: 'Onur',
  monthLabel: 'Temmuz 2026',

  income: 62500,
  spent: 28400,
  // Bu ay planlanan toplam gider (rutin + tahmini)
  plannedExpense: 41200,

  upcoming: [
    { id: 'u1', title: 'Bankam Bonus', detail: 'Kredi kartı son ödeme', amount: 8450, dueInDays: 3, kind: 'card' },
    { id: 'u2', title: 'Kira', detail: 'Aylık kira', amount: 18000, dueInDays: 5, kind: 'expense' },
    { id: 'u3', title: 'DASK', detail: 'Zorunlu deprem sigortası', amount: 1240, dueInDays: 12, kind: 'insurance' },
    { id: 'u4', title: 'MTV 2. Taksit', detail: 'Motorlu taşıt vergisi', amount: 3600, dueInDays: 24, kind: 'tax' },
  ] as UpcomingPayment[],

  cards: [
    {
      id: 'c1',
      name: 'Bankam Bonus',
      statementAmount: 8450,
      limit: 40000,
      dueInDays: 3,
      nextInstallmentLoad: 2500,
    },
    {
      id: 'c2',
      name: 'World Card',
      statementAmount: 3120,
      limit: 25000,
      dueInDays: 9,
      nextInstallmentLoad: 0,
    },
  ] as CardDebt[],

  goals: [
    { id: 'g1', title: 'Yaz tatili', saved: 24000, target: 60000, monthsLeft: 4 },
    { id: 'g2', title: 'Yeni laptop', saved: 12500, target: 45000, monthsLeft: 6 },
  ] as Goal[],

  investments: [
    { id: 'i1', platform: 'Midas', balance: 84200, changePct: 2.4 },
    { id: 'i2', platform: 'Banka Fonu', balance: 41000, changePct: 0.8 },
    { id: 'i3', platform: 'Binance', balance: 18700, changePct: -1.6 },
  ] as InvestmentHolding[],
};

export function portfolioTotal(): number {
  return dashboard.investments.reduce((s, i) => s + i.balance, 0);
}

export function cardDebtTotal(): number {
  return dashboard.cards.reduce((s, c) => s + c.statementAmount, 0);
}
