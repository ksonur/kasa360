import { EMPTY_PROFILE, type ProfileState, type UserLocalProfile } from './types';
import { loadDoc, saveDoc } from '@/lib/docs';

function normalize(raw: Partial<UserLocalProfile> | null): UserLocalProfile {
  const age =
    typeof raw?.age === 'number' &&
    Number.isFinite(raw.age) &&
    raw.age >= 1 &&
    raw.age <= 120
      ? Math.round(raw.age)
      : null;
  return {
    name: typeof raw?.name === 'string' ? raw.name.trim() : '',
    age,
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

export async function loadProfileState(): Promise<ProfileState> {
  const parsed = await loadDoc<Partial<ProfileState> | Partial<UserLocalProfile>>(
    'profile',
    { profile: { ...EMPTY_PROFILE } },
    ['@kasa360/profile_v1']
  );
  const profile =
    parsed && typeof parsed === 'object' && 'profile' in parsed
      ? normalize((parsed as ProfileState).profile)
      : normalize(parsed as Partial<UserLocalProfile>);
  return { profile };
}

export async function saveProfileState(state: ProfileState): Promise<void> {
  await saveDoc('profile', state);
}
