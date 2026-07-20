import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';
import { Button } from './Button';

interface DateFieldProps {
  label: string;
  /** YYYY-MM-DD veya boş/null (opsiyonel alanlarda). */
  value: string | null;
  onChange: (iso: string | null) => void;
  hint?: string;
  /** Boş bırakmaya izin ver (sigorta başlangıcı vb.). */
  optional?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: ViewStyle;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(iso: string): string {
  return parseISO(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Telefon native calendar / spinner picker.
 * Android: sistem diyaloğu. iOS: alt sheet + spinner.
 */
export function DateField({
  label,
  value,
  onChange,
  hint,
  optional = false,
  minimumDate,
  maximumDate,
  style,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() =>
    value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : new Date()
  );

  const openPicker = () => {
    setDraft(
      value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : new Date()
    );
    setOpen(true);
  };

  const commit = (d: Date) => {
    onChange(toISO(d));
  };

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setOpen(false);
    if (event.type === 'dismissed' || !date) return;
    commit(date);
  };

  const onIOSChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDraft(date);
  };

  return (
    <View style={[styles.container, style]}>
      <Text variant="label" color={colors.textSecondary}>
        {label}
      </Text>
      {hint ? (
        <Text variant="caption" color={colors.textMuted}>
          {hint}
        </Text>
      ) : null}

      <Pressable
        style={styles.field}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}, tarih seç`}
      >
        <Calendar size={18} color={colors.primary} />
        <Text
          variant="body"
          color={value ? colors.text : colors.textMuted}
          style={styles.flex}
        >
          {value && /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? formatDisplay(value)
            : optional
              ? 'Tarih seç (opsiyonel)'
              : 'Tarih seç'}
        </Text>
      </Pressable>

      {optional && value ? (
        <Pressable onPress={() => onChange(null)} hitSlop={8}>
          <Text variant="caption" color={colors.primary}>
            Temizle
          </Text>
        </Pressable>
      ) : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="calendar"
          onChange={onAndroidChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <Text variant="heading">Tarih seç</Text>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                onChange={onIOSChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="tr-TR"
                style={styles.iosPicker}
              />
              <View style={styles.sheetActions}>
                {optional ? (
                  <Button
                    label="Temizle"
                    variant="secondary"
                    onPress={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                  />
                ) : null}
                <Button
                  label="Tamam"
                  onPress={() => {
                    commit(draft);
                    setOpen(false);
                  }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {/* Web / diğer: iOS benzeri modal + spinner */}
      {open && Platform.OS === 'web' ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <Text variant="heading">Tarih seç</Text>
              <DateTimePicker
                value={draft}
                mode="date"
                display="default"
                onChange={(_e, date) => {
                  if (date) {
                    commit(date);
                    setOpen(false);
                  }
                }}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
              <Button label="Kapat" variant="secondary" onPress={() => setOpen(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  flex: { flex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.xl,
    gap: spacing.md,
  },
  iosPicker: { alignSelf: 'stretch', height: 180 },
  sheetActions: { gap: spacing.md },
});
