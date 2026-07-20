export { colors, spacing, radius, typography, fontFamily, shadow, touch } from './tokens';
export type { ColorToken } from './tokens';

import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';

/** Uygulama açılışında expo-font ile yüklenecek font haritası. */
export const appFonts = {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} as const;

/** Türkçe para biçimi — ₺1.234,56 (numeric string / number kabul eder). */
export function formatCurrency(
  value: number,
  options: { showSymbol?: boolean; maximumFractionDigits?: number } = {}
): string {
  const { showSymbol = true, maximumFractionDigits = 0 } = options;
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0);
  return showSymbol ? `₺${formatted}` : formatted;
}
