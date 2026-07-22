import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env.js';

const secret = new TextEncoder().encode(env.jwtSecret);

export type AccessPayload = {
  sub: string;
  email: string;
};

export async function signAccessToken(payload: AccessPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessPayload> {
  const { payload } = await jwtVerify(token, secret);
  const sub = payload.sub;
  const email = payload.email;
  if (!sub || typeof email !== 'string') {
    throw new Error('Invalid token');
  }
  return { sub, email };
}
