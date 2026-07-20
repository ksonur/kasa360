import { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Alt sabit alan (ör. wizard footer butonu). Scroll'dan bağımsız durur. */
  footer?: ReactNode;
  padded?: boolean;
  background?: string;
  edges?: Edge[];
  contentStyle?: ViewStyle;
}

/**
 * Tüm ekranların ortak kabuğu: safe-area, status bar, opsiyonel scroll ve
 * klavye kaçınma. Güvenli alanlar iOS notch / Android nav bar için ayarlı.
 */
export function Screen({
  children,
  scroll = false,
  footer,
  padded = true,
  background = colors.background,
  edges = ['top', 'left', 'right'],
  contentStyle,
}: ScreenProps) {
  const inner = (
    <View style={[styles.inner, padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]} edges={edges}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {inner}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{inner}</View>
        )}
        {footer ? (
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            {footer}
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: spacing.xl },
  scrollContent: { flexGrow: 1, paddingBottom: spacing['3xl'] },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
