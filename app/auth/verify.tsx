import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Screen, StepHeader, Text } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { useAuth } from '@/features/auth';
import { useOnboarding } from '@/features/onboarding/store';

export default function VerifyOtpScreen() {
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const { verifyOtp, signInWithOtp, session } = useAuth();
  const { setEmail } = useOnboarding();
  const email = (paramEmail ?? '').trim().toLowerCase();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const canVerify = /^\d{6,8}$/.test(code.trim());

  useEffect(() => {
    if (session) {
      setEmail(email);
      router.replace('/');
    }
  }, [session, email, setEmail]);

  const onVerify = async () => {
    if (!email || !canVerify) return;
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await verifyOtp(email, code);
      if (err) {
        setError(err);
        return;
      }
      setEmail(email);
      router.replace('/');
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (!email) return;
    setBusy(true);
    setError(null);
    setResent(false);
    try {
      const { error: err } = await signInWithOtp(email);
      if (err) {
        setError(err);
        return;
      }
      setResent(true);
    } finally {
      setBusy(false);
    }
  };

  if (!email) {
    return (
      <Screen>
        <StepHeader title="Doğrulama" onBack={() => router.replace('/')} />
        <Text variant="callout" color={colors.textMuted} style={styles.pad}>
          E-posta bulunamadı. Giriş ekranından tekrar dene.
        </Text>
        <Button label="Girişe dön" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          <Button
            label="Doğrula"
            loading={busy}
            disabled={!canVerify || busy}
            onPress={() => void onVerify()}
          />
          <Button
            label="Kodu yeniden gönder"
            variant="secondary"
            disabled={busy}
            onPress={() => void onResend()}
          />
        </View>
      }
    >
      <StepHeader
        title="Doğrulama kodu"
        subtitle={`${email} adresine gönderilen 6 haneli kodu gir.`}
        onBack={() => router.back()}
      />

      <View style={styles.block}>
        <Text variant="label" color={colors.textSecondary}>
          Kod
        </Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 8))}
          placeholder="000000"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={8}
          autoFocus
        />
        {error ? (
          <Text variant="caption" color={colors.danger}>
            {error}
          </Text>
        ) : null}
        {resent ? (
          <Text variant="caption" color={colors.primary}>
            Yeni kod gönderildi.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginTop: spacing.xl, marginBottom: spacing.lg },
  block: { gap: spacing.sm, marginTop: spacing['2xl'] },
  footer: { gap: spacing.md },
  input: {
    ...typography.amountLg,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    minHeight: 64,
  },
});
