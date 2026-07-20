import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: ReactNode;
}

/** MVP kapsamındaki ama bu turda tasarlanmayan sekmeler için tutarlı boş durum. */
export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title">{title}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text variant="heading" center>
          Yakında
        </Text>
        <Text variant="body" color={colors.textSecondary} center style={styles.desc}>
          {description}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, paddingBottom: spacing.md },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius['2xl'],
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  desc: { maxWidth: 300 },
});
