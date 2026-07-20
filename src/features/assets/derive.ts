import type { UpcomingPayment } from '@/features/dashboard/mockData';
import {
  assetTypeLabel,
  daysUntilISO,
  formatMonthDay,
  nextAnnualDue,
  nextMonthDayDue,
  OBLIGATION_KIND_META,
} from './defaults';
import type { Asset, AssetObligation, AssetType } from './types';

export function activeAssets(assets: Asset[]): Asset[] {
  return assets.filter((a) => a.deletedAt == null);
}

export function activeObligations(
  obligations: AssetObligation[]
): AssetObligation[] {
  return obligations.filter((o) => o.deletedAt == null);
}

export function obligationsForAsset(
  obligations: AssetObligation[],
  assetId: string
): AssetObligation[] {
  return activeObligations(obligations).filter((o) => o.assetId === assetId);
}

/** Yükümlülüğün sonraki vade tarihi (YYYY-MM-DD) veya null. */
export function nextDueDate(
  o: AssetObligation,
  from = new Date()
): string | null {
  if (o.startDate) {
    return nextAnnualDue(o.startDate, from);
  }
  if (o.month != null && o.day != null) {
    return nextMonthDayDue(o.month, o.day, from);
  }
  return null;
}

export function obligationTitle(
  o: AssetObligation,
  assetName: string
): string {
  const meta = OBLIGATION_KIND_META[o.kind];
  const base = meta.label;
  if (o.kind === 'mtv' && o.month != null) {
    return `${assetName} · MTV (${formatMonthDay(o.month, o.day ?? 31)})`;
  }
  if (o.kind === 'emlak_vergisi' && o.month != null) {
    return `${assetName} · Emlak (${formatMonthDay(o.month, o.day ?? 1)})`;
  }
  return `${assetName} · ${base}`;
}

export interface AssetSummary {
  asset: Asset;
  nextDue: string | null;
  nextDueInDays: number | null;
  nextKindLabel: string | null;
  obligationCount: number;
}

export function summarizeAsset(
  asset: Asset,
  obligations: AssetObligation[],
  from = new Date()
): AssetSummary {
  const obs = obligationsForAsset(obligations, asset.id);
  let best: { due: string; days: number; kindLabel: string } | null = null;
  for (const o of obs) {
    const due = nextDueDate(o, from);
    if (!due) continue;
    const days = daysUntilISO(due, from);
    if (best == null || days < best.days) {
      best = {
        due,
        days,
        kindLabel: OBLIGATION_KIND_META[o.kind].label,
      };
    }
  }
  return {
    asset,
    nextDue: best?.due ?? null,
    nextDueInDays: best?.days ?? null,
    nextKindLabel: best?.kindLabel ?? null,
    obligationCount: obs.length,
  };
}

export function summarizeActiveAssets(
  assets: Asset[],
  obligations: AssetObligation[],
  from = new Date()
): AssetSummary[] {
  return activeAssets(assets)
    .map((a) => summarizeAsset(a, obligations, from))
    .sort((a, b) => {
      const da = a.nextDueInDays ?? 9999;
      const db = b.nextDueInDays ?? 9999;
      return da - db;
    });
}

export interface DashboardAssetRow {
  id: string;
  name: string;
  type: AssetType;
  typeLabel: string;
  estimatedValue: number;
  nextDueInDays: number | null;
  nextKindLabel: string | null;
}

export function toDashboardAssets(
  assets: Asset[],
  obligations: AssetObligation[]
): DashboardAssetRow[] {
  return summarizeActiveAssets(assets, obligations).map((s) => ({
    id: s.asset.id,
    name: s.asset.name.trim() || assetTypeLabel(s.asset.type),
    type: s.asset.type,
    typeLabel: assetTypeLabel(s.asset.type),
    estimatedValue: s.asset.estimatedValue,
    nextDueInDays: s.nextDueInDays,
    nextKindLabel: s.nextKindLabel,
  }));
}

/**
 * 0–31 gün içindeki varlık yükümlülüklerini upcoming listesine çevirir.
 */
export function toUpcomingPayments(
  assets: Asset[],
  obligations: AssetObligation[],
  from = new Date(),
  withinDays = 31
): UpcomingPayment[] {
  const byId = new Map(activeAssets(assets).map((a) => [a.id, a]));
  const rows: UpcomingPayment[] = [];

  for (const o of activeObligations(obligations)) {
    const asset = byId.get(o.assetId);
    if (!asset) continue;
    const due = nextDueDate(o, from);
    if (!due) continue;
    const dueInDays = daysUntilISO(due, from);
    if (dueInDays < 0 || dueInDays > withinDays) continue;
    const meta = OBLIGATION_KIND_META[o.kind];
    const name = asset.name.trim() || assetTypeLabel(asset.type);
    rows.push({
      id: `asset-ob-${o.id}`,
      title: obligationTitle(o, name),
      detail: meta.detail,
      amount: o.amount != null && o.amount > 0 ? o.amount : 0,
      dueInDays,
      kind: meta.upcomingKind,
    });
  }

  rows.sort((a, b) => a.dueInDays - b.dueInDays);
  return rows;
}

/** Belirli ayda (YYYY-MM) düşen yükümlülükler — cashflow için. */
export function obligationsInPeriod(
  assets: Asset[],
  obligations: AssetObligation[],
  period: string
): { day: number; id: string; title: string; amount: number; kind: 'tax' | 'insurance' }[] {
  const [yStr, mStr] = period.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return [];

  const byId = new Map(activeAssets(assets).map((a) => [a.id, a]));
  const out: {
    day: number;
    id: string;
    title: string;
    amount: number;
    kind: 'tax' | 'insurance';
  }[] = [];

  // Ay içindeki her gün için nextDue o aya düşüyor mu diye bakmak yerine
  // doğrudan ay+gün veya startDate yıldönümü bu aya düşüyorsa ekle.
  for (const o of activeObligations(obligations)) {
    const asset = byId.get(o.assetId);
    if (!asset) continue;
    const name = asset.name.trim() || assetTypeLabel(asset.type);
    const meta = OBLIGATION_KIND_META[o.kind];

    let day: number | null = null;
    if (o.startDate && /^\d{4}-\d{2}-\d{2}$/.test(o.startDate)) {
      const sm = Number(o.startDate.slice(5, 7));
      const sd = Number(o.startDate.slice(8, 10));
      if (sm === m) day = sd;
    } else if (o.month != null && o.day != null && o.month === m) {
      day = o.day;
    }

    if (day == null) continue;
    const dim = new Date(y, m, 0).getDate();
    const clamped = Math.min(day, dim);
    out.push({
      day: clamped,
      id: `ao-${o.id}`,
      title: obligationTitle(o, name),
      amount: o.amount != null && o.amount > 0 ? o.amount : 0,
      kind: meta.upcomingKind,
    });
  }

  return out;
}
