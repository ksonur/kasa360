import type { CreditCardDraft, RoutineExpenseDraft } from '@/features/onboarding/types';
import type { LocalTransaction } from '@/features/finance/types';
import type { CardPayment, CardStatement } from '@/features/cards/types';
import {
  remainingForPeriod,
  currentPeriod,
  openPeriodForCard,
} from '@/features/cards/derive';
import { EXPENSE_CATEGORIES } from '@/features/onboarding/categories';
import type { Asset, AssetObligation } from '@/features/assets/types';
import { obligationsInPeriod } from '@/features/assets/derive';

function categoryLabel(categoryId: string, customLabel?: string): string {
  if (categoryId === 'diger' && customLabel?.trim()) return customLabel.trim();
  return EXPENSE_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export interface CashflowDayItem {
  id: string;
  title: string;
  amount: number;
  kind: 'routine' | 'expense' | 'card' | 'tax' | 'insurance';
}

export interface CashflowDay {
  day: number;
  /** YYYY-MM-DD */
  date: string;
  total: number;
  items: CashflowDayItem[];
}

export interface CashflowMonth {
  period: string;
  daysInMonth: number;
  days: CashflowDay[];
  maxDayTotal: number;
  monthTotal: number;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Ay içi nakit yükü: rutin dueDay, tek seferlik tarih, kart son ödeme + kalan.
 */
export function buildCashflowMonth(
  routines: RoutineExpenseDraft[],
  transactions: LocalTransaction[],
  cards: CreditCardDraft[],
  statements: CardStatement[],
  payments: CardPayment[],
  assets: Asset[] = [],
  obligations: AssetObligation[] = [],
  ref = new Date()
): CashflowMonth {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const period = currentPeriod(ref);
  const dim = daysInMonth(y, m);

  const days: CashflowDay[] = [];
  for (let d = 1; d <= dim; d += 1) {
    const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, date, total: 0, items: [] });
  }

  const byDay = (day: number) => days[Math.min(Math.max(day, 1), dim) - 1];

  for (const e of routines) {
    if (e.dueDay == null || e.amount <= 0) continue;
    const cell = byDay(e.dueDay);
    cell.items.push({
      id: `r-${e.categoryId}`,
      title: categoryLabel(e.categoryId, e.customLabel),
      amount: e.amount,
      kind: 'routine',
    });
    cell.total += e.amount;
  }

  for (const t of transactions) {
    if (t.deletedAt != null) continue;
    if (!t.date.startsWith(period)) continue;
    const day = Number(t.date.slice(8, 10));
    if (!Number.isFinite(day)) continue;
    const cell = byDay(day);
    cell.items.push({
      id: `t-${t.id}`,
      title: categoryLabel(t.categoryId, t.customLabel),
      amount: t.amount,
      kind: 'expense',
    });
    cell.total += t.amount;
  }

  for (const c of cards) {
    if (c.dueDay == null) continue;
    const cardPeriod = openPeriodForCard(statements, c.id) ?? period;
    const remain = remainingForPeriod(statements, payments, c.id, cardPeriod);
    if (remain <= 0) continue;
    const cell = byDay(c.dueDay);
    cell.items.push({
      id: `c-${c.id}`,
      title: c.name.trim() || 'Kredi kartı',
      amount: remain,
      kind: 'card',
    });
    cell.total += remain;
  }

  for (const ao of obligationsInPeriod(assets, obligations, period)) {
    const cell = byDay(ao.day);
    cell.items.push({
      id: ao.id,
      title: ao.title,
      amount: ao.amount,
      kind: ao.kind,
    });
    cell.total += ao.amount;
  }

  const maxDayTotal = days.reduce((mx, d) => Math.max(mx, d.total), 0);
  const monthTotal = days.reduce((s, d) => s + d.total, 0);

  return { period, daysInMonth: dim, days, maxDayTotal, monthTotal };
}

/** 0–1 yoğunluk (heatmap). */
export function dayIntensity(dayTotal: number, maxDayTotal: number): number {
  if (maxDayTotal <= 0 || dayTotal <= 0) return 0;
  return Math.min(1, dayTotal / maxDayTotal);
}
