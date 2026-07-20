/**
 * Geçici geliştirme bayrağı: e-posta OTP ve session zorunluluğunu kapatır.
 * Production / gerçek auth için .env içinde EXPO_PUBLIC_AUTH_BYPASS=false yap.
 */
export const AUTH_BYPASS = process.env.EXPO_PUBLIC_AUTH_BYPASS !== 'false';
