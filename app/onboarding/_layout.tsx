import { Stack } from 'expo-router';
import { colors } from '@/theme';

/** Onboarding wizard — adımlar arası kaydırma geçişi, header gizli. */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    />
  );
}
