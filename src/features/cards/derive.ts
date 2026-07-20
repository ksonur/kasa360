import type { CreditCardDraft } from '@/features/onboarding/types';
import type { CardPayment, CardStatement, InstallmentPurchase } from './types';

export function currentPeriod(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function periodLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

export function daysUntilDayOfMonth(day: number): number {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(now.getFullYear(), now.getMonth(), day);
  if (target < todayStart) {
    target = new Date(now.getFullYear(), now.getMonth() + 1, day);
  }
  return Math.round((target.getTime() - todayStart.getTime()) / 86400000);
}

export function activeStatements(list: CardStatement[]): CardStatement[] {
  return list.filter((s) => s.deletedAt == null);
}

export function activePayments(list: CardPayment[]): CardPayment[] {
  return list.filter((p) => p.deletedAt == null);
}

export function activeInstallments(list: InstallmentPurchase[]): InstallmentPurchase[] {
  return list.filter((i) => i.deletedAt == null && i.status === 'aktif');
}

export function statementForPeriod(
  statements: CardStatement[],
  creditCardId: string,
  period: string
): CardStatement | null {
  return (
    activeStatements(statements).find(
      (s) => s.creditCardId === creditCardId && s.period === period
    ) ?? null
  );
}

/** Kartın en güncel (açık) ekstre dönemi; yoksa null. */
export function openPeriodForCard(
  statements: CardStatement[],
  creditCardId: string
): string | null {
  const list = activeStatements(statements)
    .filter((s) => s.creditCardId === creditCardId)
    .slice()
    .sort((a, b) => b.period.localeCompare(a.period));
  return list[0]?.period ?? null;
}

function paymentPeriod(p: CardPayment): string {
  if (p.statementPeriod && /^\d{4}-\d{2}$/.test(p.statementPeriod)) {
    return p.statementPeriod;
  }
  return p.date.slice(0, 7);
}

/** Ödemeyi ekstre dönemine bağla (statementPeriod; eski kayıtlarda date ayı). */
export function paymentsForPeriod(
  payments: CardPayment[],
  creditCardId: string,
  period: string
): CardPayment[] {
  return activePayments(payments).filter(
    (p) => p.creditCardId === creditCardId && paymentPeriod(p) === period
  );
}

export function paidTowardPeriod(
  payments: CardPayment[],
  creditCardId: string,
  period: string
): number {
  return paymentsForPeriod(payments, creditCardId, period).reduce(
    (s, p) => s + p.amount,
    0
  );
}

/** Kalan ≈ ekstre − dönem ödemeleri (negatif olmaz). */
export function remainingForPeriod(
  statements: CardStatement[],
  payments: CardPayment[],
  creditCardId: string,
  period: string
): number {
  const st = statementForPeriod(statements, creditCardId, period);
  if (!st) return 0;
  const paid = paidTowardPeriod(payments, creditCardId, period);
  return Math.max(0, st.amount - paid);
}

export function computeMonthlyAmount(total: number, count: number): number {
  if (count <= 0) return 0;
  return Math.round(total / count);
}

/** startDate’ten itibaren kaç taksit ödendi / kaldı (basit ay sayacı). */
export function remainingInstallments(
  inst: InstallmentPurchase,
  asOf = new Date()
): number {
  if (inst.status !== 'aktif' || inst.deletedAt) return 0;
  const [y, m, d] = inst.startDate.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const monthsElapsed =
    (asOf.getFullYear() - start.getFullYear()) * 12 +
    (asOf.getMonth() - start.getMonth());
  const paid = Math.max(0, Math.min(inst.installmentCount, monthsElapsed));
  return Math.max(0, inst.installmentCount - paid);
}

function installmentsForCard(
  installments: InstallmentPurchase[],
  creditCardId: string
): InstallmentPurchase[] {
  return installments.filter(
    (i) => i.paymentMethod === 'kredi_karti' && i.creditCardId === creditCardId
  );
}

/** Gelecek N ay için taksit yükü (period → tutar). `creditCardId` verilirse yalnızca o kart. */
export function futureLoadByMonth(
  installments: InstallmentPurchase[],
  monthsAhead = 6,
  from = new Date(),
  creditCardId?: string
): Record<string, number> {
  const load: Record<string, number> = {};
  const source = creditCardId
    ? installmentsForCard(installments, creditCardId)
    : installments;
  const actives = activeInstallments(source);

  for (let i = 0; i < monthsAhead; i += 1) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const period = currentPeriod(d);
    load[period] = 0;
  }

  for (const inst of actives) {
    const rem = remainingInstallments(inst, from);
    if (rem <= 0) continue;
    const [y, m] = inst.startDate.split('-').map(Number);
    const startMonth = new Date(y, m - 1, 1);
    const paidMonths = inst.installmentCount - rem;

    for (let i = 0; i < rem; i += 1) {
      const due = new Date(
        startMonth.getFullYear(),
        startMonth.getMonth() + paidMonths + i,
        1
      );
      const period = currentPeriod(due);
      if (load[period] === undefined) continue;
      // Son taksitte yuvarlama farkını düzelt
      const isLast = i === rem - 1;
      const amount = isLast
        ? inst.totalAmount - inst.monthlyAmount * (inst.installmentCount - 1)
        : inst.monthlyAmount;
      load[period] += Math.max(0, amount);
    }
  }

  return load;
}

/** Belirli kartın gelecek ay taksit yükü. */
export function nextMonthInstallmentLoad(
  installments: InstallmentPurchase[],
  creditCardId: string
): number {
  const from = new Date();
  const next = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  const period = currentPeriod(next);
  const load = futureLoadByMonth(installments, 3, from, creditCardId);
  return load[period] ?? 0;
}

export interface CardSummary {
  card: CreditCardDraft;
  period: string;
  statementAmount: number;
  paid: number;
  remaining: number;
  dueInDays: number | null;
  nextInstallmentLoad: number;
}

export function summarizeCard(
  card: CreditCardDraft,
  statements: CardStatement[],
  payments: CardPayment[],
  installments: InstallmentPurchase[],
  period?: string
): CardSummary {
  const resolved =
    period ?? openPeriodForCard(statements, card.id) ?? currentPeriod();
  const st = statementForPeriod(statements, card.id, resolved);
  const paid = paidTowardPeriod(payments, card.id, resolved);
  const statementAmount = st?.amount ?? 0;
  return {
    card,
    period: resolved,
    statementAmount,
    paid,
    remaining: Math.max(0, statementAmount - paid),
    dueInDays: card.dueDay != null ? daysUntilDayOfMonth(card.dueDay) : null,
    nextInstallmentLoad: nextMonthInstallmentLoad(installments, card.id),
  };
}
