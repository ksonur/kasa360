import { Redirect } from 'expo-router';

/** Eski rota — aylık gelir düzenleyiciye yönlendir. */
export default function OvertimeRedirect() {
  return <Redirect href="/income/monthly" />;
}
