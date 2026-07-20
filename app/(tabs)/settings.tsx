import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { Bell, LogOut, Settings, User } from 'lucide-react-native';
import {
  Button,
  Card,
  CategoryChip,
  Screen,
  Text,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import {
  offsetLabel,
  useNotifications,
  type ReminderOffset,
  type ReminderSourceKind,
} from '@/features/notifications';
import { useProfile } from '@/features/profile';
import { AUTH_BYPASS, useAuth } from '@/features/auth';

const OFFSETS: ReminderOffset[] = [7, 1, 0];

const KIND_ROWS: { id: ReminderSourceKind; label: string; hint: string }[] = [
  { id: 'card', label: 'Kredi kartı', hint: 'Son ödeme tarihi' },
  { id: 'expense', label: 'Tek seferlik gider', hint: 'Vadesi gelen harcamalar' },
  { id: 'tax', label: 'Vergi', hint: 'MTV, emlak vergisi' },
  { id: 'insurance', label: 'Sigorta / kasko', hint: 'DASK, trafik, kasko, konut' },
];

export default function SettingsTab() {
  const {
    preferences,
    permissionStatus,
    updatePreferences,
    setOffsetEnabled,
    setKindEnabled,
    requestPermission,
    planned,
  } = useNotifications();
  const { profile, updateProfile } = useProfile();
  const { session, signOut } = useAuth();
  const [name, setName] = useState(profile.name);
  const [ageText, setAgeText] = useState(
    profile.age != null ? String(profile.age) : ''
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setAgeText(profile.age != null ? String(profile.age) : '');
  }, [profile.name, profile.age]);

  const saveProfile = () => {
    const parsed = parseInt(ageText.replace(/[^0-9]/g, ''), 10);
    const age =
      ageText.trim().length === 0
        ? null
        : Number.isFinite(parsed)
          ? parsed
          : null;
    updateProfile({ name, age });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const permissionHint =
    permissionStatus === 'granted'
      ? 'Bildirim izni verildi.'
      : permissionStatus === 'denied'
        ? 'İzin kapalı. Cihaz ayarlarından açabilirsin.'
        : permissionStatus === 'unsupported'
          ? 'Bu ortamda yerel bildirim desteklenmiyor.'
          : 'Hatırlatmalar için bildirim izni gerekir.';

  const onSignOut = () => {
    Alert.alert('Çıkış yap', 'Oturumu kapatmak istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış yap',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSigningOut(true);
            try {
              await signOut();
            } finally {
              setSigningOut(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Settings size={22} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text variant="title">Ayarlar</Text>
          <Text variant="caption" color={colors.textMuted}>
            Profil ve bildirim tercihleri
          </Text>
        </View>
      </View>

      <Card style={styles.card}>
        <View style={styles.permHead}>
          <User size={18} color={colors.primary} />
          <Text variant="heading">Profil</Text>
        </View>
        <Text variant="caption" color={colors.textMuted}>
          İsim tebrik ve motivasyon mesajlarında kullanılır.
        </Text>
        <Text variant="label" color={colors.textSecondary}>
          İsim
        </Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Örn. Onur"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
        />
        <Text variant="label" color={colors.textSecondary}>
          Yaş (opsiyonel)
        </Text>
        <TextInput
          style={styles.input}
          value={ageText}
          onChangeText={setAgeText}
          placeholder="Örn. 32"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={3}
        />
        <Button
          label={savedFlash ? 'Kaydedildi' : 'Profili kaydet'}
          onPress={saveProfile}
        />
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text variant="subheading">Hatırlatmalar</Text>
            <Text variant="caption" color={colors.textMuted}>
              Kredi kartı, vergi, sigorta ve tek seferlik gider
            </Text>
          </View>
          <Switch
            value={preferences.enabled}
            onValueChange={(enabled) => updatePreferences({ enabled })}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={preferences.enabled ? colors.primary : colors.surfaceAlt}
          />
        </View>

        <View style={styles.divider} />

        <Text variant="label" color={colors.textSecondary}>
          Kademeler
        </Text>
        <View style={styles.chips}>
          {OFFSETS.map((o) => (
            <CategoryChip
              key={o}
              label={offsetLabel(o)}
              selected={preferences.offsets.includes(o)}
              onPress={() =>
                setOffsetEnabled(o, !preferences.offsets.includes(o))
              }
            />
          ))}
        </View>
        <Text variant="caption" color={colors.textMuted}>
          Varsayılan: 7 gün önce, 1 gün önce, gün içi.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text variant="heading">Türler</Text>
        {KIND_ROWS.map((row, i) => (
          <View key={row.id}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text variant="subheading">{row.label}</Text>
                <Text variant="caption" color={colors.textMuted}>
                  {row.hint}
                </Text>
              </View>
              <Switch
                value={preferences.kinds[row.id]}
                onValueChange={(v) => setKindEnabled(row.id, v)}
                disabled={!preferences.enabled}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={
                  preferences.kinds[row.id] ? colors.primary : colors.surfaceAlt
                }
              />
            </View>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <View style={styles.permHead}>
          <Bell size={18} color={colors.primary} />
          <Text variant="subheading">Cihaz izni</Text>
        </View>
        <Text variant="caption" color={colors.textMuted}>
          {permissionHint}
        </Text>
        <Text variant="caption" color={colors.textMuted}>
          Planlı hatırlatma: {planned.length}
        </Text>
        {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' ? (
          <Button label="İzin ver" onPress={() => void requestPermission()} />
        ) : null}
      </Card>

      {!AUTH_BYPASS && session ? (
        <Card style={styles.card}>
          <View style={styles.permHead}>
            <LogOut size={18} color={colors.danger} />
            <Text variant="heading">Hesap</Text>
          </View>
          <Text variant="caption" color={colors.textMuted}>
            {session.user.email}
          </Text>
          <Button
            label="Çıkış yap"
            variant="secondary"
            loading={signingOut}
            disabled={signingOut}
            onPress={onSignOut}
          />
        </Card>
      ) : (
        <Text variant="caption" color={colors.textMuted} style={styles.footerNote}>
          {AUTH_BYPASS
            ? 'Geliştirme modu: oturum kapalı (AUTH_BYPASS).'
            : 'Dışa aktarım sonraki sprintlerde eklenecek.'}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  permHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    minHeight: 52,
  },
  footerNote: { paddingVertical: spacing.lg },
});
