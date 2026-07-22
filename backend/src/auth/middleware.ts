import type { Context, Next } from 'hono';
import { verifyAccessToken } from './jwt.js';

export type AuthEnv = {
  Variables: {
    userId: string;
    email: string;
  };
};

export async function requireAuth(c: Context<AuthEnv>, next: Next) {
  const header = c.req.header('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  try {
    const payload = await verifyAccessToken(match[1]!);
    c.set('userId', payload.sub);
    c.set('email', payload.email);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
}
