import { Hono } from 'hono';
import type { AuthEnv } from '../auth/middleware.js';
import { requireAuth } from '../auth/middleware.js';
import { getWorkspaceIdForUser } from '../auth/workspaceContext.js';
import { query } from '../db.js';

const DOC_KEYS = new Set([
  'onboarding',
  'finance',
  'cards',
  'investments',
  'goals',
  'assets',
  'notification_prefs',
  'notifications',
  'profile',
]);

export const syncRoutes = new Hono<AuthEnv>();

syncRoutes.use('*', requireAuth);

async function workspaceOr403(userId: string) {
  const workspaceId = await getWorkspaceIdForUser(userId);
  return workspaceId;
}

/** Tüm dokümanları tek seferde (hydrate). */
syncRoutes.get('/docs', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await workspaceOr403(userId);
  if (!workspaceId) return c.json({ error: 'Workspace yok' }, 403);

  const r = await query<{ doc_key: string; payload: unknown; updated_at: string }>(
    `select doc_key, payload, updated_at from workspace_docs where workspace_id = $1`,
    [workspaceId]
  );

  const docs: Record<string, unknown> = {};
  for (const row of r.rows) {
    docs[row.doc_key] = row.payload;
  }

  return c.json({ workspaceId, docs });
});

syncRoutes.get('/docs/:key', async (c) => {
  const key = c.req.param('key');
  if (!DOC_KEYS.has(key)) return c.json({ error: 'Geçersiz doc_key' }, 400);

  const userId = c.get('userId');
  const workspaceId = await workspaceOr403(userId);
  if (!workspaceId) return c.json({ error: 'Workspace yok' }, 403);

  const r = await query<{ payload: unknown; updated_at: string }>(
    `select payload, updated_at from workspace_docs
     where workspace_id = $1 and doc_key = $2`,
    [workspaceId, key]
  );

  if (!r.rows[0]) {
    return c.json({ key, payload: null, updatedAt: null });
  }

  return c.json({
    key,
    payload: r.rows[0].payload,
    updatedAt: r.rows[0].updated_at,
  });
});

syncRoutes.put('/docs/:key', async (c) => {
  const key = c.req.param('key');
  if (!DOC_KEYS.has(key)) return c.json({ error: 'Geçersiz doc_key' }, 400);

  const userId = c.get('userId');
  const workspaceId = await workspaceOr403(userId);
  if (!workspaceId) return c.json({ error: 'Workspace yok' }, 403);

  const body = await c.req.json().catch(() => null);
  if (body === null || typeof body !== 'object') {
    return c.json({ error: 'JSON body gerekli' }, 400);
  }

  // body = { payload: ... } veya doğrudan payload
  const payload =
    body && typeof body === 'object' && 'payload' in body
      ? (body as { payload: unknown }).payload
      : body;

  if (payload === null) {
    await query(
      `delete from workspace_docs where workspace_id = $1 and doc_key = $2`,
      [workspaceId, key]
    );
    return c.json({ key, updatedAt: null, deleted: true });
  }

  const r = await query<{ updated_at: string }>(
    `insert into workspace_docs (workspace_id, doc_key, payload)
     values ($1, $2, $3::jsonb)
     on conflict (workspace_id, doc_key)
     do update set payload = excluded.payload, updated_at = now()
     returning updated_at`,
    [workspaceId, key, JSON.stringify(payload)]
  );

  // Profil dokümanı users tablosuna da yansısın
  if (key === 'profile' && payload && typeof payload === 'object') {
    const p = payload as { name?: string; age?: number | null };
    await query(
      `update users set
         display_name = coalesce($2, display_name),
         age = $3
       where id = $1`,
      [userId, p.name ?? null, p.age ?? null]
    );
  }

  return c.json({
    key,
    updatedAt: r.rows[0]?.updated_at ?? null,
  });
});
