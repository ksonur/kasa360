/** Bildirim kaynak türü — tercih ve üretim anahtarı. */
export type ReminderSourceKind = 'card' | 'expense' | 'tax' | 'insurance';

/** Varsayılan kademeler (gün önce). */
export const DEFAULT_OFFSETS = [7, 1, 0] as const;

export type ReminderOffset = 7 | 1 | 0;

export interface NotificationPreferences {
  /** Master anahtar — kapalıysa hiç planlanmaz. */
  enabled: boolean;
  /** Aktif kademeler (gün önce). */
  offsets: ReminderOffset[];
  /** Kind bazlı açık/kapalı. */
  kinds: Record<ReminderSourceKind, boolean>;
}

export interface ReminderSource {
  sourceId: string;
  kind: ReminderSourceKind;
  /** YYYY-MM-DD */
  dueDate: string;
  title: string;
  body: string;
  amount: number;
}

export interface PlannedReminder {
  /** `${sourceId}:${dueDate}:${offsetDays}` */
  dedupeKey: string;
  sourceId: string;
  kind: ReminderSourceKind;
  dueDate: string;
  offsetDays: ReminderOffset;
  /** ISO datetime — yerel sabah 09:00 */
  fireAt: string;
  title: string;
  body: string;
}

export interface NotificationsState {
  preferences: NotificationPreferences;
  /** Son üretilen plan (in-app + schedule). */
  planned: PlannedReminder[];
  /** İzin istenmiş mi (cihaz). */
  permissionAsked: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  offsets: [7, 1, 0],
  kinds: {
    card: true,
    expense: true,
    tax: true,
    insurance: true,
  },
};
