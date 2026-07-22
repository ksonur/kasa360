import type { OnboardingState } from './types';
import { migrateOvertimeFields, migrateSalaryFields } from './monthlyAmounts';
import { clearDoc, loadDoc, saveDoc } from '@/lib/docs';

export type OnboardingStep =
  | 'income'
  | 'expenses'
  | 'cards'
  | 'investments'
  | 'summary';

export interface OnboardingDraft {
  data: OnboardingState;
  completed: boolean;
  currentStep: OnboardingStep;
}

export const STEP_ROUTES = {
  income: '/onboarding/income',
  expenses: '/onboarding/expenses',
  cards: '/onboarding/cards',
  investments: '/onboarding/investments',
  summary: '/onboarding/summary',
} as const satisfies Record<OnboardingStep, `/${string}`>;

type LegacyData = OnboardingState & {
  salary?: number;
  overtime?: number;
};

function normalizeData(raw: LegacyData): OnboardingState {
  const {
    salary: _s,
    overtime: _o,
    salaryByMonth: _sb,
    overtimeByMonth: _ob,
    ...rest
  } = raw as LegacyData & {
    salaryByMonth?: Record<string, number>;
    overtimeByMonth?: Record<string, number>;
  };

  return {
    ...rest,
    email: raw.email ?? '',
    salaryByMonth: migrateSalaryFields(raw),
    overtimeByMonth: migrateOvertimeFields(raw),
    routineExpenses: raw.routineExpenses ?? [],
    cards: raw.cards ?? [],
    investments: raw.investments ?? [],
  };
}

const EMPTY: OnboardingDraft | null = null;

export async function loadDraft(): Promise<OnboardingDraft | null> {
  const parsed = await loadDoc<OnboardingDraft | null>(
    'onboarding',
    EMPTY,
    ['@kasa360/onboarding_draft_v1']
  );
  if (!parsed?.data || typeof parsed.completed !== 'boolean') return null;
  return {
    data: normalizeData(parsed.data as LegacyData),
    completed: parsed.completed,
    currentStep: parsed.currentStep ?? 'income',
  };
}

export async function saveDraft(draft: OnboardingDraft): Promise<void> {
  await saveDoc('onboarding', draft);
}

export async function clearDraft(): Promise<void> {
  await clearDoc('onboarding');
}
