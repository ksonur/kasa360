import { query } from '../db.js';

export async function ensureUserWorkspace(userId: string, email: string) {
  const workspaceName =
    email.split('@')[0]?.trim() || 'Kişisel';

  await query(
    `insert into users (id, email) values ($1, $2)
     on conflict (id) do update set email = excluded.email`,
    [userId, email]
  );

  const existing = await query<{ id: string }>(
    `select id from workspace_members where user_id = $1 limit 1`,
    [userId]
  );
  if (existing.rowCount && existing.rowCount > 0) return;

  const ws = await query<{ id: string }>(
    `insert into workspaces (name, owner_id) values ($1, $2) returning id`,
    [workspaceName, userId]
  );
  const workspaceId = ws.rows[0]?.id;
  if (!workspaceId) throw new Error('Workspace create failed');

  await query(
    `insert into workspace_members (workspace_id, user_id, role)
     values ($1, $2, 'owner')`,
    [workspaceId, userId]
  );
}

export async function getProfile(userId: string) {
  const r = await query<{
    id: string;
    email: string;
    onboarding_completed: boolean;
  }>(
    `select id, email, onboarding_completed from users where id = $1`,
    [userId]
  );
  return r.rows[0] ?? null;
}

export async function getWorkspace(userId: string) {
  const r = await query<{
    id: string;
    name: string;
    owner_id: string;
    role: 'owner' | 'member';
  }>(
    `select w.id, w.name, w.owner_id, wm.role
     from workspace_members wm
     join workspaces w on w.id = wm.workspace_id
     where wm.user_id = $1
     order by wm.created_at asc
     limit 1`,
    [userId]
  );
  return r.rows[0] ?? null;
}
