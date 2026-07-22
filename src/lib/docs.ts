import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, loadTokens } from '@/lib/api';
import { AUTH_BYPASS } from '@/features/auth/config';

export type DocKey =
  | 'onboarding'
  | 'finance'
  | 'cards'
  | 'investments'
  | 'goals'
  | 'assets'
  | 'notification_prefs'
  | 'notifications'
  | 'profile';

const localKey = (key: DocKey) => `@kasa360/doc_${key}_v1`;

async function useRemote(): Promise<boolean> {
  if (AUTH_BYPASS) return false;
  const tokens = await loadTokens();
  return Boolean(tokens.accessToken);
}

/** Eski AsyncStorage anahtarlarından bir kez oku; yeni local key'e taşı. */
export async function migrateLegacyKeys(
  key: DocKey,
  legacyKeys: string[]
): Promise<string | null> {
  const current = await AsyncStorage.getItem(localKey(key));
  if (current) return current;
  for (const lk of legacyKeys) {
    const raw = await AsyncStorage.getItem(lk);
    if (raw) {
      await AsyncStorage.setItem(localKey(key), raw);
      return raw;
    }
  }
  return null;
}

/**
 * Postgres (Railway /sync/docs) okur.
 * Oturum yoksa AsyncStorage. Remote boşsa yereli bir kez yükler.
 */
export async function loadDoc<T>(
  key: DocKey,
  fallback: T,
  legacyKeys: string[] = []
): Promise<T> {
  if (legacyKeys.length) {
    await migrateLegacyKeys(key, legacyKeys);
  }

  if (!(await useRemote())) {
    return loadLocal(key, fallback);
  }

  const { data, error } = await apiFetch<{ payload: T | null }>(
    `/sync/docs/${key}`
  );

  if (error) {
    console.warn(`[docs] load ${key}:`, error);
    return loadLocal(key, fallback);
  }

  if (data?.payload != null) {
    await AsyncStorage.setItem(localKey(key), JSON.stringify(data.payload));
    return data.payload;
  }

  const local = await loadLocal(key, fallback);
  if (JSON.stringify(local) !== JSON.stringify(fallback)) {
    await saveDoc(key, local);
  }
  return local;
}

export async function saveDoc<T>(key: DocKey, payload: T): Promise<void> {
  await AsyncStorage.setItem(localKey(key), JSON.stringify(payload));

  if (!(await useRemote())) return;

  const { error } = await apiFetch(`/sync/docs/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ payload }),
  });
  if (error) {
    console.warn(`[docs] save ${key}:`, error);
  }
}

export async function clearDoc(key: DocKey): Promise<void> {
  await AsyncStorage.removeItem(localKey(key));
  if (!(await useRemote())) return;
  await apiFetch(`/sync/docs/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ payload: null }),
  });
}

async function loadLocal<T>(key: DocKey, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(localKey(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
