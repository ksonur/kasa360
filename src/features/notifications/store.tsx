import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { generateReminders } from './generate';
import {
  loadNotificationsState,
  loadPreferences,
  saveNotificationsState,
  savePreferences,
} from './persistence';
import {
  cancelAllReminders,
  getPermissionStatus,
  requestNotificationPermission,
  scheduleReminders,
  type PermissionStatus,
} from './scheduler';
import type {
  NotificationPreferences,
  PlannedReminder,
  ReminderOffset,
  ReminderSource,
  ReminderSourceKind,
} from './types';
import { DEFAULT_PREFERENCES } from './types';

interface NotificationsContextValue {
  preferences: NotificationPreferences;
  planned: PlannedReminder[];
  hydrating: boolean;
  permissionStatus: PermissionStatus;
  updatePreferences: (patch: Partial<NotificationPreferences>) => void;
  setOffsetEnabled: (offset: ReminderOffset, enabled: boolean) => void;
  setKindEnabled: (kind: ReminderSourceKind, enabled: boolean) => void;
  requestPermission: () => Promise<PermissionStatus>;
  /** Kaynaklar değişince veya prefs sonrası çağır. */
  resyncFromSources: (sources: ReminderSource[]) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

const SAVE_DEBOUNCE_MS = 300;
const RESYNC_DEBOUNCE_MS = 400;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...DEFAULT_PREFERENCES,
    kinds: { ...DEFAULT_PREFERENCES.kinds },
    offsets: [...DEFAULT_PREFERENCES.offsets],
  });
  const [planned, setPlanned] = useState<PlannedReminder[]>([]);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>('undetermined');
  const [hydrating, setHydrating] = useState(true);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);
  const latestSources = useRef<ReminderSource[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [prefs, state, status] = await Promise.all([
        loadPreferences(),
        loadNotificationsState(),
        getPermissionStatus(),
      ]);
      if (!mounted) return;
      setPreferences(prefs);
      setPlanned(state.planned);
      setPermissionAsked(state.permissionAsked);
      setPermissionStatus(status);
      setHydrating(false);
    })();
    return () => {
      mounted = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (resyncTimer.current) clearTimeout(resyncTimer.current);
    };
  }, []);

  useEffect(() => {
    if (hydrating) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void savePreferences(preferences);
      void saveNotificationsState({ planned, permissionAsked });
    }, SAVE_DEBOUNCE_MS);
  }, [preferences, planned, permissionAsked, hydrating]);

  const runSchedule = useCallback(async (next: PlannedReminder[]) => {
    if (!preferences.enabled) {
      await cancelAllReminders();
      return;
    }
    await scheduleReminders(next);
  }, [preferences.enabled]);

  const resyncFromSources = useCallback(
    (sources: ReminderSource[]) => {
      latestSources.current = sources;
      if (resyncTimer.current) clearTimeout(resyncTimer.current);
      resyncTimer.current = setTimeout(() => {
        const next = generateReminders(
          latestSources.current,
          preferences,
          new Date()
        );
        setPlanned(next);
        void runSchedule(next);
      }, RESYNC_DEBOUNCE_MS);
    },
    [preferences, runSchedule]
  );

  // Prefs değişince mevcut kaynaklarla yeniden üret
  useEffect(() => {
    if (hydrating) return;
    if (latestSources.current.length === 0) return;
    const next = generateReminders(latestSources.current, preferences, new Date());
    setPlanned(next);
    void runSchedule(next);
  }, [preferences, hydrating, runSchedule]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state !== 'active' || hydrating) return;
      void getPermissionStatus().then(setPermissionStatus);
      if (latestSources.current.length > 0) {
        const next = generateReminders(
          latestSources.current,
          preferences,
          new Date()
        );
        setPlanned(next);
        void runSchedule(next);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [hydrating, preferences, runSchedule]);

  const updatePreferences = useCallback(
    (patch: Partial<NotificationPreferences>) => {
      setPreferences((prev) => ({
        ...prev,
        ...patch,
        kinds: patch.kinds ? { ...prev.kinds, ...patch.kinds } : prev.kinds,
        offsets: patch.offsets ? [...patch.offsets] : prev.offsets,
      }));
    },
    []
  );

  const setOffsetEnabled = useCallback(
    (offset: ReminderOffset, enabled: boolean) => {
      setPreferences((prev) => {
        const set = new Set(prev.offsets);
        if (enabled) set.add(offset);
        else set.delete(offset);
        const offsets = ([7, 1, 0] as ReminderOffset[]).filter((o) =>
          set.has(o)
        );
        return { ...prev, offsets };
      });
    },
    []
  );

  const setKindEnabled = useCallback(
    (kind: ReminderSourceKind, enabled: boolean) => {
      setPreferences((prev) => ({
        ...prev,
        kinds: { ...prev.kinds, [kind]: enabled },
      }));
    },
    []
  );

  const requestPermission = useCallback(async () => {
    const status = await requestNotificationPermission();
    setPermissionStatus(status);
    setPermissionAsked(true);
    if (status === 'granted' && latestSources.current.length > 0) {
      const next = generateReminders(
        latestSources.current,
        preferences,
        new Date()
      );
      setPlanned(next);
      void scheduleReminders(next);
    }
    return status;
  }, [preferences]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      preferences,
      planned,
      hydrating,
      permissionStatus,
      updatePreferences,
      setOffsetEnabled,
      setKindEnabled,
      requestPermission,
      resyncFromSources,
    }),
    [
      preferences,
      planned,
      hydrating,
      permissionStatus,
      updatePreferences,
      setOffsetEnabled,
      setKindEnabled,
      requestPermission,
      resyncFromSources,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications, NotificationsProvider içinde kullanılmalı');
  }
  return ctx;
}
