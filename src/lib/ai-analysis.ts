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
import type { MigrationResult } from '../engine/migration';
import type { SchoolplanAnalysisRow } from '@/db/types';
import { MIGRATION_MODULE_BENEFITS } from '../models/migration';
import { TIME_SAVING_TASKS } from '../models/migration';
import type { WizardNarrativeContext } from '../features/price-comparison/wizard/types';

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
  mode: 'comparison' | 'current-vs-proposed' | 'migration',
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
  diaPackageResult: DiaPackageResult | null,
  currentVsProposedResult?: CurrentVsProposedResult | null,
  schoolplanData?: SchoolplanAnalysisRow | null,
  migrationResult?: MigrationResult | null,
  wizardContext?: WizardNarrativeContext | null,
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

  // Build time savings payload for comparison modes (same tasks as migration)
  let timeSavingsPayload = undefined;
  if (mode !== 'migration') {
    timeSavingsPayload = TIME_SAVING_TASKS.map((task) => ({
      taskLabel: task.label,
      oldMethod: task.oldMethodLabel,
      newMethod: task.newMethodLabel,
      defaultHoursPerYear: task.defaultHoursPerYear,
      description: task.description,
      benefit: task.benefit,
    }));
  }

  // Build migration payload
  let migrationPayload = undefined;
  if (mode === 'migration' && migrationResult) {
    migrationPayload = {
      modules: migrationResult.modules.map((m) => ({
        moduleId: m.moduleId,
        moduleName: m.moduleName,
        oldPricePerStudent: m.oldPricePerStudent,
        newPricePerStudent: m.newPricePerStudent,
        oldTotalCost: m.oldTotalCost,
        newTotalCost: m.newTotalCost,
        annualDifference: m.annualDifference,
      })),
      totalOldCost: migrationResult.totalOldCost,
      totalNewCost: migrationResult.totalNewCost,
      financialDifference: migrationResult.financialDifference,
      timeSavings: migrationResult.timeSavings.map((t) => {
        const task = TIME_SAVING_TASKS.find((ts) => ts.id === t.taskId);
        return {
          taskLabel: t.taskLabel,
          oldMethod: t.oldMethodLabel,
          newMethod: t.newMethodLabel,
          hoursPerYear: t.hoursPerYear,
          description: task?.description ?? '',
          benefit: task?.benefit ?? '',
        };
      }),
      totalTimeSavingsHours: migrationResult.totalTimeSavingsHours,
      totalAnnualValue: migrationResult.totalAnnualValue,
      moduleBenefits: MIGRATION_MODULE_BENEFITS.filter((b) =>
        selectedModules.includes(b.moduleId),
      ),
    };
  }

  // Build wizard advice context for progressive enrichment
  const wizardAdviceContext = wizardContext ? {
    samenvatting: wizardContext.samenvatting,
    matchingUitleg: wizardContext.matchingUitleg,
    aanbevolenCitoBundel: wizardContext.aanbevolenCitoBundel,
    adviesTitels: wizardContext.adviezen.map((a) => a.titel),
  } : null;

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
    migrationData: migrationPayload,
    timeSavingsData: timeSavingsPayload,
    wizardAdviceContext,
  };
}

// ─── SSE stream parser ──────────────────────────────────────────────────────

/**
 * Reads an SSE stream where the server assembles the final result.
 * Keepalive pings (SSE comments) keep the connection alive.
 * The last `data:` line before `[DONE]` contains the complete JSON result.
 */
async function parseAnalysisStream(response: Response): Promise<Record<string, unknown>> {
  if (!response.body) {
    throw new Error('Geen streaming response ontvangen.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: Record<string, unknown> | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);

      // Skip empty lines and SSE comments (keepalive pings)
      if (!line || line.startsWith(':')) continue;
      if (!line.startsWith('data: ')) continue;

      const data = line.slice(6);
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);

        // Check for server-side error
        if (parsed.error && !parsed.samenvatting) {
          throw new Error(typeof parsed.error === 'string' ? parsed.error : parsed.error.message || 'Stream error');
        }

        result = parsed;
      } catch (err) {
        if (err instanceof SyntaxError) continue; // Skip unparseable lines
        throw err; // Re-throw application errors
      }
    }
  }

  if (!result) {
    throw new Error('AI-analyse kon geen resultaat genereren. Probeer het opnieuw.');
  }

  return result;
}

// ─── Main analysis function ─────────────────────────────────────────────────

export async function generateAnalysis(
  mode: 'comparison' | 'current-vs-proposed' | 'migration',
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
  diaPackageResult: DiaPackageResult | null,
  currentVsProposedResult?: CurrentVsProposedResult | null,
  schoolplanData?: SchoolplanAnalysisRow | null,
  migrationResult?: MigrationResult | null,
  wizardContext?: WizardNarrativeContext | null,
): Promise<AnalysisResult> {
  console.log('[ai-analysis] Step 1: getAuthHeaders...');
  const headers = await getAuthHeaders();
  console.log('[ai-analysis] Step 2: buildAnalysisPayload...');
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
    migrationResult,
    wizardContext,
  );
  // Retry once on truncated streams (Vercel may kill the function mid-stream)
  const MAX_ATTEMPTS = 2;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      console.log(`[ai-analysis] Retry ${attempt}/${MAX_ATTEMPTS - 1} after stream failure...`);
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log('[ai-analysis] Step 3: fetch /api/ai-analysis (streaming)...');

    const response = await fetch('/api/ai-analysis', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    console.log('[ai-analysis] Step 4: response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      // Retry on transient server errors
      if (attempt < MAX_ATTEMPTS - 1 && response.status >= 500) {
        console.warn(`[ai-analysis] Server error ${response.status}, will retry...`);
        continue;
      }
      console.error('[ai-analysis] Server error:', text);
      throw new Error(text || 'AI-analyse genereren mislukt. Probeer het opnieuw.');
    }

    try {
      const data = await parseAnalysisStream(response);
      console.log('[ai-analysis] Step 5: stream complete, keys:', Object.keys(data));

      if (typeof data.samenvatting !== 'string') {
        console.error('[ai-analysis] Missing samenvatting, received keys:', Object.keys(data));
        throw new Error('AI-analyse heeft een onverwacht formaat. Probeer het opnieuw.');
      }

      return {
        samenvatting: data.samenvatting as string,
        prijsanalyse: Array.isArray(data.prijsanalyse) ? data.prijsanalyse : [],
        citoSterkePunten: Array.isArray(data.citoSterkePunten) ? data.citoSterkePunten : [],
        concurrentieVergelijking: Array.isArray(data.concurrentieVergelijking) ? data.concurrentieVergelijking : [],
        schoolplanKoppeling: Array.isArray(data.schoolplanKoppeling) && (data.schoolplanKoppeling as unknown[]).length > 0 ? data.schoolplanKoppeling as AnalysisResult['schoolplanKoppeling'] : null,
        gespreksargumenten: Array.isArray(data.gespreksargumenten) ? (data.gespreksargumenten as string[]).slice(0, 8) : [],
      };
    } catch (parseErr) {
      // Retry on truncated/incomplete streams
      if (attempt < MAX_ATTEMPTS - 1 && parseErr instanceof Error && parseErr.message.includes('afgebroken')) {
        console.warn('[ai-analysis] Stream truncated, will retry...');
        continue;
      }
      throw parseErr;
    }
  }

  throw new Error('AI-analyse genereren mislukt na meerdere pogingen.');
}
