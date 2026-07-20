import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Sağda gösterilecek değer (ör. tutar). */
  value?: string;
  valueColor?: string;
  /** Sol taraftaki yuvarlak ikon kabı. */
  leading?: ReactNode;
  leadingBg?: string;
  onPress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
}

/** Dashboard/liste satırı — ikon, başlık/alt başlık, sağda değer. */
export function ListRow({
  title,
  subtitle,
  value,
  valueColor = colors.text,
  leading,
  leadingBg = colors.primaryTint,
  onPress,
  showChevron = false,
  style,
}: ListRowProps) {
  const content = (
    <>
      {leading ? (
        <View style={[styles.leading, { backgroundColor: leadingBg }]}>{leading}</View>
      ) : null}
      <View style={styles.body}>
        <Text variant="subheading">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color={colors.textMuted}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="subheading" color={valueColor}>
          {value}
        </Text>
      ) : null}
      {showChevron ? <ChevronRight size={20} color={colors.textMuted} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.row, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: { opacity: 0.6 },
  leading: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
});
