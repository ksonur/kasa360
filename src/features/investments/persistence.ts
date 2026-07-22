import type { InvestmentsState } from './types';
import { loadDoc, saveDoc } from '@/lib/docs';

const EMPTY: InvestmentsState = {
  movements: [],
  snapshots: [],
};

export async function loadInvestmentsState(): Promise<InvestmentsState> {
  const parsed = await loadDoc<InvestmentsState>('investments', EMPTY, [
    '@kasa360/investments_v1',
  ]);
  return {
    movements: Array.isArray(parsed.movements) ? parsed.movements : [],
    snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
  };
}

export async function saveInvestmentsState(state: InvestmentsState): Promise<void> {
  await saveDoc('investments', state);
}
