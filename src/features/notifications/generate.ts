import type {
  NotificationPreferences,
  PlannedReminder,
  ReminderOffset,
  ReminderSource,
} from './types';

function parseISODate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Vade − offset; tetikleme yerel 09:00. */
export function fireAtFor(
  dueDate: string,
  offsetDays: ReminderOffset,
  hour = 9
): string | null {
  const due = parseISODate(dueDate);
  if (!due) return null;
  const fire = new Date(due);
  fire.setDate(fire.getDate() - offsetDays);
  fire.setHours(hour, 0, 0, 0);
  return fire.toISOString();
}

export function offsetLabel(offset: ReminderOffset): string {
  if (offset === 0) return 'Bugün';
  if (offset === 1) return '1 gün önce';
  return `${offset} gün önce`;
}

/**
 * Pure üretim: kaynaklar + tercihler → planlı hatırlatmalar.
 * Edge function aynı imzayı kullanabilir. UI bağımlılığı yok.
 */
export function generateReminders(
  sources: ReminderSource[],
  prefs: NotificationPreferences,
  now = new Date()
): PlannedReminder[] {
  if (!prefs.enabled) return [];

  const today = startOfDay(now);
  const offsets = prefs.offsets.slice().sort((a, b) => b - a) as ReminderOffset[];
  const out: PlannedReminder[] = [];
  const seen = new Set<string>();

  for (const src of sources) {
    if (!prefs.kinds[src.kind]) continue;
    const due = parseISODate(src.dueDate);
    if (!due) continue;
    // Çok eski vadeleri atla
    if (due.getTime() < today.getTime() - 86400000) continue;

    for (const offsetDays of offsets) {
      const fireAt = fireAtFor(src.dueDate, offsetDays);
      if (!fireAt) continue;
      const fireDay = startOfDay(new Date(fireAt));
      if (fireDay.getTime() < today.getTime()) continue;

      const dedupeKey = `${src.sourceId}:${src.dueDate}:${offsetDays}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const when =
        offsetDays === 0
          ? 'bugün'
          : offsetDays === 1
            ? 'yarın'
            : `${offsetDays} gün sonra`;

      out.push({
        dedupeKey,
        sourceId: src.sourceId,
        kind: src.kind,
        dueDate: src.dueDate,
        offsetDays,
        fireAt,
        title: src.title,
        body: `${src.body} · vade ${when} (${toISODate(due)})`,
      });
    }
  }

  out.sort((a, b) => a.fireAt.localeCompare(b.fireAt));
  return out;
}

/** Önümüzdeki N gün içinde tetiklenecek planlar (in-app liste). */
export function plannedInNextDays(
  planned: PlannedReminder[],
  withinDays = 7,
  now = new Date()
): PlannedReminder[] {
  const today = startOfDay(now).getTime();
  const end = today + withinDays * 86400000;
  return planned.filter((p) => {
    const t = startOfDay(new Date(p.fireAt)).getTime();
    return t >= today && t <= end;
  });
}
