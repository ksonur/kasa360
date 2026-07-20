import type { RoutineExpenseDraft } from '@/features/onboarding/types';
import type { LocalTransaction } from '@/features/finance/types';
import { categorySpendThisMonth } from '@/features/insights/categorySpend';

export interface CategoryTrendRow {
  categoryId: string;
  label: string;
  currentAmount: number;
  previousAmount: number;
  /** current − previous */
  delta: number;
  /** Tam sayı %; previous 0 ise null */
  deltaPct: number | null;
}

export interface CategoryTrendReport {
  currentPeriod: string;
  previousPeriod: string;
  rows: CategoryTrendRow[];
  headline: string | null;
  currentTotal: number;
  previousTotal: number;
}

function periodOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function shiftMonth(ref: Date, delta: number): Date {
  return new Date(ref.getFullYear(), ref.getMonth() + delta, 1);
}

/**
 * Bu ay vs geçen ay kategori harcaması (categorySpend ile aynı kurallar).
 */
export function categoryTrendMoM(
  transactions: LocalTransaction[],
  routines: RoutineExpenseDraft[],
  ref = new Date()
): CategoryTrendReport {
  const prevRef = shiftMonth(ref, -1);
  const current = categorySpendThisMonth(transactions, routines, ref);
  const previous = categorySpendThisMonth(transactions, routines, prevRef);

  const ids = new Set([
    ...current.rows.map((r) => r.categoryId),
    ...previous.rows.map((r) => r.categoryId),
  ]);

  const prevMap = new Map(previous.rows.map((r) => [r.categoryId, r]));
  const curMap = new Map(current.rows.map((r) => [r.categoryId, r]));

  const rows: CategoryTrendRow[] = [...ids]
    .map((categoryId) => {
      const cur = curMap.get(categoryId);
      const prev = prevMap.get(categoryId);
      const currentAmount = cur?.amount ?? 0;
      const previousAmount = prev?.amount ?? 0;
      const delta = currentAmount - previousAmount;
      const deltaPct =
        previousAmount > 0
          ? Math.round((delta / previousAmount) * 100)
          : currentAmount > 0
            ? null
            : 0;
      return {
        categoryId,
        label: cur?.label ?? prev?.label ?? categoryId,
        currentAmount,
        previousAmount,
        delta,
        deltaPct,
      };
    })
    .filter((r) => r.currentAmount > 0 || r.previousAmount > 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  let headline: string | null = null;
  const biggestUp = rows.find((r) => r.delta > 0 && r.previousAmount > 0);
  if (biggestUp && (biggestUp.deltaPct ?? 0) >= 15) {
    headline = `Geçen aya göre ${biggestUp.label.toLocaleLowerCase('tr-TR')} %${biggestUp.deltaPct} arttı.`;
  } else if (biggestUp && biggestUp.delta > 0) {
    headline = `Geçen aya göre en çok artan: ${biggestUp.label}.`;
  } else if (current.headline) {
    headline = current.headline;
  }

  return {
    currentPeriod: periodOf(ref),
    previousPeriod: periodOf(prevRef),
    rows,
    headline,
    currentTotal: current.total,
    previousTotal: previous.total,
  };
}
