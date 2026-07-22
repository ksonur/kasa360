import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ACCESS_KEY = 'kasa360.accessToken';
const REFRESH_KEY = 'kasa360.refreshToken';

const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

if (!baseUrl && process.env.EXPO_PUBLIC_AUTH_BYPASS === 'false') {
  console.warn('EXPO_PUBLIC_API_URL is not set');
}

type TokenPair = { accessToken: string; refreshToken: string };

let memory: Partial<TokenPair> = {};

export async function loadTokens(): Promise<Partial<TokenPair>> {
  if (Platform.OS === 'web') {
    return {
      accessToken: localStorage.getItem(ACCESS_KEY) ?? undefined,
      refreshToken: localStorage.getItem(REFRESH_KEY) ?? undefined,
    };
  }
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(ACCESS_KEY),
    AsyncStorage.getItem(REFRESH_KEY),
  ]);
  memory = {
    accessToken: accessToken ?? undefined,
    refreshToken: refreshToken ?? undefined,
  };
  return memory;
}

export async function saveTokens(tokens: TokenPair): Promise<void> {
  memory = tokens;
  if (Platform.OS === 'web') {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    return;
  }
  await Promise.all([
    AsyncStorage.setItem(ACCESS_KEY, tokens.accessToken),
    AsyncStorage.setItem(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  memory = {};
  if (Platform.OS === 'web') {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    return;
  }
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_KEY),
    AsyncStorage.removeItem(REFRESH_KEY),
  ]);
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = await loadTokens();
  if (!refreshToken || !baseUrl) return null;
  const res = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    await clearTokens();
    return null;
  }
  const data = (await res.json()) as { accessToken: string };
  const current = await loadTokens();
  if (!current.refreshToken) return null;
  await saveTokens({
    accessToken: data.accessToken,
    refreshToken: current.refreshToken,
  });
  return data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true
): Promise<{ data: T | null; error: string | null; status: number }> {
  if (!baseUrl) {
    return { data: null, error: 'API URL tanımlı değil', status: 0 };
  }

  const tokens = await loadTokens();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (tokens.accessToken) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }

  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });

  if (res.status === 401 && retry && tokens.refreshToken) {
    const next = await refreshAccessToken();
    if (next) {
      return apiFetch<T>(path, init, false);
    }
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err =
      json &&
      typeof json === 'object' &&
      json !== null &&
      'error' in json &&
      typeof (json as { error: unknown }).error === 'string'
        ? (json as { error: string }).error
        : `İstek başarısız (${res.status})`;
    return { data: null, error: err, status: res.status };
  }

  return { data: json as T, error: null, status: res.status };
}

export function getApiBaseUrl(): string {
  return baseUrl;
}
