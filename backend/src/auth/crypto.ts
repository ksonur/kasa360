import { createHash, randomInt, randomBytes } from 'node:crypto';

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}
