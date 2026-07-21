import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  apiFetch,
  clearTokens,
  loadTokens,
  saveTokens,
} from '@/lib/api';
import type { UserProfile, Workspace } from './types';

interface Session {
  userId: string;
  email: string;
  accessToken: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  workspace: Workspace | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markOnboardingCompleted: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type MeResponse = {
  user: UserProfile;
  workspace: Workspace | null;
};

type VerifyResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  workspace: Workspace | null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const applyMe = useCallback(async (accessToken: string) => {
    const { data, error } = await apiFetch<MeResponse>('/auth/me');
    if (error || !data?.user) {
      await clearTokens();
      setSession(null);
      setProfile(null);
      setWorkspace(null);
      return;
    }
    setSession({
      userId: data.user.id,
      email: data.user.email,
      accessToken,
    });
    setProfile(data.user);
    setWorkspace(data.workspace);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tokens = await loadTokens();
        if (!mounted) return;
        if (tokens.accessToken) {
          await applyMe(tokens.accessToken);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applyMe]);

  const signInWithOtp = useCallback(async (email: string) => {
    const { error } = await apiFetch<{ ok: boolean }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    return { error };
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { data, error } = await apiFetch<VerifyResponse>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: token.trim(),
      }),
    });
    if (error || !data) return { error: error ?? 'Doğrulama başarısız' };

    await saveTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    setSession({
      userId: data.user.id,
      email: data.user.email,
      accessToken: data.accessToken,
    });
    setProfile(data.user);
    setWorkspace(data.workspace);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const tokens = await loadTokens();
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    await clearTokens();
    setSession(null);
    setProfile(null);
    setWorkspace(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const tokens = await loadTokens();
    if (!tokens.accessToken) return;
    await applyMe(tokens.accessToken);
  }, [applyMe]);

  const markOnboardingCompleted = useCallback(async () => {
    const { data, error } = await apiFetch<{ user: UserProfile }>(
      '/auth/me/onboarding',
      {
        method: 'PATCH',
        body: JSON.stringify({ completed: true }),
      }
    );
    if (!error && data?.user) {
      setProfile(data.user);
    }
    return { error };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      workspace,
      loading,
      signInWithOtp,
      verifyOtp,
      signOut,
      refreshProfile,
      markOnboardingCompleted,
    }),
    [
      session,
      profile,
      workspace,
      loading,
      signInWithOtp,
      verifyOtp,
      signOut,
      refreshProfile,
      markOnboardingCompleted,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
