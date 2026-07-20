import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Screen, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { createSessionFromUrl } from '@/features/auth/deepLink';
import { useAuth } from '@/features/auth';

/**
 * Magic link redirect hedefi. AuthProvider da dinler; bu ekran cold-start / query params için.
 */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const { session, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const href = Linking.createURL('auth/callback', {
        queryParams: Object.fromEntries(
          Object.entries(params).flatMap(([k, v]) => {
            if (typeof v === 'string') return [[k, v] as const];
            if (Array.isArray(v) && typeof v[0] === 'string') {
              return [[k, v[0]] as const];
            }
            return [];
          })
        ),
      });

      const { error: err } = await createSessionFromUrl(href);
      if (!cancelled && err) setError(err);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace('/');
    }
  }, [loading, session]);

  return (
    <Screen>
      <View style={styles.box}>
        {error ? (
          <>
            <Text variant="heading">Giriş tamamlanamadı</Text>
            <Text variant="callout" color={colors.danger}>
              {error}
            </Text>
            <Text
              variant="callout"
              color={colors.primary}
              onPress={() => router.replace('/')}
            >
              Girişe dön
            </Text>
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text variant="callout" color={colors.textMuted}>
              Oturum açılıyor…
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
});
