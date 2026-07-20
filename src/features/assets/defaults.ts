import type { AssetType, ObligationKind } from './types';

export const ASSET_TYPES: {
  id: AssetType;
  label: string;
}[] = [
  { id: 'ev', label: 'Ev' },
  { id: 'arsa', label: 'Arsa' },
  { id: 'arac', label: 'Araç' },
];

export const OBLIGATION_KIND_META: Record<
  ObligationKind,
  { label: string; upcomingKind: 'tax' | 'insurance'; detail: string }
> = {
  emlak_vergisi: {
    label: 'Emlak vergisi',
    upcomingKind: 'tax',
    detail: 'Emlak vergisi dönemi',
  },
  dask: {
    label: 'DASK',
    upcomingKind: 'insurance',
    detail: 'Zorunlu deprem sigortası',
  },
  konut_sigortasi: {
    label: 'Konut sigortası',
    upcomingKind: 'insurance',
    detail: 'Konut sigortası yenileme',
  },
  mtv: {
    label: 'MTV',
    upcomingKind: 'tax',
    detail: 'Motorlu taşıt vergisi',
  },
  trafik: {
    label: 'Trafik sigortası',
    upcomingKind: 'insurance',
    detail: 'Trafik sigortası yenileme',
  },
  kasko: {
    label: 'Kasko',
    upcomingKind: 'insurance',
    detail: 'Kasko yenileme',
  },
};

export function isAssetType(v: string): v is AssetType {
  return v === 'ev' || v === 'arsa' || v === 'arac';
}

export function isObligationKind(v: string): v is ObligationKind {
  return v in OBLIGATION_KIND_META;
}

export function assetTypeLabel(type: AssetType): string {
  return ASSET_TYPES.find((t) => t.id === type)?.label ?? type;
}

/** Varlık tipine göre oluşturulacak varsayılan yükümlülük şablonları. */
export interface ObligationSeed {
  kind: ObligationKind;
  month: number | null;
  day: number | null;
  startDate: string | null;
}

/**
 * MTV: Ocak/Temmuz (gün 31).
 * Emlak: Mayıs/Kasım (yaygın TR takvimi).
 * Sigortalar: wizard'da startDate ile eklenir (burada boş seed yok).
 */
export function defaultObligationSeeds(type: AssetType): ObligationSeed[] {
  if (type === 'arac') {
    return [
      { kind: 'mtv', month: 1, day: 31, startDate: null },
      { kind: 'mtv', month: 7, day: 31, startDate: null },
    ];
  }
  // ev / arsa
  return [
    { kind: 'emlak_vergisi', month: 5, day: 31, startDate: null },
    { kind: 'emlak_vergisi', month: 11, day: 30, startDate: null },
  ];
}

export function clampDayInMonth(
  year: number,
  month: number,
  day: number
): number {
  const dim = new Date(year, month, 0).getDate();
  return Math.min(Math.max(1, day), dim);
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Bugünden itibaren (dahil) sonraki ay+gün vadesi. */
export function nextMonthDayDue(
  month: number,
  day: number,
  from = new Date()
): string {
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  const dThis = clampDayInMonth(y, month, day);
  const candidate = new Date(y, month - 1, dThis);
  candidate.setHours(0, 0, 0, 0);
  if (candidate.getTime() >= today.getTime()) {
    return toISO(y, month, dThis);
  }
  const nextY = y + 1;
  const dNext = clampDayInMonth(nextY, month, day);
  return toISO(nextY, month, dNext);
}

/** Yıllık: startDate yıldönümü, bugün veya sonrası. */
export function nextAnnualDue(startDate: string, from = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;
  const [, sm, sd] = startDate.split('-').map(Number);
  if (!sm || !sd) return null;
  return nextMonthDayDue(sm, sd, from);
}

export function daysUntilISO(dateStr: string, from = new Date()): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const todayStart = new Date(from);
  todayStart.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - todayStart.getTime()) / 86400000);
}

export const MONTH_NAMES_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

export function formatMonthDay(month: number, day: number): string {
  const name = MONTH_NAMES_TR[month - 1] ?? String(month);
  return `${day} ${name}`;
}
