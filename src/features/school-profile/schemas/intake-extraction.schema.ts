/**
 * Extended intake extraction schema (V2).
 * Adds contact persons, action items, and pipeline signals
 * to the base extraction schema for richer AI-powered intake.
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

// ---- V2 Schema with contacts, actions, pipeline signals ----

export const IntakeExtractionSchemaV2 = z.object({
  // --- V1 fields (backward compatible) ---
  levels: z.array(z.enum(SCHOOL_LEVELS)),
  studentCountsPerLevel: z.record(z.string(), z.number()).nullable(),
  selectedModules: z.array(z.enum(MODULE_IDS)),
  moduleSetups: z.array(z.object({
    moduleId: z.enum(MODULE_IDS),
    currentProvider: z.enum(PROVIDERS),
    pricePerStudent: z.number().nullable(),
    customProviderName: z.string().optional(),
  })),
  unsureAbout: z.array(z.string()),

  // --- V2 additions ---

  /** Contact persons mentioned during the intake conversation. */
  contactPersonen: z.array(z.object({
    naam: z.string(),
    rol: z.string().optional(),
    dmuPositie: z.enum(['coordinator', 'mt', 'finance', 'it', 'onbekend']).optional(),
    email: z.string().optional(),
    telefoon: z.string().optional(),
  })).default([]),

  /** Action items extracted from the conversation. */
  actiePunten: z.array(z.object({
    wat: z.string(),
    wanneer: z.string().optional(),
    verantwoordelijke: z.string().optional(),
  })).default([]),

  /** Pipeline signal detected from conversation tone and content. */
  pipelineSignaal: z.enum([
    'interesse',
    'twijfel',
    'afwijzing',
    'concurrent-switch',
    'verlenging',
    'neutraal',
  ]).optional(),
});

export type IntakeExtractionV2 = z.infer<typeof IntakeExtractionSchemaV2>;
