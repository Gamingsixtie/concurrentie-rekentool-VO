/**
 * AI-powered competitive analysis.
 * Generates a structured 6-section analysis of Cito vs. competitors,
 * optionally enriched with schoolplan data. Calls /api/ai-analysis
 * which uses tool_use for guaranteed structured output.
 */

import type { ComparisonResult } from '../engine/price-comparison';
import { getTotalStudents } from '../engine/price-comparison';
import { MODULE_DIFFERENTIATORS } from '../data/differentiators';
import { getDiaVolumeDiscountPercent } from '../engine/dia-packages';
import { estimateJijCostPerStudent } from '../data/jij-license-tiers';
import type { DiaPackageResult } from '../models/dia-packages';
import type { ModuleCurrentSetup, SchoolLevel } from '../models/school';
import type { CurrentVsProposedResult } from '../engine/current-vs-proposed';
import type { SchoolplanAnalysisRow } from '@/db/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PrijsAnalyseItem {
  module: string;
  vergelijking: string;
  citoPositie: 'goedkoper' | 'duurder' | 'vergelijkbaar';
}

export interface ConcurrentDetail {
  provider: 'dia' | 'jij';
  citoBeter: string[];
  concurrentBeter: string[];
  weerlegging: string[];
}

export interface SchoolplanKoppeling {
  thema: string;
  citoAansluiting: string;
  citaat?: string;
}

export interface AnalysisResult {
  samenvatting: string;
  prijsanalyse: PrijsAnalyseItem[];
  citoSterkePunten: Array<{ module: string; argumenten: string[] }>;
  concurrentieVergelijking: ConcurrentDetail[];
  schoolplanKoppeling: SchoolplanKoppeling[] | null;
  gespreksargumenten: string[];
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return headers;
  }

  const { supabase } = await import('@/lib/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Niet ingelogd. Log opnieuw in om AI-functies te gebruiken.');

  headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

// ─── Build request payload ──────────────────────────────────────────────────

export function buildAnalysisPayload(
  mode: 'comparison' | 'current-vs-proposed',
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
  diaPackageResult: DiaPackageResult | null,
  currentVsProposedResult?: CurrentVsProposedResult | null,
  schoolplanData?: SchoolplanAnalysisRow | null,
) {
  const totalStudents = getTotalStudents(studentCounts);

  // Filter differentiators to selected modules only
  const relevantDifferentiators = MODULE_DIFFERENTIATORS.filter((d) =>
    selectedModules.includes(d.moduleId),
  );

  // Build DIA context
  const discountPercent = getDiaVolumeDiscountPercent(totalStudents);
  const diaContext = diaPackageResult
    ? {
        activePackage: diaPackageResult.selectedPackage?.name ?? null,
        volumeDiscountPercent: discountPercent,
        packageSavings: diaPackageResult.savings,
        coveredModuleIds: diaPackageResult.coveredModuleIds,
      }
    : null;

  // Build JIJ context
  let jijContext = null;
  if (totalStudents > 0) {
    const { costPerStudent, tier } = estimateJijCostPerStudent(totalStudents);
    jijContext = {
      tier: tier.tier,
      tierLabel: tier.label,
      annualFee: tier.annualFee,
      pricePerTest: tier.pricePerTest,
      totalStudents,
      costPerStudent,
    };
  }

  // Build current-vs-proposed data
  let currentVsProposedData = undefined;
  if (mode === 'current-vs-proposed' && currentVsProposedResult) {
    currentVsProposedData = {
      modules: currentVsProposedResult.modules.map((mod) => ({
        moduleId: mod.moduleId,
        moduleName: mod.moduleName,
        currentProvider: mod.currentProvider,
        currentProviderLabel: mod.currentProviderLabel,
        currentCost: mod.currentTotalCost,
        citoCost: mod.proposedCitoTotalCost,
        difference: mod.annualDifference,
        isNewModule: mod.isNewModule,
      })),
      totalCurrentCost: currentVsProposedResult.totalCurrentCost,
      totalProposedCost: currentVsProposedResult.totalProposedCost,
      totalSavings: currentVsProposedResult.totalAnnualSavings,
    };
  }

  // Build schoolplan data (top 5 opportunities by relevance)
  let schoolplanPayload = undefined;
  if (schoolplanData && schoolplanData.analysis_status === 'complete' && schoolplanData.opportunities.length > 0) {
    const relevanceOrder = { hoog: 0, midden: 1, laag: 2 };
    const sortedOpportunities = [...schoolplanData.opportunities]
      .sort((a, b) => (relevanceOrder[a.relevance] ?? 2) - (relevanceOrder[b.relevance] ?? 2))
      .slice(0, 5);

    schoolplanPayload = {
      summary: schoolplanData.summary,
      themes: schoolplanData.themes,
      opportunities: sortedOpportunities.map((opp) => ({
        theme: opp.theme,
        citoProduct: opp.citoProduct,
        moduleId: opp.moduleId,
        explanation: opp.explanation,
        relevance: opp.relevance,
        quote: opp.quote,
        competitorVulnerabilities: opp.competitorVulnerabilities,
      })),
    };
  }

  return {
    mode,
    comparisonData: {
      modules: result.modules.map((mod) => ({
        moduleId: mod.moduleId,
        moduleName: mod.moduleName,
        providers: mod.providers,
      })),
      totals: result.totals,
      differences: result.differences,
    },
    schoolProfile: {
      levels,
      totalStudents,
      selectedModules,
      moduleSetups: moduleSetups.map((s) => ({
        moduleId: s.moduleId,
        currentProvider: s.currentProvider,
      })),
    },
    differentiators: relevantDifferentiators,
    diaContext,
    jijContext,
    currentVsProposedData,
    schoolplanData: schoolplanPayload ?? null,
  };
}

// ─── Main analysis function ─────────────────────────────────────────────────

export async function generateAnalysis(
  mode: 'comparison' | 'current-vs-proposed',
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
  diaPackageResult: DiaPackageResult | null,
  currentVsProposedResult?: CurrentVsProposedResult | null,
  schoolplanData?: SchoolplanAnalysisRow | null,
): Promise<AnalysisResult> {
  const headers = await getAuthHeaders();
  const payload = buildAnalysisPayload(
    mode,
    result,
    levels,
    studentCounts,
    selectedModules,
    moduleSetups,
    diaPackageResult,
    currentVsProposedResult,
    schoolplanData,
  );

  const response = await fetch('/api/ai-analysis', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'AI-analyse genereren mislukt. Probeer het opnieuw.');
  }

  const data = await response.json();

  // Validate essential fields
  if (typeof data.samenvatting !== 'string' || !Array.isArray(data.gespreksargumenten)) {
    throw new Error('AI-analyse heeft een onverwacht formaat. Probeer het opnieuw.');
  }

  return {
    samenvatting: data.samenvatting,
    prijsanalyse: data.prijsanalyse ?? [],
    citoSterkePunten: data.citoSterkePunten ?? [],
    concurrentieVergelijking: data.concurrentieVergelijking ?? [],
    schoolplanKoppeling: data.schoolplanKoppeling?.length > 0 ? data.schoolplanKoppeling : null,
    gespreksargumenten: data.gespreksargumenten.slice(0, 8),
  };
}
