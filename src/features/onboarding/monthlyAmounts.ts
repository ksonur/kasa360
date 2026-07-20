/** Ay anahtarı: YYYY-MM — maaş ve mesai için ortak yardımcılar. */
export type MonthKey = string;

const MONTH_LABELS_TR = [
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
];

export function monthKey(d = new Date()): MonthKey {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function yearOfKey(key: MonthKey): number {
  return Number(key.slice(0, 4));
}

export function monthIndexOfKey(key: MonthKey): number {
  return Number(key.slice(5, 7)) - 1;
}

export function monthLabelTr(key: MonthKey): string {
  return MONTH_LABELS_TR[monthIndexOfKey(key)] ?? key;
}

export function keysForYear(year: number): MonthKey[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return `${year}-${m}`;
  });
}

export function isYearSeeded(
  byMonth: Record<string, number> | undefined,
  year: number
): boolean {
  if (!byMonth) return false;
  return keysForYear(year).some((k) => byMonth[k] !== undefined);
}

export function seedYearAmount(amount: number, year: number): Record<string, number> {
  const value = Math.round(amount);
  const next: Record<string, number> = {};
  for (const k of keysForYear(year)) {
    next[k] = value;
  }
  return next;
}

export function getAmountForMonth(
  byMonth: Record<string, number> | undefined,
  key: MonthKey = monthKey()
): number {
  if (!byMonth) return 0;
  const v = byMonth[key];
  return typeof v === 'number' ? v : 0;
}

/** Legacy tek alan veya mevcut map → ay map. */
export function migrateToByMonth(
  existing: Record<string, number> | undefined,
  legacy: number | undefined,
  opts?: { seedZero?: boolean; fallback?: number }
): Record<string, number> {
  if (existing && Object.keys(existing).length > 0) {
    return { ...existing };
  }
  const value =
    typeof legacy === 'number'
      ? legacy
      : opts?.fallback !== undefined
        ? opts.fallback
        : 0;
  if (value > 0 || opts?.seedZero) {
    return seedYearAmount(value, new Date().getFullYear());
  }
  return {};
}

// --- Geriye dönük alias (eski importlar) ---
export const seedYearOvertime = seedYearAmount;
export const getOvertimeForMonth = getAmountForMonth;
export function migrateOvertimeFields(raw: {
  overtime?: number;
  overtimeByMonth?: Record<string, number>;
}): Record<string, number> {
  return migrateToByMonth(raw.overtimeByMonth, raw.overtime);
}

export function migrateSalaryFields(raw: {
  salary?: number;
  salaryByMonth?: Record<string, number>;
}): Record<string, number> {
  return migrateToByMonth(raw.salaryByMonth, raw.salary, { fallback: 45000 });
}
