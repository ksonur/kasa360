import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { loadProfileState, saveProfileState } from './persistence';
import { EMPTY_PROFILE, type UserLocalProfile } from './types';

interface UpdateProfileInput {
  name: string;
  age: number | null;
}

interface ProfileContextValue {
  profile: UserLocalProfile;
  hydrating: boolean;
  updateProfile: (input: UpdateProfileInput) => void;
  /** Selamlama için: profil adı veya fallback. */
  displayName: (fallback?: string) => string;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 300;

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserLocalProfile>({ ...EMPTY_PROFILE });
  const [hydrating, setHydrating] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let mounted = true;
    loadProfileState().then((s) => {
      if (!mounted) return;
      setProfile(s.profile);
      setHydrating(false);
    });
    return () => {
      mounted = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (hydrating) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveProfileState({ profile });
    }, SAVE_DEBOUNCE_MS);
  }, [profile, hydrating]);

  const updateProfile = useCallback((input: UpdateProfileInput) => {
    const name = input.name.trim();
    const age =
      input.age != null &&
      Number.isFinite(input.age) &&
      input.age >= 1 &&
      input.age <= 120
        ? Math.round(input.age)
        : null;
    setProfile({
      name,
      age,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const displayName = useCallback(
    (fallback = 'Kullanıcı') => {
      const n = profile.name.trim();
      return n.length > 0 ? n : fallback;
    },
    [profile.name]
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      hydrating,
      updateProfile,
      displayName,
    }),
    [profile, hydrating, updateProfile, displayName]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile, ProfileProvider içinde kullanılmalı');
  return ctx;
}
