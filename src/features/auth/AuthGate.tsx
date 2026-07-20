import { useEffect, type ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from './AuthProvider';
import { AUTH_BYPASS } from './config';
import { useOnboarding } from '@/features/onboarding/store';
import { STEP_ROUTES } from '@/features/onboarding/persistence';

/**
 * Session-based navigation (OTP açıkken).
 * AUTH_BYPASS: local onboarding completed / resume routing.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, profile, loading: authLoading } = useAuth();
  const { completed, currentStep, hydrating } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || hydrating) return;

    const path = segments.join('/');
    const root = String(segments[0] ?? '');
    const inOnboarding = path.startsWith('onboarding');
    const inTabs = path.startsWith('(tabs)');
    const inAuthFlow = root === 'auth' || path.startsWith('auth/');
    /** Gelir/gider vb. post-onboarding ekranlar — welcome sayılmaz. */
    const inAppFeature =
      root === 'income' ||
      root === 'expenses' ||
      root === 'cards' ||
      root === 'investments' ||
      root === 'goals' ||
      root === 'assets' ||
      root === 'insights' ||
      root === 'reports' ||
      root === 'upcoming';
    const inAuthWelcome = !inOnboarding && !inTabs && !inAppFeature && !inAuthFlow;

    if (AUTH_BYPASS) {
      if (completed) {
        // Sadece welcome / onboarding'den panele al; feature ekranlara izin ver
        if (inAuthWelcome || inOnboarding || inAuthFlow) {
          router.replace('/(tabs)');
        }
        return;
      }

      // Incomplete: feature ekranlara veya bilinmeyen rotaya düşerse welcome'a
      if (
        (inAppFeature && !inAuthFlow) ||
        (!inAuthWelcome && !inOnboarding && !inTabs && !inAuthFlow)
      ) {
        router.replace('/');
        return;
      }

      if (inTabs) {
        router.replace(STEP_ROUTES[currentStep]);
      }
      return;
    }

    if (!session) {
      // Oturumsuz: yalnızca welcome + OTP ekranı
      if (!inAuthWelcome && !inAuthFlow) {
        router.replace('/');
      }
      return;
    }

    const onboarded = profile?.onboarding_completed === true;

    if (!onboarded) {
      if (!inOnboarding) {
        router.replace('/onboarding/income');
      }
      return;
    }

    if (inAuthWelcome || inOnboarding || inAuthFlow) {
      router.replace('/(tabs)');
    }
  }, [
    authLoading,
    hydrating,
    session,
    profile?.onboarding_completed,
    completed,
    currentStep,
    segments,
    router,
  ]);

  return <>{children}</>;
}
