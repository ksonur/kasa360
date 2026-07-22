import { Hono } from 'hono';
import { z } from 'zod';
import { query } from '../db.js';
import { env } from '../env.js';
import { sendOtpEmail } from '../mail.js';
import {
  generateOtpCode,
  generateRefreshToken,
  hashToken,
} from './crypto.js';
import { signAccessToken } from './jwt.js';
import { requireAuth, type AuthEnv } from './middleware.js';
import {
  ensureUserWorkspace,
  getProfile,
  getWorkspace,
} from './workspace.js';

const emailSchema = z.string().email().transform((e) => e.trim().toLowerCase());

export const authRoutes = new Hono<AuthEnv>();

authRoutes.post('/otp/request', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = emailSchema.safeParse(body.email);
  if (!parsed.success) {
    return c.json({ error: 'Geçerli bir e-posta gir' }, 400);
  }
  const email = parsed.data;
  const code = generateOtpCode();
  const codeHash = hashToken(code);
  const expiresAt = new Date(Date.now() + env.otpTtlSeconds * 1000);

  await query(`update auth_otps set consumed_at = now()
    where email = $1 and consumed_at is null`, [email]);

  await query(
    `insert into auth_otps (email, code_hash, expires_at) values ($1, $2, $3)`,
    [email, codeHash, expiresAt.toISOString()]
  );

  try {
    await sendOtpEmail(email, code);
  } catch (e) {
    console.error('[mail]', e);
    return c.json({ error: 'E-posta gönderilemedi' }, 502);
  }

  return c.json({ ok: true });
});

authRoutes.post('/otp/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const emailParsed = emailSchema.safeParse(body.email);
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!emailParsed.success || !/^\d{6}$/.test(code)) {
    return c.json({ error: 'E-posta veya kod geçersiz' }, 400);
  }
  const email = emailParsed.data;
  const codeHash = hashToken(code);

  const otp = await query<{ id: string }>(
    `select id from auth_otps
     where email = $1 and code_hash = $2 and consumed_at is null
       and expires_at > now()
     order by created_at desc
     limit 1`,
    [email, codeHash]
  );
  if (!otp.rows[0]) {
    return c.json({ error: 'Kod hatalı veya süresi dolmuş' }, 401);
  }

  await query(`update auth_otps set consumed_at = now() where id = $1`, [
    otp.rows[0].id,
  ]);

  let user = await query<{ id: string; email: string }>(
    `select id, email from users where email = $1`,
    [email]
  );
  if (!user.rows[0]) {
    user = await query<{ id: string; email: string }>(
      `insert into users (email) values ($1) returning id, email`,
      [email]
    );
  }
  const userId = user.rows[0]!.id;
  await ensureUserWorkspace(userId, email);

  const accessToken = await signAccessToken({ sub: userId, email });
  const refreshToken = generateRefreshToken();
  const refreshHash = hashToken(refreshToken);
  const refreshExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await query(
    `insert into auth_refresh_tokens (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [userId, refreshHash, refreshExp.toISOString()]
  );

  const profile = await getProfile(userId);
  const workspace = await getWorkspace(userId);

  return c.json({
    accessToken,
    refreshToken,
    expiresIn: 900,
    user: profile,
    workspace,
  });
});

authRoutes.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const refreshToken =
    typeof body.refreshToken === 'string' ? body.refreshToken : '';
  if (!refreshToken) {
    return c.json({ error: 'refreshToken gerekli' }, 400);
  }
  const tokenHash = hashToken(refreshToken);
  const row = await query<{ user_id: string; email: string }>(
    `select r.user_id, u.email
     from auth_refresh_tokens r
     join users u on u.id = r.user_id
     where r.token_hash = $1 and r.revoked_at is null and r.expires_at > now()`,
    [tokenHash]
  );
  if (!row.rows[0]) {
    return c.json({ error: 'Oturum geçersiz' }, 401);
  }

  const accessToken = await signAccessToken({
    sub: row.rows[0].user_id,
    email: row.rows[0].email,
  });
  return c.json({ accessToken, expiresIn: 900 });
});

authRoutes.post('/logout', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const refreshToken =
    typeof body.refreshToken === 'string' ? body.refreshToken : '';
  if (refreshToken) {
    await query(
      `update auth_refresh_tokens set revoked_at = now()
       where token_hash = $1`,
      [hashToken(refreshToken)]
    );
  }
  return c.json({ ok: true });
});

authRoutes.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const email = c.get('email');
  await ensureUserWorkspace(userId, email);
  const profile = await getProfile(userId);
  const workspace = await getWorkspace(userId);
  if (!profile) {
    return c.json({ error: 'Kullanıcı yok' }, 404);
  }
  return c.json({ user: profile, workspace });
});

authRoutes.patch('/me/onboarding', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => ({}));
  const completed = body.completed !== false;
  await query(
    `update users set onboarding_completed = $2 where id = $1`,
    [userId, completed]
  );
  const profile = await getProfile(userId);
  return c.json({ user: profile });
});
