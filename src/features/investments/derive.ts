import type { InvestmentDraft } from '@/features/onboarding/types';
import type { InvestmentBalanceSnapshot, InvestmentMovement } from './types';

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

export function shiftPeriod(period: string, deltaMonths: number): string {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 + deltaMonths, 1);
  return currentPeriod(d);
}

export function activeMovements(list: InvestmentMovement[]): InvestmentMovement[] {
  return list.filter((m) => m.deletedAt == null);
}

export function activeSnapshots(
  list: InvestmentBalanceSnapshot[]
): InvestmentBalanceSnapshot[] {
  return list.filter((s) => s.deletedAt == null);
}

export function movementsForPlatform(
  movements: InvestmentMovement[],
  platformId: string
): InvestmentMovement[] {
  return activeMovements(movements)
    .filter((m) => m.platformId === platformId)
    .slice()
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export function snapshotForPeriod(
  snapshots: InvestmentBalanceSnapshot[],
  platformId: string,
  period: string
): InvestmentBalanceSnapshot | null {
  return (
    activeSnapshots(snapshots).find(
      (s) => s.platformId === platformId && s.period === period
    ) ?? null
  );
}

/** En güncel dönem snapshot’ı (period desc). */
export function latestSnapshot(
  snapshots: InvestmentBalanceSnapshot[],
  platformId: string
): InvestmentBalanceSnapshot | null {
  const list = activeSnapshots(snapshots)
    .filter((s) => s.platformId === platformId)
    .slice()
    .sort((a, b) => b.period.localeCompare(a.period));
  return list[0] ?? null;
}

export function snapshotsForPlatform(
  snapshots: InvestmentBalanceSnapshot[],
  platformId: string
): InvestmentBalanceSnapshot[] {
  return activeSnapshots(snapshots)
    .filter((s) => s.platformId === platformId)
    .slice()
    .sort((a, b) => b.period.localeCompare(a.period));
}

export interface ChartPoint {
  period: string;
  label: string;
  balance: number;
  /** Önceki aya göre %; ilk nokta null */
  momPct: number | null;
}

/** Grafik için kronolojik aylık seri (eski → yeni); % nakit akışı ayıklı. */
export function chartSeriesForPlatform(
  snapshots: InvestmentBalanceSnapshot[],
  platformId: string,
  movements: InvestmentMovement[] = []
): ChartPoint[] {
  const ordered = snapshotsForPlatform(snapshots, platformId)
    .slice()
    .sort((a, b) => a.period.localeCompare(b.period));

  return ordered.map((s, i) => {
    const prev = i > 0 ? ordered[i - 1] : null;
    const net = prev
      ? netCashFlowBetweenPeriods(movements, platformId, prev.period, s.period)
      : 0;
    return {
      period: s.period,
      label: shortPeriodLabel(s.period),
      balance: s.balance,
      momPct: performancePct(s.balance, prev?.balance, net),
    };
  });
}

/** Tüm platformların aynı dönemde toplanmış bakiyesi. */
export function chartSeriesPortfolio(
  snapshots: InvestmentBalanceSnapshot[],
  platformIds: string[],
  movements: InvestmentMovement[] = []
): ChartPoint[] {
  const idSet = new Set(platformIds);
  const byPeriod = new Map<string, number>();
  for (const s of activeSnapshots(snapshots)) {
    if (!idSet.has(s.platformId)) continue;
    byPeriod.set(s.period, (byPeriod.get(s.period) ?? 0) + s.balance);
  }
  const periods = [...byPeriod.keys()].sort((a, b) => a.localeCompare(b));
  return periods.map((period, i) => {
    const balance = byPeriod.get(period) ?? 0;
    const prevPeriod = i > 0 ? periods[i - 1] : null;
    const prevBal = prevPeriod != null ? (byPeriod.get(prevPeriod) ?? 0) : null;
    let net = 0;
    if (prevPeriod != null) {
      for (const pid of platformIds) {
        net += netCashFlowBetweenPeriods(movements, pid, prevPeriod, period);
      }
    }
    return {
      period,
      label: shortPeriodLabel(period),
      balance,
      momPct: performancePct(balance, prevBal, net),
    };
  });
}

function shortPeriodLabel(period: string): string {
  const [y, m] = period.split('-');
  const months = [
    'Oca',
    'Şub',
    'Mar',
    'Nis',
    'May',
    'Haz',
    'Tem',
    'Ağu',
    'Eyl',
    'Eki',
    'Kas',
    'Ara',
  ];
  const mi = Number(m) - 1;
  return `${months[mi] ?? m}’${String(y).slice(2)}`;
}

/** opening (onboarding) + yatırma − çekme */
export function derivedBalance(
  openingBalance: number,
  movements: InvestmentMovement[],
  platformId: string
): number {
  const net = movementsForPlatform(movements, platformId).reduce((sum, m) => {
    const amt = Math.round(m.amount);
    return m.type === 'yatirma' ? sum + amt : sum - amt;
  }, 0);
  return Math.round(openingBalance) + net;
}

/**
 * Görünen bakiye: bu ay snapshot → yoksa en son snapshot → yoksa hareket derived.
 */
export function displayBalance(
  openingBalance: number,
  movements: InvestmentMovement[],
  snapshots: InvestmentBalanceSnapshot[],
  platformId: string,
  period = currentPeriod()
): number {
  const current = snapshotForPeriod(snapshots, platformId, period);
  if (current) return current.balance;
  const latest = latestSnapshot(snapshots, platformId);
  if (latest) return latest.balance;
  return derivedBalance(openingBalance, movements, platformId);
}

/**
 * Ham bakiye farkı yüzdesi — nakit akışı ayıklanmamış.
 * Tercihen `performancePct` kullan (yatırma/çekme getiri değildir).
 */
export function returnPct(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  return performancePct(current, previous, 0);
}

/**
 * Performans getirisi: (bitiş − başlangıç − netNakit) / başlangıç × 100.
 * netNakit = yatırma − çekme. Araç almak için çekim “zarar” sayılmaz.
 */
export function performancePct(
  current: number | null | undefined,
  previous: number | null | undefined,
  netCashFlow = 0
): number | null {
  if (current == null || previous == null || previous <= 0) return null;
  const gain = current - previous - netCashFlow;
  return Math.round((gain / previous) * 100);
}

/** Dönem içi net nakit: yatırma − çekme (date YYYY-MM ile period eşleşir). */
export function netCashFlowInPeriod(
  movements: InvestmentMovement[],
  platformId: string,
  period: string
): number {
  return movementsForPlatform(movements, platformId).reduce((sum, m) => {
    if (!m.date.startsWith(period)) return sum;
    const amt = Math.round(m.amount);
    return m.type === 'yatirma' ? sum + amt : sum - amt;
  }, 0);
}

/** (fromPeriod, toPeriod] aralığındaki ayların net nakiti (from hariç, to dahil). */
export function netCashFlowBetweenPeriods(
  movements: InvestmentMovement[],
  platformId: string,
  fromPeriod: string,
  toPeriod: string
): number {
  if (toPeriod <= fromPeriod) return 0;
  let sum = 0;
  let cursor = shiftPeriod(fromPeriod, 1);
  // Güvenlik: en fazla 120 ay
  for (let i = 0; i < 120 && cursor <= toPeriod; i += 1) {
    sum += netCashFlowInPeriod(movements, platformId, cursor);
    if (cursor === toPeriod) break;
    cursor = shiftPeriod(cursor, 1);
  }
  return sum;
}

export function monthOverMonthPct(
  snapshots: InvestmentBalanceSnapshot[],
  platformId: string,
  period = currentPeriod(),
  movements: InvestmentMovement[] = []
): number | null {
  const cur = snapshotForPeriod(snapshots, platformId, period);
  const prev = snapshotForPeriod(snapshots, platformId, shiftPeriod(period, -1));
  const net = netCashFlowInPeriod(movements, platformId, period);
  return performancePct(cur?.balance, prev?.balance, net);
}

export function yearOverYearPct(
  snapshots: InvestmentBalanceSnapshot[],
  platformId: string,
  period = currentPeriod(),
  movements: InvestmentMovement[] = []
): number | null {
  const cur = snapshotForPeriod(snapshots, platformId, period);
  const prevYearPeriod = shiftPeriod(period, -12);
  const prevYear = snapshotForPeriod(snapshots, platformId, prevYearPeriod);
  const net = netCashFlowBetweenPeriods(
    movements,
    platformId,
    prevYearPeriod,
    period
  );
  return performancePct(cur?.balance, prevYear?.balance, net);
}

export function portfolioTotal(
  platforms: InvestmentDraft[],
  movements: InvestmentMovement[],
  snapshots: InvestmentBalanceSnapshot[] = []
): number {
  return platforms.reduce(
    (s, p) => s + displayBalance(p.balance, movements, snapshots, p.id),
    0
  );
}

/** 0–100 tam sayı pay; toplam 0 ise 0. */
export function platformSharePct(balance: number, total: number): number {
  if (total <= 0 || balance <= 0) return 0;
  return Math.round((balance / total) * 100);
}

export function formatReturnPct(pct: number | null): string {
  if (pct == null) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

export interface PlatformSummary {
  platform: InvestmentDraft;
  balance: number;
  sharePct: number;
  momPct: number | null;
  yoyPct: number | null;
  hasCurrentSnapshot: boolean;
}

export function summarizePlatforms(
  platforms: InvestmentDraft[],
  movements: InvestmentMovement[],
  snapshots: InvestmentBalanceSnapshot[] = [],
  period = currentPeriod()
): PlatformSummary[] {
  const total = portfolioTotal(platforms, movements, snapshots);
  return platforms.map((p) => {
    const balance = displayBalance(p.balance, movements, snapshots, p.id, period);
    return {
      platform: p,
      balance,
      sharePct: platformSharePct(balance, total),
      momPct: monthOverMonthPct(snapshots, p.id, period, movements),
      yoyPct: yearOverYearPct(snapshots, p.id, period, movements),
      hasCurrentSnapshot: !!snapshotForPeriod(snapshots, p.id, period),
    };
  });
}
