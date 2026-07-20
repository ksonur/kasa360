import type { Goal } from '@/features/goals/types';
import type { UserLocalProfile } from './types';

export type MotivationKind =
  | 'welcome'
  | 'goal_completed'
  | 'goal_progress'
  | 'payment_streak';

export interface MotivationMessage {
  id: string;
  kind: MotivationKind;
  text: string;
}

function firstName(profile: UserLocalProfile, fallback: string): string {
  const n = profile.name.trim();
  if (!n) return fallback;
  return n.split(/\s+/)[0] ?? n;
}

/**
 * Motivasyon / tebrik satırları — isim ile kişiselleştirilir.
 * İleride ödeme serisi, satın alım vb. aynı imzaya eklenir.
 */
export function buildMotivationMessages(input: {
  profile: UserLocalProfile;
  fallbackName?: string;
  goals?: Goal[];
  /** Bu ay tamamlanan kart ödemesi sayısı (opsiyonel). */
  paymentsThisMonth?: number;
}): MotivationMessage[] {
  const name = firstName(input.profile, input.fallbackName ?? 'dostum');
  const messages: MotivationMessage[] = [];
  const goals = (input.goals ?? []).filter((g) => g.deletedAt == null);

  const completed = goals.filter((g) => g.status === 'tamamlandi');
  for (const g of completed.slice(0, 2)) {
    const title = g.title.trim() || 'hedefine';
    messages.push({
      id: `goal-done-${g.id}`,
      kind: 'goal_completed',
      text: `Tebrikler ${name}! “${title}” hedefine ulaştın.`,
    });
  }

  const active = goals.filter((g) => g.status === 'aktif');
  if (completed.length === 0 && active.length > 0) {
    const g = active[0];
    const title = g.title.trim() || 'hedefin';
    messages.push({
      id: `goal-active-${g.id}`,
      kind: 'goal_progress',
      text: `${name}, “${title}” için birikim yolundasın — devam.`,
    });
  }

  if ((input.paymentsThisMonth ?? 0) >= 1) {
    messages.push({
      id: 'pay-month',
      kind: 'payment_streak',
      text: `Aferin ${name}, bu ay ödemelerini takip ediyorsun.`,
    });
  }

  if (messages.length === 0 && input.profile.name.trim()) {
    messages.push({
      id: 'welcome',
      kind: 'welcome',
      text: `Merhaba ${name}, finansal yolculuğunda yanındayız.`,
    });
  }

  return messages;
}

/** Dashboard için tek satır (öncelik: tebrik > ilerleyiş > ödeme > karşılama). */
export function pickMotivationHeadline(
  messages: MotivationMessage[]
): string | null {
  if (messages.length === 0) return null;
  const order: MotivationKind[] = [
    'goal_completed',
    'goal_progress',
    'payment_streak',
    'welcome',
  ];
  for (const kind of order) {
    const hit = messages.find((m) => m.kind === kind);
    if (hit) return hit.text;
  }
  return messages[0]?.text ?? null;
}
