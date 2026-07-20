export type GoalUnit = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'ALTIN';

export interface GoalUnitMeta {
  id: GoalUnit;
  label: string;
  /** Kısa etiket (liste) */
  shortLabel: string;
  /** Miktar birimi (gram / para) */
  amountLabel: string;
}

export const GOAL_UNITS: GoalUnitMeta[] = [
  { id: 'TRY', label: 'Türk Lirası', shortLabel: '₺', amountLabel: 'Tutar (₺)' },
  { id: 'USD', label: 'ABD Doları', shortLabel: '$', amountLabel: 'Tutar ($)' },
  { id: 'EUR', label: 'Euro', shortLabel: '€', amountLabel: 'Tutar (€)' },
  { id: 'GBP', label: 'Sterlin', shortLabel: '£', amountLabel: 'Tutar (£)' },
  { id: 'ALTIN', label: 'Altın', shortLabel: 'Au', amountLabel: 'Miktar (gram)' },
];

export function isGoalUnit(value: unknown): value is GoalUnit {
  return (
    value === 'TRY' ||
    value === 'USD' ||
    value === 'EUR' ||
    value === 'GBP' ||
    value === 'ALTIN'
  );
}

export function goalUnitMeta(unit: GoalUnit): GoalUnitMeta {
  return GOAL_UNITS.find((u) => u.id === unit) ?? GOAL_UNITS[0];
}

/** Birime göre biçimlendirme — tutarlar tam sayı; altın gram. */
export function formatGoalAmount(amount: number, unit: GoalUnit = 'TRY'): string {
  const n = Math.round(Number.isFinite(amount) ? amount : 0);
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

  switch (unit) {
    case 'USD':
      return `$${formatted}`;
    case 'EUR':
      return `€${formatted}`;
    case 'GBP':
      return `£${formatted}`;
    case 'ALTIN':
      return `${formatted} gr`;
    case 'TRY':
    default:
      return `₺${formatted}`;
  }
}
