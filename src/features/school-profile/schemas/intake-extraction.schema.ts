/**
 * Extended intake extraction schema (V2).
 * Adds contact persons, action items, and pipeline signals
 * to the base extraction schema for richer AI-powered intake.
 *
 * Uses .transform() to convert null → undefined so downstream code
 * only deals with `string | undefined`, not `string | null | undefined`.
 */

import { z } from 'zod';

// ---- Shared constants (moved here from ai-intake.ts to share across features) ----

export const MODULE_IDS = [
  'rekenwiskunde',
  'nederlands',
  'engels',
  'taalverzorging',
  'sociaal-emotioneel',
  'cognitieve-capaciteiten',
] as const;

export const SCHOOL_LEVELS = ['vmbo-b', 'vmbo-k', 'vmbo-gt', 'havo', 'vwo'] as const;

export const PROVIDERS = ['cito-oud', 'cito-nieuw', 'dia', 'jij', 'overig', 'geen'] as const;

// ---- Helpers: accept AI quirks (null, string numbers) and normalize ----

// Accepts number or numeric string → coerces to number
const coerceNumber = z.union([z.number(), z.string().transform(Number)]).pipe(z.number());

// Accepts number, numeric string, or null → number | null
const coerceNumberNullable = z.union([
  z.number(),
  z.string().transform(Number),
  z.null(),
]).pipe(z.number().nullable());

// Accepts string, null, or undefined → strips null before passing through
const optStr = z.preprocess((v) => v === null ? undefined : v, z.string().optional());

// Accepts enum, null, or undefined → strips null before passing through
function optEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((v) => v === null ? undefined : v, z.enum(values).optional());
}

// ---- V2 Schema with contacts, actions, pipeline signals ----

export const IntakeExtractionSchemaV2 = z.object({
  // --- V1 fields (backward compatible) ---
  levels: z.array(z.enum(SCHOOL_LEVELS)),
  studentCountsPerLevel: z.record(z.string(), coerceNumber).nullable(),
  selectedModules: z.array(z.enum(MODULE_IDS)),
  moduleSetups: z.array(z.object({
    moduleId: z.enum(MODULE_IDS),
    currentProvider: z.enum(PROVIDERS),
    pricePerStudent: coerceNumberNullable,
    customProviderName: optStr,
  })),
  unsureAbout: z.array(z.string()),

  // --- V2 additions ---

  /** Contact persons mentioned during the intake conversation. */
  contactPersonen: z.array(z.object({
    naam: z.string(),
    rol: optStr,
    dmuPositie: optEnum(['coordinator', 'mt', 'finance', 'it', 'onbekend'] as const),
    email: optStr,
    telefoon: optStr,
  })).default([]),

  /** Action items extracted from the conversation. */
  actiePunten: z.array(z.object({
    wat: z.string(),
    wanneer: optStr,
    verantwoordelijke: optStr,
  })).default([]),

  /** Pipeline signal detected from conversation tone and content. */
  pipelineSignaal: optEnum([
    'interesse',
    'twijfel',
    'afwijzing',
    'concurrent-switch',
    'verlenging',
    'neutraal',
  ] as const),
});

export type IntakeExtractionV2 = z.infer<typeof IntakeExtractionSchemaV2>;
