import { useEffect } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Screen, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

/** Eski magic-link yolu; OTP akışında kullanılmaz — ana ekrana yönlendirir. */
export default function AuthCallbackScreen() {
  useEffect(() => {
    router.replace('/');
  }, []);

  return (
    <Screen>
      <View style={styles.box}>
        <ActivityIndicator color={colors.primary} />
        <Text variant="callout" color={colors.textMuted}>
          Yönlendiriliyor…
        </Text>
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
