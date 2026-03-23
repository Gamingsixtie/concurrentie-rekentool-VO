/**
 * JIJ! (Bureau ICE) license tier pricing model for VO.
 *
 * JIJ! uses a fundamentally different pricing model than Cito and DIA:
 * a fixed annual license fee + a per-test-administration fee.
 *
 * Base data: deskresearch MediaTest juni 2024 (R-5043), in opdracht van Cito.
 * Bron: Concurrentieanalyse Leerling in beeld VO, tabel 3b (pagina 13).
 *
 * BELANGRIJK: Dit zijn 2024-tarieven. Werkelijke 2025-2026 tarieven kunnen
 * afwijken. Neem contact op met Bureau ICE voor actuele tarieven.
 */

export interface JijLicenseTier {
  tier: 1 | 2 | 3 | 4;
  label: string;
  annualFee: number;
  pricePerTest: number;
  minAdministrations: number;
  maxAdministrations: number;
  schoolExamPrice: number;
  magisterSomtodayFee: number;
}

export const JIJ_LICENSE_TIERS: JijLicenseTier[] = [
  {
    tier: 1,
    label: 'Licentie 1 (groot — 4.001+ afnames)',
    annualFee: 5330,
    pricePerTest: 2.40,
    minAdministrations: 4001,
    maxAdministrations: 13000,
    schoolExamPrice: 5.80,
    magisterSomtodayFee: 500,
  },
  {
    tier: 2,
    label: 'Licentie 2 (middelgroot — 2.501-4.000 afnames)',
    annualFee: 2815,
    pricePerTest: 3.05,
    minAdministrations: 2501,
    maxAdministrations: 4000,
    schoolExamPrice: 5.80,
    magisterSomtodayFee: 500,
  },
  {
    tier: 3,
    label: 'Licentie 3 (klein — 166-2.500 afnames)',
    annualFee: 975,
    pricePerTest: 3.75,
    minAdministrations: 166,
    maxAdministrations: 2500,
    schoolExamPrice: 5.80,
    magisterSomtodayFee: 500,
  },
  {
    tier: 4,
    label: 'Licentie 4 (zeer klein — 0-165 afnames)',
    annualFee: 290,
    pricePerTest: 7.90,
    minAdministrations: 0,
    maxAdministrations: 165,
    schoolExamPrice: 5.80,
    magisterSomtodayFee: 195,
  },
];

/**
 * Calculate estimated JIJ! cost per student per year for a given school size.
 *
 * Assumptions:
 * - 2 test administrations per student per year (nul- en volgmeting)
 * - License tier selected based on total administrations
 * - Excludes Magister/SomToday koppeling and school exams
 */
export function estimateJijCostPerStudent(
  totalStudents: number,
  testsPerStudent: number = 2,
): { costPerStudent: number; tier: JijLicenseTier } {
  const totalAdministrations = totalStudents * testsPerStudent;

  // Select the matching tier based on total administrations
  const tier =
    JIJ_LICENSE_TIERS.find(
      (t) =>
        totalAdministrations >= t.minAdministrations &&
        totalAdministrations <= t.maxAdministrations,
    ) ?? JIJ_LICENSE_TIERS[JIJ_LICENSE_TIERS.length - 1]; // fallback to smallest

  const licenseCostPerStudent = tier.annualFee / totalStudents;
  const testCostPerStudent = testsPerStudent * tier.pricePerTest;
  const costPerStudent = licenseCostPerStudent + testCostPerStudent;

  return { costPerStudent: Math.round(costPerStudent * 100) / 100, tier };
}
