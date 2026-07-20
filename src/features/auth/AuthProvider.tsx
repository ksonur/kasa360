import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { createSessionFromUrl, getAuthRedirectUrl } from './deepLink';
import { loadProfileAndWorkspace, setOnboardingCompleted } from './workspace';
import type { UserProfile, Workspace } from './types';

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

async function hydrateUser(userId: string) {
  return loadProfileAndWorkspace(userId);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (next: Session | null) => {
    setSession(next);
    if (!next?.user) {
      setProfile(null);
      setWorkspace(null);
      return;
    }
    const { profile: p, workspace: w } = await hydrateUser(next.user.id);
    setProfile(p);
    setWorkspace(w);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      try {
        await applySession(data.session);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      try {
        await applySession(next);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  // Magic link → uygulama deep link
  useEffect(() => {
    let mounted = true;

    const handle = async (url: string | null) => {
      if (!url || !mounted) return;
      const { error } = await createSessionFromUrl(url);
      if (error) {
        console.warn('[auth] deep link:', error);
      }
    };

    void Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => {
      void handle(url);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    const redirectTo = getAuthRedirectUrl();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    });
    if (error) return { error: error.message };
    if (data.session) {
      await applySession(data.session);
    }
    return { error: null };
  }, [applySession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setWorkspace(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const { profile: p, workspace: w } = await hydrateUser(session.user.id);
    setProfile(p);
    setWorkspace(w);
  }, [session?.user]);

  const markOnboardingCompleted = useCallback(async () => {
    if (!session?.user) {
      return { error: 'Oturum yok' };
    }
    const result = await setOnboardingCompleted(session.user.id, true);
    if (!result.error) {
      setProfile((prev) =>
        prev ? { ...prev, onboarding_completed: true } : prev
      );
    }
    return result;
  }, [session?.user]);

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
