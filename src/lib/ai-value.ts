/**
 * AI-powered value proposition generation.
 * Takes migration data + school profile and generates a compelling value narrative.
 * Calls the Vercel serverless proxy at /api/ai-value with SSE streaming.
 */

import { parseSSEChunk } from './ai-intake';
import { getTotalStudents } from '../engine/price-comparison';
import type { MigrationResult } from '../engine/migration';
import type { SchoolLevel } from '../models/school';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ValueArgument {
  titel: string;
  tekst: string;
  categorie: 'financieel' | 'tijdwinst' | 'kwaliteit' | 'risico';
}

export interface ValueObjection {
  bezwaar: string;
  weerlegging: string;
}

export interface ValueNarrativeResult {
  samenvatting: string;
  narratief: string;
  kernargumenten: ValueArgument[];
  bezwaarWeerleggingen: ValueObjection[];
}

// ─── Auth helper ────────────────────────────────────────────────────────────

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

function buildValuePayload(
  migrationResult: MigrationResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  priceDifference: number | null,
  hourlyRateKnown: boolean,
) {
  const totalStudents = getTotalStudents(studentCounts);

  return {
    migrationData: {
      modules: migrationResult.modules.map((m) => ({
        moduleId: m.moduleId,
        moduleName: m.moduleName,
        oldTotalCost: m.oldTotalCost,
        newTotalCost: m.newTotalCost,
        annualDifference: m.annualDifference,
      })),
      totalOldCost: migrationResult.totalOldCost,
      totalNewCost: migrationResult.totalNewCost,
      financialDifference: migrationResult.financialDifference,
      timeSavings: migrationResult.timeSavings.map((t) => ({
        taskLabel: t.taskLabel,
        hoursPerYear: t.hoursPerYear,
        valuePerYear: t.valuePerYear,
      })),
      totalTimeSavingsHours: migrationResult.totalTimeSavingsHours,
      totalTimeSavingsValue: migrationResult.totalTimeSavingsValue,
      totalAnnualValue: migrationResult.totalAnnualValue,
      switchingCosts: migrationResult.switchingCosts,
      breakEvenMonth: migrationResult.breakEvenMonth,
      multiYearProjection: migrationResult.multiYearProjection.map((p) => ({
        year: p.year,
        cumulativeSavings: p.cumulativeSavings,
      })),
    },
    schoolProfile: {
      levels,
      totalStudents,
      selectedModules,
    },
    priceDifference,
    hourlyRateKnown,
  };
}

// ─── Parse value narrative from accumulated text ────────────────────────────

function parseValueFromText(fullText: string): ValueNarrativeResult {
  const cleaned = fullText.trim();

  let parsed: unknown;

  // Strategy 1: Direct JSON.parse
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Strategy 2: Strip markdown code fences
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
      try {
        parsed = JSON.parse(fenceMatch[1].trim());
      } catch {
        // Continue to strategy 3
      }
    }

    // Strategy 3: Extract first {...} JSON block
    if (!parsed) {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
        } catch {
          // All strategies failed
        }
      }
    }

    if (!parsed) {
      throw new Error('AI-waardepropositie kon niet worden verwerkt als JSON.');
    }
  }

  // Basic validation
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.narratief !== 'string' || typeof obj.samenvatting !== 'string') {
    throw new Error('AI-waardepropositie heeft een onverwacht formaat.');
  }

  return {
    samenvatting: obj.samenvatting as string,
    narratief: obj.narratief as string,
    kernargumenten: (Array.isArray(obj.kernargumenten) ? obj.kernargumenten as ValueArgument[] : []).slice(0, 5),
    bezwaarWeerleggingen: (Array.isArray(obj.bezwaarWeerleggingen) ? obj.bezwaarWeerleggingen as ValueObjection[] : []).slice(0, 4),
  };
}

// ─── Main function ──────────────────────────────────────────────────────────

export async function generateValueNarrative(
  migrationResult: MigrationResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  priceDifference: number | null,
  hourlyRateKnown: boolean,
): Promise<ValueNarrativeResult> {
  const headers = await getAuthHeaders();
  const payload = buildValuePayload(
    migrationResult, levels, studentCounts, selectedModules, priceDifference, hourlyRateKnown,
  );

  const response = await fetch('/api/ai-value', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'AI-waardepropositie genereren mislukt. Probeer het opnieuw.');
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const { texts, error } = parseSSEChunk(chunk);

    if (error) throw new Error(error);
    fullText += texts.join('');
  }

  if (!fullText) throw new Error('Onverwacht lege AI-waardepropositie');

  return parseValueFromText(fullText);
}
