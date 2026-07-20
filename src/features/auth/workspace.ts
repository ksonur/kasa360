import { supabase } from '@/lib/supabase';
import type { UserProfile, Workspace, WorkspaceRole } from './types';

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    onboarding_completed: data.onboarding_completed,
  };
}

/** First workspace the user belongs to (personal workspace created by trigger). */
export async function fetchCurrentWorkspace(userId: string): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select(
      `
      role,
      workspace:workspaces (
        id,
        name,
        owner_id
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.workspace) return null;

  const ws = data.workspace as unknown as {
    id: string;
    name: string;
    owner_id: string;
  };

  return {
    id: ws.id,
    name: ws.name,
    owner_id: ws.owner_id,
    role: data.role as WorkspaceRole,
  };
}

/**
 * Trigger creates rows on signup; OTP verify can race slightly.
 * Retry briefly; if still missing, call ensure_user_workspace RPC.
 */
export async function loadProfileAndWorkspace(
  userId: string,
  attempts = 5
): Promise<{ profile: UserProfile | null; workspace: Workspace | null }> {
  let profile: UserProfile | null = null;
  let workspace: Workspace | null = null;

  for (let i = 0; i < attempts; i += 1) {
    profile = await fetchUserProfile(userId);
    workspace = await fetchCurrentWorkspace(userId);
    if (profile && workspace) break;

    if (i === 2) {
      await supabase.rpc('ensure_user_workspace');
    }

    await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }

  return { profile, workspace };
}

/** Kurulum bitince sunucu bayrağını güncelle (AuthGate buna bakar). */
export async function setOnboardingCompleted(
  userId: string,
  completed = true
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('users')
    .update({ onboarding_completed: completed })
    .eq('id', userId);
  return { error: error?.message ?? null };
}
