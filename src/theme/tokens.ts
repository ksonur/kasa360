/**
 * Kasa360 Design Tokens
 *
 * Görsel kimlik (PRD): ana palet yeşil + beyaz — sade, güven veren, finansal.
 * Tipografi: IBM Plex Sans (bankacılık/finans için güvenilir, profesyonel).
 * Yoğunluk: dashboard odaklı (8/10) — kompakt ama nefes alan spacing.
 *
 * Tek doğruluk kaynağı budur; feature modülleri renk/spacing için asla ham
 * hex/px kullanmaz, buradaki semantic token'ları tüketir.
 */

/** Ham renk paleti (primitive) — doğrudan UI'da kullanma, semantic üzerinden geç. */
const palette = {
  // Ana yeşil skala (emerald tabanlı, para/büyüme çağrışımı)
  green50: '#E9F7F1',
  green100: '#CFEEE1',
  green200: '#A0DCC4',
  green300: '#6FC8A5',
  green400: '#33A97E',
  green500: '#0E8C63', // brand primary
  green600: '#0A6E4E',
  green700: '#08573E',
  green800: '#063F2D',
  green900: '#04291D',

  white: '#FFFFFF',
  // Yeşil alt tonlu nötr skala (saf gri yerine sıcak-yeşil nötrler)
  neutral0: '#FFFFFF',
  neutral50: '#F5FAF8',
  neutral100: '#EDF3F1',
  neutral200: '#E1EAE7',
  neutral300: '#CBD6D2',
  neutral400: '#9BAAA4',
  neutral500: '#6C7C76',
  neutral600: '#4C5B55',
  neutral700: '#37433E',
  neutral800: '#232D29',
  neutral900: '#131A17',

  // Durum renkleri
  red500: '#DC2626',
  red50: '#FDECEC',
  amber500: '#D97706',
  amber50: '#FDF3E7',
  blue500: '#0369A1',
  blue50: '#E7F1F8',
} as const;

/** Semantic renk token'ları — bileşenler bunları kullanır. */
export const colors = {
  // Marka
  primary: palette.green500,
  primaryDark: palette.green600,
  primaryDarker: palette.green700,
  primaryTint: palette.green50,
  primarySoft: palette.green100,
  onPrimary: palette.white,

  // Yüzeyler
  background: palette.neutral50,
  surface: palette.white,
  surfaceAlt: palette.neutral100,
  surfaceInverse: palette.green800,

  // Metin
  text: palette.neutral900,
  textSecondary: palette.neutral600,
  textMuted: palette.neutral500,
  textInverse: palette.white,
  textOnTint: palette.green700,

  // Çizgi / kenar
  border: palette.neutral200,
  borderStrong: palette.neutral300,

  // Finansal semantik
  income: palette.green500, // gelir / pozitif
  incomeTint: palette.green50,
  expense: palette.red500, // gider / negatif
  expenseTint: palette.red50,

  // Durum
  success: palette.green500,
  warning: palette.amber500,
  warningTint: palette.amber50,
  danger: palette.red500,
  dangerTint: palette.red50,
  info: palette.blue500,
  infoTint: palette.blue50,

  // Yardımcı
  overlay: 'rgba(19, 26, 23, 0.45)',
  transparent: 'transparent',
} as const;

/** 4px tabanlı spacing skalası (density 8/10 — dashboard). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  pill: 999,
} as const;

/** IBM Plex Sans ağırlık ailesi (expo-google-fonts key'leri). */
export const fontFamily = {
  regular: 'IBMPlexSans_400Regular',
  medium: 'IBMPlexSans_500Medium',
  semibold: 'IBMPlexSans_600SemiBold',
  bold: 'IBMPlexSans_700Bold',
} as const;

/** Tipografi ölçeği — base 16px, satır yüksekliği ~1.4-1.5. */
export const typography = {
  display: { fontFamily: fontFamily.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  title: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  heading: { fontFamily: fontFamily.semibold, fontSize: 19, lineHeight: 26, letterSpacing: -0.2 },
  subheading: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 24 },
  callout: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 16 },
  // Parasal tutarlar için (tabular hissi)
  amount: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  amountLg: { fontFamily: fontFamily.bold, fontSize: 40, lineHeight: 46, letterSpacing: -1 },
} as const;

/** Gölge — yeşilimsi, yumuşak (iOS + Android). */
export const shadow = {
  card: {
    shadowColor: palette.green900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  floating: {
    shadowColor: palette.green900,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

/** Dokunma hedefi minimumu (iOS HIG / Android). */
export const touch = {
  minTarget: 44,
} as const;

export type ColorToken = keyof typeof colors;
