import type { ComparisonResult } from '@/engine/price-comparison';
import type { MigrationResult } from '@/engine/migration';

export type ReportType = 'prijsvergelijking' | 'waarderapport' | 'gecombineerd';

export type DmuTarget = 'coordinator' | 'mt' | 'finance' | 'generiek';

export interface ExportConfig {
  reportType: ReportType;
  dmuTarget: DmuTarget;
}

export interface ReportData {
  schoolName: string;
  date: string;
  selectedModules: string[];
  totalStudents: number;
  comparison: ComparisonResult | null;
  migration: MigrationResult | null;
  priceDifference: number | null;
}
