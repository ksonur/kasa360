import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Car, Home, LandPlot, Plus } from 'lucide-react-native';
import {
  Card,
  Screen,
  SectionHeader,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatCurrency } from '@/theme';
import {
  assetTypeLabel,
  summarizeActiveAssets,
  useAssets,
  type AssetType,
} from '@/features/assets';

function TypeIcon({ type }: { type: AssetType }) {
  const color = colors.primary;
  if (type === 'arac') return <Car size={18} color={color} />;
  if (type === 'arsa') return <LandPlot size={18} color={color} />;
  return <Home size={18} color={color} />;
}

export default function AssetsListScreen() {
  const { assets, obligations } = useAssets();
  const summaries = summarizeActiveAssets(assets, obligations);

  return (
    <Screen scroll>
      <StepHeader
        title="Varlıklar"
        subtitle="Ev, arsa ve araç; vergi / DASK / sigorta tarihleri."
        onBack={() => router.back()}
      />

      <Pressable
        style={styles.addRow}
        onPress={() => router.push('/assets/edit')}
      >
        <View style={styles.addIcon}>
          <Plus size={20} color={colors.onPrimary} />
        </View>
        <View style={styles.flex}>
          <Text variant="subheading">Varlık ekle</Text>
          <Text variant="caption" color={colors.textMuted}>
            Tür, değer ve yükümlülük tarihleri
          </Text>
        </View>
      </Pressable>

      {summaries.length === 0 ? (
        <Card outlined elevated={false} style={styles.empty}>
          <Home size={32} color={colors.primary} />
          <Text variant="callout" color={colors.textMuted} style={styles.emptyText}>
            Henüz varlık yok. Yukarıdan ekleyebilirsin.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          <SectionHeader title="Kayıtlı varlıklar" />
          {summaries.map((s) => (
            <Pressable
              key={s.asset.id}
              onPress={() => router.push(`/assets/${s.asset.id}`)}
            >
              <Card style={styles.item}>
                <View style={styles.itemHead}>
                  <View style={styles.itemIcon}>
                    <TypeIcon type={s.asset.type} />
                  </View>
                  <View style={styles.flex}>
                    <Text variant="subheading">
                      {s.asset.name.trim() || assetTypeLabel(s.asset.type)}
                    </Text>
                    <Text variant="caption" color={colors.textMuted}>
                      {assetTypeLabel(s.asset.type)}
                      {s.asset.brandModel
                        ? ` · ${s.asset.brandModel}`
                        : ''}
                      {' · '}
                      {formatCurrency(s.asset.estimatedValue)}
                    </Text>
                  </View>
                </View>
                {s.nextDueInDays != null ? (
                  <Text variant="caption" color={colors.primary}>
                    Sonraki: {s.nextKindLabel}
                    {s.nextDueInDays === 0
                      ? ' · bugün'
                      : ` · ${s.nextDueInDays} gün`}
                  </Text>
                ) : (
                  <Text variant="caption" color={colors.textMuted}>
                    Yaklaşan yükümlülük yok
                  </Text>
                )}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing['2xl'],
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing['2xl'],
  },
  emptyText: { textAlign: 'center' },
  list: { marginTop: spacing.xl, gap: spacing.md },
  item: { gap: spacing.sm, padding: spacing.lg },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
