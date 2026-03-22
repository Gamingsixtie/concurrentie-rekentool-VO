import type { CitoMigrationPriceRecord } from '../data/cito-migration-prices';
import type { TimeSavingTask } from '../models/migration';
import { TIME_SAVING_TASKS } from '../models/migration';
import { MODULE_CATALOG } from '../models/modules';
import { getTotalStudents } from './price-comparison';

export interface MigrationModuleResult {
  moduleId: string;
  moduleName: string;
  oldPricePerStudent: number;
  newPricePerStudent: number;
  oldTotalCost: number;
  newTotalCost: number;
  /** oldTotalCost - newTotalCost. Positive = new platform is cheaper. */
  annualDifference: number;
}

export interface TimeSavingResult {
  taskId: TimeSavingTask['id'];
  taskLabel: string;
  oldMethodLabel: string;
  newMethodLabel: string;
  hoursPerYear: number;
  valuePerYear: number; // hoursPerYear × hourlyRate
}

export interface MultiYearProjectionEntry {
  year: 1 | 3 | 5;
  cumulativeSavings: number;
}

export interface MigrationResult {
  modules: MigrationModuleResult[];
  totalOldCost: number;
  totalNewCost: number;
  /** totalOldCost - totalNewCost. Positive = new platform is cheaper. */
  financialDifference: number;
  timeSavings: TimeSavingResult[];
  totalTimeSavingsHours: number;
  totalTimeSavingsValue: number;
  /** financialDifference + totalTimeSavingsValue */
  totalAnnualValue: number;
  multiYearProjection: MultiYearProjectionEntry[];
}

/**
 * Pure function: calculate the business case for migrating from old to new Cito platform.
 * Does not modify any external state.
 *
 * @param selectedModules   Module IDs selected by the user
 * @param studentCounts     Student counts per level/year
 * @param migrationPrices   Old vs new Cito prices per module
 * @param timeSavingOverrides  taskId → hours/year override (consultant-entered)
 * @param hourlyRate        Value per hour saved (default: 50)
 */
export function calculateMigration(
  selectedModules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
  migrationPrices: CitoMigrationPriceRecord[],
  timeSavingOverrides: Record<string, number>,
  hourlyRate: number,
): MigrationResult {
  const totalStudents = getTotalStudents(studentCounts);

  const modules: MigrationModuleResult[] = selectedModules
    .map((moduleId) => {
      const priceRecord = migrationPrices.find((p) => p.moduleId === moduleId);
      if (!priceRecord) return null;

      const moduleDef = MODULE_CATALOG.find((m) => m.id === moduleId);
      const moduleName = moduleDef?.name ?? moduleId;

      const oldTotalCost = priceRecord.oldPricePerStudent * totalStudents;
      const newTotalCost = priceRecord.newPricePerStudent * totalStudents;

      return {
        moduleId,
        moduleName,
        oldPricePerStudent: priceRecord.oldPricePerStudent,
        newPricePerStudent: priceRecord.newPricePerStudent,
        oldTotalCost,
        newTotalCost,
        annualDifference: oldTotalCost - newTotalCost,
      };
    })
    .filter((m): m is MigrationModuleResult => m !== null);

  const totalOldCost = modules.reduce((sum, m) => sum + m.oldTotalCost, 0);
  const totalNewCost = modules.reduce((sum, m) => sum + m.newTotalCost, 0);
  const financialDifference = totalOldCost - totalNewCost;

  const timeSavings: TimeSavingResult[] = TIME_SAVING_TASKS.map((task) => {
    const hoursPerYear = timeSavingOverrides[task.id] ?? task.defaultHoursPerYear;
    return {
      taskId: task.id,
      taskLabel: task.label,
      oldMethodLabel: task.oldMethodLabel,
      newMethodLabel: task.newMethodLabel,
      hoursPerYear,
      valuePerYear: hoursPerYear * hourlyRate,
    };
  });

  const totalTimeSavingsHours = timeSavings.reduce((sum, t) => sum + t.hoursPerYear, 0);
  const totalTimeSavingsValue = timeSavings.reduce((sum, t) => sum + t.valuePerYear, 0);
  const totalAnnualValue = financialDifference + totalTimeSavingsValue;

  const multiYearProjection: MultiYearProjectionEntry[] = [
    { year: 1, cumulativeSavings: totalAnnualValue },
    { year: 3, cumulativeSavings: totalAnnualValue * 3 },
    { year: 5, cumulativeSavings: totalAnnualValue * 5 },
  ];

  return {
    modules,
    totalOldCost,
    totalNewCost,
    financialDifference,
    timeSavings,
    totalTimeSavingsHours,
    totalTimeSavingsValue,
    totalAnnualValue,
    multiYearProjection,
  };
}
