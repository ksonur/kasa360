import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AssetsState } from './types';

const STORAGE_KEY = '@kasa360/assets_v1';

const EMPTY: AssetsState = {
  assets: [],
  obligations: [],
};

export async function loadAssetsState(): Promise<AssetsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as AssetsState;
    return {
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      obligations: Array.isArray(parsed.obligations) ? parsed.obligations : [],
    };
  } catch {
    return EMPTY;
  }
}

export async function saveAssetsState(state: AssetsState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
