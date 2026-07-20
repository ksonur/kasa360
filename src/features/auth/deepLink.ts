import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

/** Expo Go / native deep link hedefi (Supabase Redirect URLs’e ekli olmalı). */
export function getAuthRedirectUrl(): string {
  return Linking.createURL('auth/callback');
}

function paramsFromUrl(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const parsed = Linking.parse(url);
    const q = parsed.queryParams ?? {};
    for (const [k, v] of Object.entries(q)) {
      if (typeof v === 'string') out[k] = v;
    }
  } catch {
    // ignore parse errors
  }

  const hash = url.includes('#') ? url.split('#')[1] : '';
  if (hash) {
    const hp = new URLSearchParams(hash);
    hp.forEach((v, k) => {
      out[k] = v;
    });
  }

  // Bazı istemciler query’yi düz string bırakır
  const qIndex = url.indexOf('?');
  if (qIndex >= 0) {
    const q = url.slice(qIndex + 1).split('#')[0];
    new URLSearchParams(q).forEach((v, k) => {
      if (!out[k]) out[k] = v;
    });
  }

  return out;
}

/**
 * Maildeki magic link uygulamayı açınca session kurar (PKCE code veya fragment tokens).
 */
export async function createSessionFromUrl(
  url: string
): Promise<{ error: string | null }> {
  if (!url || (!url.includes('auth/callback') && !url.includes('access_token') && !url.includes('code='))) {
    // Yine de code/token varsa dene
    const quick = paramsFromUrl(url);
    if (!quick.code && !quick.access_token) {
      return { error: null };
    }
  }

  const params = paramsFromUrl(url);

  if (params.error_description) {
    return { error: decodeURIComponent(params.error_description.replace(/\+/g, ' ')) };
  }
  if (params.error) {
    return { error: params.error };
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    return { error: error?.message ?? null };
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    return { error: error?.message ?? null };
  }

  // token_hash + type (eski verify linkleri)
  if (params.token_hash && params.type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type as 'email' | 'magiclink',
    });
    return { error: error?.message ?? null };
  }

  return { error: null };
}
