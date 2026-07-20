import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Car,
  Home,
  LandPlot,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react-native';
import {
  Button,
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
  formatMonthDay,
  nextDueDate,
  OBLIGATION_KIND_META,
  obligationsForAsset,
  useAssets,
  type AssetType,
} from '@/features/assets';

function TypeIcon({ type }: { type: AssetType }) {
  const color = colors.primary;
  if (type === 'arac') return <Car size={22} color={color} />;
  if (type === 'arsa') return <LandPlot size={22} color={color} />;
  return <Home size={22} color={color} />;
}

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets, obligations, softDeleteAsset, softDeleteObligation } =
    useAssets();

  const asset = assets.find((a) => a.id === id && a.deletedAt == null);

  if (!asset) {
    return (
      <Screen>
        <StepHeader title="Varlık bulunamadı" onBack={() => router.back()} />
      </Screen>
    );
  }

  const obs = obligationsForAsset(obligations, asset.id);

  const removeAsset = () => {
    Alert.alert(
      'Varlığı kaldır',
      'Varlık ve tüm yükümlülükleri soft-delete ile kaldırılır.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => {
            softDeleteAsset(asset.id);
            router.replace('/assets');
          },
        },
      ]
    );
  };

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          <Button
            label="Yükümlülük ekle"
            onPress={() =>
              router.push({
                pathname: '/assets/obligation',
                params: { assetId: asset.id },
              })
            }
          />
          <Button
            label="Varlığı kaldır"
            variant="secondary"
            onPress={removeAsset}
          />
        </View>
      }
    >
      <StepHeader
        title={asset.name.trim() || assetTypeLabel(asset.type)}
        subtitle={`${assetTypeLabel(asset.type)}${
          asset.brandModel ? ` · ${asset.brandModel}` : ''
        }`}
        onBack={() => router.back()}
      />

      <Pressable
        style={styles.editLink}
        onPress={() =>
          router.push({ pathname: '/assets/edit', params: { id: asset.id } })
        }
      >
        <Pencil size={16} color={colors.primary} />
        <Text variant="caption" color={colors.primary}>
          Düzenle
        </Text>
      </Pressable>

      <Card style={styles.hero}>
        <View style={styles.heroIcon}>
          <TypeIcon type={asset.type} />
        </View>
        <Text variant="label" color={colors.textMuted}>
          TAHMİNİ DEĞER
        </Text>
        <Text variant="amountLg">
          {formatCurrency(asset.estimatedValue)}
        </Text>
        {asset.purchasePrice != null && asset.purchasePrice > 0 ? (
          <Text variant="caption" color={colors.textMuted}>
            Satın alma: {formatCurrency(asset.purchasePrice)}
          </Text>
        ) : null}
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Yükümlülükler" />
        {obs.length === 0 ? (
          <Card outlined elevated={false} style={styles.emptyOb}>
            <Text variant="callout" color={colors.textMuted}>
              Henüz yükümlülük yok.
            </Text>
            <Pressable
              style={styles.addOb}
              onPress={() =>
                router.push({
                  pathname: '/assets/obligation',
                  params: { assetId: asset.id },
                })
              }
            >
              <Plus size={16} color={colors.primary} />
              <Text variant="caption" color={colors.primary}>
                Ekle
              </Text>
            </Pressable>
          </Card>
        ) : (
          <Card outlined elevated={false} style={styles.listCard}>
            {obs.map((o, i) => {
              const meta = OBLIGATION_KIND_META[o.kind];
              const due = nextDueDate(o);
              const periodLabel = o.startDate
                ? `Yıllık · başlangıç ${o.startDate}`
                : o.month != null && o.day != null
                  ? formatMonthDay(o.month, o.day)
                  : 'Tarih yok';
              return (
                <View key={o.id}>
                  {i > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    style={styles.obRow}
                    onPress={() =>
                      router.push({
                        pathname: '/assets/obligation',
                        params: { id: o.id, assetId: asset.id },
                      })
                    }
                  >
                    <View style={styles.flex}>
                      <Text variant="subheading">{meta.label}</Text>
                      <Text variant="caption" color={colors.textMuted}>
                        {periodLabel}
                        {due ? ` · sonraki ${due}` : ''}
                        {o.amount != null && o.amount > 0
                          ? ` · ${formatCurrency(o.amount)}`
                          : ''}
                      </Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      onPress={() => {
                        Alert.alert(
                          'Yükümlülüğü kaldır',
                          `${meta.label} soft-delete ile kaldırılır.`,
                          [
                            { text: 'Vazgeç', style: 'cancel' },
                            {
                              text: 'Kaldır',
                              style: 'destructive',
                              onPress: () => softDeleteObligation(o.id),
                            },
                          ]
                        );
                      }}
                    >
                      <Trash2 size={18} color={colors.danger} />
                    </Pressable>
                  </Pressable>
                </View>
              );
            })}
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { gap: spacing.md },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  hero: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    padding: spacing.xl,
    alignItems: 'flex-start',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: spacing['2xl'] },
  listCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  emptyOb: {
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  addOb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  obRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
});
