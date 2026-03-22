/**
 * JIJ! (Bureau ICE) license tier pricing model for VO.
 *
 * JIJ! uses a fundamentally different pricing model than Cito and DIA:
 * a fixed annual license fee + a per-test-administration fee.
 *
 * Base data: schooljaar 2022-2023 (Bureau ICE prijslijst).
 * Inflation-corrected to 2025-2026 using CBS CPI:
 *   2023: +3,8%, 2024: +3,3%, 2025: +3,3% → cumulative factor 1,1076.
 *
 * BELANGRIJK: Deze prijzen zijn schattingen op basis van inflatiecorrectie.
 * Werkelijke prijzen voor 2025-2026 kunnen afwijken.
 * Neem contact op met Bureau ICE voor actuele tarieven.
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

const INFLATION_FACTOR = 1.1076; // CBS CPI 22-23 → 25-26

/**
 * Round to nearest 5 cents for realistic pricing.
 */
function inflationAdjust(amount: number): number {
  return Math.round(amount * INFLATION_FACTOR * 20) / 20;
}

export const JIJ_LICENSE_TIERS: JijLicenseTier[] = [
  {
    tier: 1,
    label: 'Licentie 1 (groot — 4.000+ afnames)',
    annualFee: Math.round(4740 * INFLATION_FACTOR),
    pricePerTest: inflationAdjust(2.10),
    minAdministrations: 4000,
    maxAdministrations: 13000,
    schoolExamPrice: inflationAdjust(5.15),
    magisterSomtodayFee: Math.round(445 * INFLATION_FACTOR),
  },
  {
    tier: 2,
    label: 'Licentie 2 (middelgroot — 2.500-4.000 afnames)',
    annualFee: Math.round(2480 * INFLATION_FACTOR),
    pricePerTest: inflationAdjust(2.70),
    minAdministrations: 2500,
    maxAdministrations: 4000,
    schoolExamPrice: inflationAdjust(5.15),
    magisterSomtodayFee: Math.round(445 * INFLATION_FACTOR),
  },
  {
    tier: 3,
    label: 'Licentie 3 (klein — 165-2.500 afnames)',
    annualFee: Math.round(865 * INFLATION_FACTOR),
    pricePerTest: inflationAdjust(3.35),
    minAdministrations: 165,
    maxAdministrations: 2500,
    schoolExamPrice: inflationAdjust(5.15),
    magisterSomtodayFee: Math.round(445 * INFLATION_FACTOR),
  },
  {
    tier: 4,
    label: 'Licentie 4 (zeer klein — 0-165 afnames)',
    annualFee: Math.round(255 * INFLATION_FACTOR),
    pricePerTest: inflationAdjust(7.05),
    minAdministrations: 0,
    maxAdministrations: 165,
    schoolExamPrice: inflationAdjust(5.15),
    magisterSomtodayFee: Math.round(170 * INFLATION_FACTOR),
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
