import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';
import {
  AmountField,
  Button,
  CategoryChip,
  DayStrip,
  Screen,
  StepHeader,
  Text,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/theme';
import { EXPENSE_CATEGORIES } from '@/features/onboarding/categories';
import {
  RoutineExpenseDraft,
  totalRoutineExpense,
  useOnboarding,
} from '@/features/onboarding/store';
import { categoryLabel } from '@/features/onboarding/deriveDashboard';

type Mode = 'list' | 'add' | 'edit';

export default function RoutinesScreen() {
  const { data, setRoutineExpenses } = useOnboarding();
  const [map, setMap] = useState<Record<string, RoutineExpenseDraft>>(() =>
    Object.fromEntries(data.routineExpenses.map((e) => [e.categoryId, e]))
  );
  const [mode, setMode] = useState<Mode>('list');
  const [editId, setEditId] = useState<string | null>(null);
  /** Ekleme modunda seçilen yeni kategoriler (henüz listede olmayanlar). */
  const [addSelection, setAddSelection] = useState<Record<string, RoutineExpenseDraft>>({});

  const selectedIds = useMemo(
    () => EXPENSE_CATEGORIES.filter((c) => map[c.id]).map((c) => c.id),
    [map]
  );

  const availableToAdd = EXPENSE_CATEGORIES.filter((c) => !map[c.id]);

  function syncFromStore() {
    setMap(Object.fromEntries(data.routineExpenses.map((e) => [e.categoryId, e])));
  }

  function persist(next: Record<string, RoutineExpenseDraft>) {
    setMap(next);
    setRoutineExpenses(Object.values(next));
  }

  function remove(categoryId: string) {
    Alert.alert('Gideri kaldır', 'Bu rutin gider listeden silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          const next = { ...map };
          delete next[categoryId];
          persist(next);
        },
      },
    ]);
  }

  function openEdit(categoryId: string) {
    setEditId(categoryId);
    setMode('edit');
  }

  function openAdd() {
    setAddSelection({});
    setMode('add');
  }

  function backToList() {
    syncFromStore();
    setEditId(null);
    setAddSelection({});
    setMode('list');
  }

  function updateEdit(patch: Partial<RoutineExpenseDraft>) {
    if (!editId) return;
    setMap((prev) => ({
      ...prev,
      [editId]: { ...prev[editId], ...patch },
    }));
  }

  function saveEdit() {
    if (!editId || !map[editId]) return;
    persist({ ...map });
    setEditId(null);
    setMode('list');
  }

  function toggleAdd(categoryId: string) {
    setAddSelection((prev) => {
      const next = { ...prev };
      if (next[categoryId]) delete next[categoryId];
      else next[categoryId] = { categoryId, amount: 0, statementDay: null, dueDay: null };
      return next;
    });
  }

  function updateAdd(categoryId: string, patch: Partial<RoutineExpenseDraft>) {
    setAddSelection((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], ...patch },
    }));
  }

  function saveAdd() {
    const next = { ...map, ...addSelection };
    persist(next);
    setAddSelection({});
    setMode('list');
  }

  if (mode === 'edit' && editId && map[editId]) {
    const draft = map[editId];
    const cat = EXPENSE_CATEGORIES.find((c) => c.id === editId);
    return (
      <Screen
        scroll
        footer={<Button label="Kaydet" onPress={saveEdit} />}
      >
        <StepHeader
          title="Gideri düzenle"
          subtitle={categoryLabel(editId, draft.customLabel)}
          onBack={backToList}
        />
        <View style={styles.form}>
          {editId === 'diger' ? (
            <TextInput
              style={styles.textInput}
              value={draft.customLabel ?? ''}
              onChangeText={(t) => updateEdit({ customLabel: t })}
              placeholder="Gider adı"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text variant="subheading">{cat?.label}</Text>
          )}
          <AmountField
            label="Aylık tutar"
            value={draft.amount}
            onChange={(v) => updateEdit({ amount: v })}
          />
          <DayStrip
            label="Kesim günü"
            value={draft.statementDay}
            onChange={(d) => updateEdit({ statementDay: d })}
          />
          <DayStrip
            label="Son ödeme günü"
            value={draft.dueDay}
            onChange={(d) => updateEdit({ dueDay: d })}
          />
        </View>
      </Screen>
    );
  }

  if (mode === 'add') {
    const addIds = Object.keys(addSelection);
    const addTotal = Object.values(addSelection).reduce((s, e) => s + e.amount, 0);
    return (
      <Screen
        scroll
        footer={
          <View style={styles.footer}>
            {addIds.length > 0 ? (
              <View style={styles.footerSummary}>
                <Text variant="caption" color={colors.textMuted}>
                  {addIds.length} yeni gider
                </Text>
                <Text variant="subheading" color={colors.expense}>
                  {formatCurrency(addTotal)}
                </Text>
              </View>
            ) : null}
            <Button
              label="Ekle"
              disabled={addIds.length === 0}
              onPress={saveAdd}
            />
          </View>
        }
      >
        <StepHeader
          title="Rutin gider ekle"
          subtitle="Listeden seç, tutar ve günleri gir."
          onBack={backToList}
        />

        {availableToAdd.length === 0 ? (
          <Text variant="callout" color={colors.textMuted} style={styles.empty}>
            Eklenebilecek kategori kalmadı.
          </Text>
        ) : (
          <>
            <View style={styles.chips}>
              {availableToAdd.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  label={cat.label}
                  selected={!!addSelection[cat.id]}
                  onPress={() => toggleAdd(cat.id)}
                />
              ))}
            </View>
            {addIds.length > 0 ? (
              <View style={styles.details}>
                {availableToAdd
                  .filter((c) => addSelection[c.id])
                  .map((cat) => {
                    const draft = addSelection[cat.id];
                    return (
                      <View key={cat.id} style={styles.detailCard}>
                        <Text variant="subheading">{cat.label}</Text>
                        {cat.id === 'diger' ? (
                          <TextInput
                            style={styles.textInput}
                            value={draft.customLabel ?? ''}
                            onChangeText={(t) => updateAdd(cat.id, { customLabel: t })}
                            placeholder="Gider adı"
                            placeholderTextColor={colors.textMuted}
                          />
                        ) : null}
                        <AmountField
                          label="Aylık tutar"
                          value={draft.amount}
                          onChange={(v) => updateAdd(cat.id, { amount: v })}
                        />
                        <DayStrip
                          label="Kesim günü"
                          value={draft.statementDay}
                          onChange={(d) => updateAdd(cat.id, { statementDay: d })}
                        />
                        <DayStrip
                          label="Son ödeme günü"
                          value={draft.dueDay}
                          onChange={(d) => updateAdd(cat.id, { dueDay: d })}
                        />
                      </View>
                    );
                  })}
              </View>
            ) : null}
          </>
        )}
      </Screen>
    );
  }

  // --- Liste ---
  return (
    <Screen scroll>
      <StepHeader
        title="Rutin giderler"
        subtitle="Her ay tekrarlayan giderlerin. Değişiklikler panele yansır."
        onBack={() => router.back()}
      />

      <View style={styles.summary}>
        <Text variant="label" color={colors.textMuted}>
          AYLIK TOPLAM
        </Text>
        <Text variant="amountLg" color={colors.expense}>
          {formatCurrency(
            totalRoutineExpense({ ...data, routineExpenses: Object.values(map) })
          )}
        </Text>
      </View>

      <View style={styles.listHeader}>
        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Rutin gider ekle"
        >
          <Plus size={22} color={colors.onPrimary} />
        </Pressable>
        <Text variant="callout" color={colors.textSecondary} style={styles.flex}>
          Yeni rutin gider ekle
        </Text>
      </View>

      {selectedIds.length === 0 ? (
        <Text variant="callout" color={colors.textMuted} style={styles.empty}>
          Henüz rutin gider yok. Yukarıdaki + ile ekleyebilirsin.
        </Text>
      ) : (
        <View style={styles.list}>
          {EXPENSE_CATEGORIES.filter((c) => map[c.id]).map((cat) => {
            const e = map[cat.id];
            return (
              <View key={cat.id} style={styles.row}>
                <View style={styles.flex}>
                  <Text variant="subheading">
                    {categoryLabel(cat.id, e.customLabel)}
                  </Text>
                  <Text variant="caption" color={colors.textMuted}>
                    {e.dueDay != null
                      ? `Son ödeme: ayın ${e.dueDay}. günü`
                      : 'Son ödeme günü yok'}
                  </Text>
                </View>
                <Text variant="subheading" color={colors.expense}>
                  {formatCurrency(e.amount)}
                </Text>
                <Pressable
                  onPress={() => openEdit(cat.id)}
                  hitSlop={8}
                  accessibilityLabel="Düzenle"
                  style={styles.iconBtn}
                >
                  <Pencil size={18} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => remove(cat.id)}
                  hitSlop={8}
                  accessibilityLabel="Sil"
                  style={styles.iconBtn}
                >
                  <Trash2 size={18} color={colors.danger} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: {
    marginTop: spacing['2xl'],
    backgroundColor: colors.expenseTint,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
  empty: { marginTop: spacing.lg },
  list: { marginTop: spacing.md, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  iconBtn: { padding: spacing.xs },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
  },
  details: { gap: spacing.md, marginTop: spacing['2xl'] },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  form: { gap: spacing.md, marginTop: spacing['2xl'] },
  textInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    minHeight: 52,
  },
  footer: { gap: spacing.md },
  footerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
