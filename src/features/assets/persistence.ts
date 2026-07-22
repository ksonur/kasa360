import type { AssetsState } from './types';
import { loadDoc, saveDoc } from '@/lib/docs';

const EMPTY: AssetsState = {
  assets: [],
  obligations: [],
};

export async function loadAssetsState(): Promise<AssetsState> {
  const parsed = await loadDoc<AssetsState>('assets', EMPTY, [
    '@kasa360/assets_v1',
  ]);
  return {
    assets: Array.isArray(parsed.assets) ? parsed.assets : [],
    obligations: Array.isArray(parsed.obligations) ? parsed.obligations : [],
  };
}

export async function saveAssetsState(state: AssetsState): Promise<void> {
  await saveDoc('assets', state);
}
