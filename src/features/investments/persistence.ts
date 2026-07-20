import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InvestmentsState } from './types';

const STORAGE_KEY = '@kasa360/investments_v1';

const EMPTY: InvestmentsState = {
  movements: [],
  snapshots: [],
};

export async function loadInvestmentsState(): Promise<InvestmentsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as InvestmentsState;
    return {
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
    };
  } catch {
    return EMPTY;
  }
}

export async function saveInvestmentsState(state: InvestmentsState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
