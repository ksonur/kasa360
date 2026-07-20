export interface RoutineExpenseDraft {
  categoryId: string;
  customLabel?: string;
  amount: number;
  statementDay: number | null;
  dueDay: number | null;
}

export interface CreditCardDraft {
  id: string;
  name: string;
  limit: number;
  statementDay: number | null;
  dueDay: number | null;
}

export interface InvestmentDraft {
  id: string;
  platform: string;
  balance: number;
}

export interface OnboardingState {
  email: string;
  /**
   * Ay bazlı net maaş. Key: YYYY-MM.
   * İlk girişte yılın 12 ayına yazılır; sonra ay ay düzenlenir.
   */
  salaryByMonth: Record<string, number>;
  /**
   * Ay bazlı mesai. Key: YYYY-MM.
   * İlk girişte yılın 12 ayına yazılır; sonra ay ay düzenlenir.
   */
  overtimeByMonth: Record<string, number>;
  routineExpenses: RoutineExpenseDraft[];
  cards: CreditCardDraft[];
  investments: InvestmentDraft[];
}
