import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { PlannedReminder } from './types';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

let handlerReady = false;

function ensureHandler(): void {
  if (handlerReady || Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  handlerReady = true;
}

export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  ensureHandler();
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestNotificationPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  ensureHandler();
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  const asked = await Notifications.requestPermissionsAsync();
  return asked.status === 'granted' ? 'granted' : 'denied';
}

/**
 * Tüm local schedule’ı iptal edip yeniden planlar.
 * UI’dan bağımsız; generate çıktısını alır.
 */
export async function scheduleReminders(
  planned: PlannedReminder[]
): Promise<{ scheduled: number; skipped: boolean }> {
  if (Platform.OS === 'web') return { scheduled: 0, skipped: true };
  ensureHandler();

  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== 'granted') {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return { scheduled: 0, skipped: true };
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  let scheduled = 0;

  for (const p of planned) {
    const when = new Date(p.fireAt).getTime();
    if (when <= now + 5000) continue;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: p.dedupeKey,
        content: {
          title: p.title,
          body: p.body,
          data: {
            dedupeKey: p.dedupeKey,
            sourceId: p.sourceId,
            kind: p.kind,
            dueDate: p.dueDate,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(p.fireAt),
        },
      });
      scheduled += 1;
    } catch {
      // Tekil hata tüm planı bozmasın
    }
  }

  return { scheduled, skipped: false };
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  ensureHandler();
  await Notifications.cancelAllScheduledNotificationsAsync();
}
