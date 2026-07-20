import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_PROFILE, type ProfileState, type UserLocalProfile } from './types';

const STORAGE_KEY = '@kasa360/profile_v1';

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
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { profile: { ...EMPTY_PROFILE } };
    const parsed = JSON.parse(raw) as Partial<ProfileState>;
    return { profile: normalize(parsed.profile ?? (parsed as Partial<UserLocalProfile>)) };
  } catch {
    return { profile: { ...EMPTY_PROFILE } };
  }
}

export async function saveProfileState(state: ProfileState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
