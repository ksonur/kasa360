import type { CreditCardDraft } from '@/features/onboarding/types';
import type { LocalTransaction } from '@/features/finance/types';
import type { CardPayment, CardStatement } from '@/features/cards/types';
import {
  currentPeriod,
  daysUntilDayOfMonth,
  openPeriodForCard,
  remainingForPeriod,
} from '@/features/cards/derive';
import type { Asset, AssetObligation } from '@/features/assets/types';
import {
  assetTypeLabel,
  daysUntilISO,
  nextDueDate,
  obligationTitle,
  OBLIGATION_KIND_META,
  activeAssets,
  activeObligations,
} from '@/features/assets';
import { EXPENSE_CATEGORIES } from '@/features/onboarding/categories';
import type { ReminderSource } from './types';

function categoryLabel(categoryId: string, customLabel?: string): string {
  if (categoryId === 'diger' && customLabel?.trim()) return customLabel.trim();
  return EXPENSE_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** dueDay → bir sonraki vade YYYY-MM-DD. */
export function dueDateFromDayOfMonth(day: number, from = new Date()): string {
  const todayStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let target = new Date(from.getFullYear(), from.getMonth(), day);
  // Kısa aylarda gün taşmasını düzelt
  if (target.getMonth() !== from.getMonth() % 12 && target.getDate() !== day) {
    target = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  }
  if (target < todayStart) {
    target = new Date(from.getFullYear(), from.getMonth() + 1, day);
    if (target.getDate() !== day) {
      target = new Date(from.getFullYear(), from.getMonth() + 2, 0);
    }
  }
  return toISODate(target);
}

export interface CollectSourcesInput {
  cards: CreditCardDraft[];
  statements: CardStatement[];
  payments: CardPayment[];
  transactions: LocalTransaction[];
  assets: Asset[];
  obligations: AssetObligation[];
  /** Kaç gün ufuk (7g offset için ≥ 7+biraz). */
  withinDays?: number;
  now?: Date;
}

/**
 * Bildirim kaynaklarını toplar (kart, tek seferlik, varlık yükümlülüğü).
 * Rutin gider S8 kapsamında değil.
 */
export function collectReminderSources(input: CollectSourcesInput): ReminderSource[] {
  const {
    cards,
    statements,
    payments,
    transactions,
    assets,
    obligations,
    withinDays = 45,
    now = new Date(),
  } = input;
  const period = currentPeriod(now);
  const sources: ReminderSource[] = [];

  for (const c of cards) {
    if (c.dueDay == null) continue;
    const dueIn = daysUntilDayOfMonth(c.dueDay);
    if (dueIn < 0 || dueIn > withinDays) continue;
    const cardPeriod = openPeriodForCard(statements, c.id) ?? period;
    const amount = remainingForPeriod(statements, payments, c.id, cardPeriod);
    const name = c.name.trim() || 'Kredi kartı';
    sources.push({
      sourceId: `card-${c.id}`,
      kind: 'card',
      dueDate: dueDateFromDayOfMonth(c.dueDay, now),
      title: name,
      body: amount > 0 ? `Son ödeme · ₺${amount}` : 'Kredi kartı son ödeme',
      amount,
    });
  }

  for (const t of transactions) {
    if (t.deletedAt != null) continue;
    const dueIn = daysUntilISO(t.date, now);
    if (dueIn < 0 || dueIn > withinDays) continue;
    const title = categoryLabel(t.categoryId, t.customLabel);
    sources.push({
      sourceId: `tx-${t.id}`,
      kind: 'expense',
      dueDate: t.date,
      title,
      body: `Tek seferlik gider · ₺${t.amount}`,
      amount: t.amount,
    });
  }

  const byId = new Map(activeAssets(assets).map((a) => [a.id, a]));
  for (const o of activeObligations(obligations)) {
    const asset = byId.get(o.assetId);
    if (!asset) continue;
    const due = nextDueDate(o, now);
    if (!due) continue;
    const dueIn = daysUntilISO(due, now);
    if (dueIn < 0 || dueIn > withinDays) continue;
    const meta = OBLIGATION_KIND_META[o.kind];
    const name = asset.name.trim() || assetTypeLabel(asset.type);
    sources.push({
      sourceId: `asset-ob-${o.id}`,
      kind: meta.upcomingKind,
      dueDate: due,
      title: obligationTitle(o, name),
      body: meta.detail,
      amount: o.amount != null && o.amount > 0 ? o.amount : 0,
    });
  }

  return sources;
}
