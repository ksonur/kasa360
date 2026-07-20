import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
  type NotificationsState,
  type ReminderOffset,
  type ReminderSourceKind,
} from './types';

const PREFS_KEY = '@kasa360/notification_prefs_v1';
const STATE_KEY = '@kasa360/notifications_v1';

const VALID_OFFSETS = new Set<number>([7, 1, 0]);
const KINDS: ReminderSourceKind[] = ['card', 'expense', 'tax', 'insurance'];

function normalizePrefs(raw: Partial<NotificationPreferences> | null): NotificationPreferences {
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
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES, kinds: { ...DEFAULT_PREFERENCES.kinds } };
    return normalizePrefs(JSON.parse(raw) as Partial<NotificationPreferences>);
  } catch {
    return { ...DEFAULT_PREFERENCES, kinds: { ...DEFAULT_PREFERENCES.kinds } };
  }
}

export async function savePreferences(prefs: NotificationPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function loadNotificationsState(): Promise<
  Pick<NotificationsState, 'planned' | 'permissionAsked'>
> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) return { planned: [], permissionAsked: false };
    const parsed = JSON.parse(raw) as Partial<NotificationsState>;
    return {
      planned: Array.isArray(parsed.planned) ? parsed.planned : [],
      permissionAsked: !!parsed.permissionAsked,
    };
  } catch {
    return { planned: [], permissionAsked: false };
  }
}

export async function saveNotificationsState(
  state: Pick<NotificationsState, 'planned' | 'permissionAsked'>
): Promise<void> {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
}
