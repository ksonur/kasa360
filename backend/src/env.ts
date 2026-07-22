function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 3600),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  smtp: {
    host: required('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: required('SMTP_USER'),
    pass: required('SMTP_PASS'),
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'Kasa360',
  },
};
