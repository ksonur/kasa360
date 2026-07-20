/**
 * Gider kategorileri — sabit sistem listesi (DATABASE.md seed).
 * Kullanıcı yeni kategori satırı OLUŞTURAMAZ; sadece "Diğer" ile serbest metin
 * etiketi girebilir. Kategori ataması her zaman manueldir.
 */
export interface ExpenseCategory {
  id: string;
  label: string;
  /** Onboarding'de öntanımlı olarak listenin üstünde önerilenler. */
  common?: boolean;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'kira', label: 'Kira', common: true },
  { id: 'elektrik', label: 'Elektrik', common: true },
  { id: 'su', label: 'Su', common: true },
  { id: 'dogalgaz', label: 'Doğalgaz', common: true },
  { id: 'internet', label: 'İnternet', common: true },
  { id: 'telefon', label: 'Telefon', common: true },
  { id: 'abonelikler', label: 'Abonelikler' },
  { id: 'market', label: 'Market / Gıda' },
  { id: 'ulasim', label: 'Ulaşım' },
  { id: 'saglik', label: 'Sağlık' },
  { id: 'egitim', label: 'Eğitim' },
  { id: 'giyim', label: 'Giyim' },
  { id: 'eglence', label: 'Eğlence / Sosyal' },
  { id: 'diger', label: 'Diğer' },
];
