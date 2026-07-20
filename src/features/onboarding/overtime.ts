/** @deprecated Prefer monthlyAmounts — re-export for mevcut importlar. */
export {
  type MonthKey,
  monthKey,
  yearOfKey,
  monthIndexOfKey,
  monthLabelTr,
  keysForYear,
  isYearSeeded,
  seedYearAmount as seedYearOvertime,
  getAmountForMonth as getOvertimeForMonth,
  migrateOvertimeFields,
  migrateSalaryFields,
  seedYearAmount,
  getAmountForMonth,
  migrateToByMonth,
} from './monthlyAmounts';
