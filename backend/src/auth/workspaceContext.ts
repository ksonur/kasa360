import { query } from '../db.js';

export async function getWorkspaceIdForUser(userId: string): Promise<string | null> {
  const r = await query<{ workspace_id: string }>(
    `select workspace_id from workspace_members
     where user_id = $1
     order by created_at asc
     limit 1`,
    [userId]
  );
  return r.rows[0]?.workspace_id ?? null;
}
