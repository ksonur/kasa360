import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PiggyBank, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react-native';
import { Button, Text } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { useOnboarding } from '@/features/onboarding/store';
import { STEP_ROUTES } from '@/features/onboarding/persistence';
import { AUTH_BYPASS, useAuth } from '@/features/auth';

const VALUE_PROPS = [
  { icon: TrendingUp, text: 'Gelir, gider ve yatırımların tek ekranda' },
  { icon: ShieldCheck, text: 'Vergi, sigorta ve son ödeme günlerini kaçırma' },
  { icon: Sparkles, text: 'Minimum veri girişi, akıllı hatırlatmalar' },
];

export default function WelcomeScreen() {
  const { data, setEmail, currentStep, completed } = useOnboarding();
  const { signInWithOtp } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());
  const canContinue = AUTH_BYPASS || emailValid;
  const resume = !completed && currentStep !== 'income';
  const continueLabel = AUTH_BYPASS
    ? resume
      ? 'Kaldığın yerden devam et'
      : 'Devam et'
    : 'Kod gönder'

  const onContinue = async () => {
    if (AUTH_BYPASS) {
      if (completed) {
        router.replace('/(tabs)');
        return;
      }
      router.replace(STEP_ROUTES[currentStep]);
      return;
    }

    if (!emailValid) return;
    setBusy(true);
    setError(null);
    try {
      const email = data.email.trim().toLowerCase();
      setEmail(email);
      const { error: err } = await signInWithOtp(email);
      if (err) {
        setError(err);
        return;
      }
      router.push({ pathname: '/auth/verify', params: { email } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.primary, colors.primaryDarker]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <PiggyBank size={26} color={colors.primary} />
            </View>
            <Text variant="heading" color={colors.onPrimary}>
              Kasa360
            </Text>
          </View>
          <Text variant="display" color={colors.onPrimary} style={styles.headline}>
            Paranın{'\n'}360° kontrolü
          </Text>
          <Text variant="body" color={colors.primaryTint} style={styles.tagline}>
            Bütçeni, borçlarını ve hedeflerini tek bir yerden yönet.
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.props}>
          {VALUE_PROPS.map(({ icon: Icon, text }) => (
            <View key={text} style={styles.propRow}>
              <View style={styles.propIcon}>
                <Icon size={18} color={colors.primary} />
              </View>
              <Text variant="callout" color={colors.textSecondary} style={styles.flex}>
                {text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.form}>
          <Text variant="label" color={colors.textSecondary}>
            E-posta ile giriş yap
          </Text>
          <TextInput
            style={styles.input}
            value={data.email}
            onChangeText={setEmail}
            placeholder="ornek@eposta.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="email"
            editable={!busy}
          />
          <Text variant="caption" color={colors.textMuted}>
            {AUTH_BYPASS
              ? 'OTP şimdilik kapalı — doğrudan devam edebilirsin.'
              : 'Şifre yok. E-postana 6 haneli bir kod göndereceğiz.'}
          </Text>
          {error ? (
            <Text variant="caption" color={colors.danger}>
              {error}
            </Text>
          ) : null}
        </View>

        <Button
          label={continueLabel}
          disabled={!canContinue || busy}
          loading={busy}
          onPress={() => void onContinue()}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
    borderBottomLeftRadius: radius['2xl'],
    borderBottomRightRadius: radius['2xl'],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: { marginTop: spacing['4xl'] },
  tagline: { marginTop: spacing.md, maxWidth: 300 },
  sheet: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
    gap: spacing['2xl'],
    justifyContent: 'space-between',
  },
  props: { gap: spacing.lg },
  propRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  propIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { gap: spacing.sm },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    minHeight: 54,
  },
});
