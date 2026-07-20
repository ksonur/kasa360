import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
  /** Kenarlıklı düz kart (gölge yerine). */
  outlined?: boolean;
}

export function Card({
  children,
  onPress,
  style,
  padded = true,
  elevated = true,
  outlined = false,
}: CardProps) {
  const base = [
    styles.card,
    padded && styles.padded,
    elevated && !outlined && shadow.card,
    outlined && styles.outlined,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [base, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
  },
  padded: { padding: spacing.xl },
  outlined: { borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
});
