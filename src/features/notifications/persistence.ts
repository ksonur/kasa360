import {
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
  type NotificationsState,
  type ReminderOffset,
  type ReminderSourceKind,
} from './types';
import { loadDoc, saveDoc } from '@/lib/docs';

const VALID_OFFSETS = new Set<number>([7, 1, 0]);
const KINDS: ReminderSourceKind[] = ['card', 'expense', 'tax', 'insurance'];

function normalizePrefs(
  raw: Partial<NotificationPreferences> | null
): NotificationPreferences {
  const offsets = Array.isArray(raw?.offsets)
    ? (raw!.offsets.filter((o) => VALID_OFFSETS.has(o)) as ReminderOffset[])
    : [...DEFAULT_PREFERENCES.offsets];
  const kinds = { ...DEFAULT_PREFERENCES.kinds };
  if (raw?.kinds) {
    for (const k of KINDS) {
      if (typeof raw.kinds[k] === 'boolean') kinds[k] = raw.kinds[k];
    }
  }
  return {
    enabled: raw?.enabled !== false,
    offsets: offsets.length > 0 ? offsets : [...DEFAULT_PREFERENCES.offsets],
    kinds,
  };
}

export async function loadPreferences(): Promise<NotificationPreferences> {
  const parsed = await loadDoc<Partial<NotificationPreferences>>(
    'notification_prefs',
    { ...DEFAULT_PREFERENCES, kinds: { ...DEFAULT_PREFERENCES.kinds } },
    ['@kasa360/notification_prefs_v1']
  );
  return normalizePrefs(parsed);
}

export async function savePreferences(
  prefs: NotificationPreferences
): Promise<void> {
  await saveDoc('notification_prefs', prefs);
}

export async function loadNotificationsState(): Promise<
  Pick<NotificationsState, 'planned' | 'permissionAsked'>
> {
  const parsed = await loadDoc<Partial<NotificationsState>>(
    'notifications',
    { planned: [], permissionAsked: false },
    ['@kasa360/notifications_v1']
  );
  return {
    planned: Array.isArray(parsed.planned) ? parsed.planned : [],
    permissionAsked: !!parsed.permissionAsked,
  };
}

export async function saveNotificationsState(
  state: Pick<NotificationsState, 'planned' | 'permissionAsked'>
): Promise<void> {
  await saveDoc('notifications', state);
}
