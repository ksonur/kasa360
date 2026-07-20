import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme';

type Variant = keyof typeof typography;

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
}

/**
 * Tema-farkında metin bileşeni. Tüm yazılar bunun üzerinden geçer;
 * böylece font ailesi ve ölçek tek yerden yönetilir.
 */
export function Text({
  variant = 'body',
  color = colors.text,
  center,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[typography[variant], { color }, center && styles.center, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
