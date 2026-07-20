import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing, touch } from '@/theme';
import { Text } from './Text';
import { ProgressBar } from './ProgressBar';

interface StepHeaderProps {
  step?: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSkip?: () => void;
}

/**
 * Wizard / form başlığı: geri, opsiyonel adım çubuğu, başlık.
 */
export function StepHeader({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  onSkip,
}: StepHeaderProps) {
  const showProgress =
    typeof step === 'number' && typeof totalSteps === 'number' && totalSteps > 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Geri"
            style={styles.backBtn}
          >
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}

        {showProgress ? (
          <Text variant="label" color={colors.textMuted}>
            {step} / {totalSteps}
          </Text>
        ) : (
          <View />
        )}

        {onSkip ? (
          <Pressable
            onPress={onSkip}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
          >
            <Text variant="label" color={colors.primary}>
              Atla
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      {showProgress ? <ProgressBar progress={step! / totalSteps!} /> : null}

      <View style={styles.titleWrap}>
        <Text variant="title">{title}</Text>
        {subtitle ? (
          <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, paddingTop: spacing.sm },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: touch.minTarget,
    height: touch.minTarget,
    marginLeft: -spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleWrap: { gap: spacing.xs },
  subtitle: { marginTop: 2 },
});
