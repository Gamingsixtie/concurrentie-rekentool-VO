export interface DiaPackage {
  id: string;
  name: string;
  includedModuleIds: string[];
  pricePerStudent: number;
  minModules: number;
}

export interface DiaPackageResult {
  selectedPackage: DiaPackage | null;
  totalCost: number;
  individualTotal: number;
  savings: number;
  coveredModuleIds: string[];
}
