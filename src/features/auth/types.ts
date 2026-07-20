export type WorkspaceRole = 'owner' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  onboarding_completed: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  role: WorkspaceRole;
}
