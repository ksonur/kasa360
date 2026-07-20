/** Yerel kullanıcı profili — motivasyon / tebrik mesajları için. */
export interface UserLocalProfile {
  /** Görünen ad (zorunlu değil; boşsa e-posta türevi kullanılır). */
  name: string;
  /** Yaş (tam sayı); null = girilmemiş. */
  age: number | null;
  updatedAt: string | null;
}

export interface ProfileState {
  profile: UserLocalProfile;
}

export const EMPTY_PROFILE: UserLocalProfile = {
  name: '',
  age: null,
  updatedAt: null,
};
