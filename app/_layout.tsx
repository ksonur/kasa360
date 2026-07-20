import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { appFonts, colors } from '@/theme';
import { OnboardingProvider, useOnboarding } from '@/features/onboarding/store';
import { FinanceProvider, useFinance } from '@/features/finance';
import { CardsProvider, useCards } from '@/features/cards';
import { InvestmentsProvider, useInvestments } from '@/features/investments';
import { GoalsProvider, useGoals } from '@/features/goals';
import { AssetsProvider, useAssets } from '@/features/assets';
import {
  NotificationResyncBridge,
  NotificationsProvider,
  useNotifications,
} from '@/features/notifications';
import { ProfileProvider, useProfile } from '@/features/profile';
import { AuthGate, AuthProvider, useAuth } from '@/features/auth';

function RootNavigator() {
  const { loading } = useAuth();
  const { hydrating: onboardingHydrating } = useOnboarding();
  const { hydrating: financeHydrating } = useFinance();
  const { hydrating: cardsHydrating } = useCards();
  const { hydrating: investmentsHydrating } = useInvestments();
  const { hydrating: goalsHydrating } = useGoals();
  const { hydrating: assetsHydrating } = useAssets();
  const { hydrating: notificationsHydrating } = useNotifications();
  const { hydrating: profileHydrating } = useProfile();

  if (
    loading ||
    onboardingHydrating ||
    financeHydrating ||
    cardsHydrating ||
    investmentsHydrating ||
    goalsHydrating ||
    assetsHydrating ||
    notificationsHydrating ||
    profileHydrating
  ) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.onPrimary} size="large" />
      </View>
    );
  }

  return (
    <AuthGate>
      <NotificationResyncBridge />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/verify" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="income/edit" />
        <Stack.Screen name="income/monthly" />
        <Stack.Screen name="income/overtime" />
        <Stack.Screen name="income/extra" />
        <Stack.Screen name="expenses/routines" />
        <Stack.Screen name="expenses/one-time" />
        <Stack.Screen name="insights/index" />
        <Stack.Screen name="insights/what-if" />
        <Stack.Screen name="insights/cashflow" />
        <Stack.Screen name="reports/index" />
        <Stack.Screen name="cards/[id]" />
        <Stack.Screen name="cards/edit" />
        <Stack.Screen name="cards/statement" />
        <Stack.Screen name="cards/pay" />
        <Stack.Screen name="cards/installment" />
        <Stack.Screen name="investments/[id]" />
        <Stack.Screen name="investments/edit" />
        <Stack.Screen name="investments/move" />
        <Stack.Screen name="investments/balance" />
        <Stack.Screen name="investments/chart" />
        <Stack.Screen name="goals/index" />
        <Stack.Screen name="goals/edit" />
        <Stack.Screen name="goals/[id]" />
        <Stack.Screen name="goals/contribute" />
        <Stack.Screen name="assets/index" />
        <Stack.Screen name="assets/edit" />
        <Stack.Screen name="assets/[id]" />
        <Stack.Screen name="assets/obligation" />
        <Stack.Screen name="upcoming" />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(appFonts);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.onPrimary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AuthProvider>
          <ProfileProvider>
            <OnboardingProvider>
              <FinanceProvider>
                <CardsProvider>
                  <InvestmentsProvider>
                    <GoalsProvider>
                      <AssetsProvider>
                        <NotificationsProvider>
                          <RootNavigator />
                        </NotificationsProvider>
                      </AssetsProvider>
                    </GoalsProvider>
                  </InvestmentsProvider>
                </CardsProvider>
              </FinanceProvider>
            </OnboardingProvider>
          </ProfileProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
