import type { RoutineExpenseDraft } from '@/features/onboarding/types';
import type { LocalTransaction } from '@/features/finance/types';
import { isSameMonth } from '@/features/finance/store';
import { EXPENSE_CATEGORIES } from '@/features/onboarding/categories';

function categoryLabel(categoryId: string, customLabel?: string): string {
  if (categoryId === 'diger' && customLabel?.trim()) return customLabel.trim();
  return EXPENSE_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export interface CategorySpendRow {
  categoryId: string;
  label: string;
  amount: number;
  /** transactions + rutin (planlı) */
  fromTransactions: number;
  fromRoutines: number;
}

export interface CategorySpendInsight {
  rows: CategorySpendRow[];
  total: number;
  top: CategorySpendRow | null;
  headline: string | null;
}

/**
 * Bu ay kategori bazlı harcama (manuel kategoriler).
 * Rutin giderler planlı tutar olarak eklenir; transactions gerçekleşen.
 */
export function categorySpendThisMonth(
  transactions: LocalTransaction[],
  routines: RoutineExpenseDraft[],
  ref = new Date()
): CategorySpendInsight {
  const map = new Map<
    string,
    { label: string; fromTransactions: number; fromRoutines: number }
  >();

  const bump = (
    categoryId: string,
    customLabel: string | undefined,
    amount: number,
    kind: 'tx' | 'routine'
  ) => {
    const key =
      categoryId === 'diger' && customLabel?.trim()
        ? `diger:${customLabel.trim()}`
        : categoryId;
    const label = categoryLabel(categoryId, customLabel);
    const cur = map.get(key) ?? {
      label,
      fromTransactions: 0,
      fromRoutines: 0,
    };
    if (kind === 'tx') cur.fromTransactions += amount;
    else cur.fromRoutines += amount;
    map.set(key, cur);
  };

  for (const t of transactions) {
    if (t.deletedAt != null || !isSameMonth(t.date, ref)) continue;
    bump(t.categoryId, t.customLabel, t.amount, 'tx');
  }

  for (const e of routines) {
    if (e.amount <= 0) continue;
    bump(e.categoryId, e.customLabel, e.amount, 'routine');
  }

  const rows: CategorySpendRow[] = [...map.entries()]
    .map(([categoryId, v]) => ({
      categoryId,
      label: v.label,
      amount: v.fromTransactions + v.fromRoutines,
      fromTransactions: v.fromTransactions,
      fromRoutines: v.fromRoutines,
    }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const top = rows[0] ?? null;

  let headline: string | null = null;
  if (top && total > 0) {
    const share = Math.round((top.amount / total) * 100);
    if (share >= 25 || rows.length === 1) {
      headline = `Bu ay ${top.label.toLocaleLowerCase('tr-TR')} için çok harcadın (%${share}).`;
    } else {
      headline = `Bu ay en yüksek harcama: ${top.label}.`;
    }
  }

  return { rows, total, top, headline };
}
