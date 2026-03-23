/**
 * AI-powered intake extraction.
 * Parses freeform consultant notes from a phone call into structured wizard data.
 * Calls the Vercel serverless proxy at /api/ai-intake with SSE streaming.
 */

import { YEARS_PER_LEVEL, type SchoolLevel } from '../models/school';
import {
  IntakeExtractionSchemaV2,
  type IntakeExtractionV2,
} from '@/features/school-profile/schemas/intake-extraction.schema';

// ─── V2 Schema re-exports ────────────────────────────────────────────────────

export { IntakeExtractionSchemaV2, type IntakeExtractionV2 };

/** @deprecated Use IntakeExtractionSchemaV2 instead */
export const IntakeExtractionSchema = IntakeExtractionSchemaV2;
/** @deprecated Use IntakeExtractionV2 instead */
export type IntakeExtraction = IntakeExtractionV2;

// ─── Student count distribution helper ───────────────────────────────────────

/**
 * Convert per-level totals into the store's nested year structure,
 * distributing students evenly across years within each level.
 */
export function distributeStudentCounts(
  levels: SchoolLevel[],
  countsPerLevel: Record<string, number> | null,
): Partial<Record<SchoolLevel, Record<number, number>>> {
  if (!countsPerLevel || levels.length === 0) return {};

  const result: Partial<Record<SchoolLevel, Record<number, number>>> = {};
  for (const level of levels) {
    const levelTotal = countsPerLevel[level] ?? 0;
    if (levelTotal === 0) continue;

    const years = YEARS_PER_LEVEL[level];
    const perYear = Math.round(levelTotal / years.length);
    result[level] = {};
    for (const year of years) {
      result[level]![year] = perYear;
    }
  }
  return result;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Je helpt een Cito-consultant de huidige situatie van een school te structureren op basis van aantekeningen uit een gesprek (vaak telefonisch).

Beschikbare modules:
- rekenwiskunde  -> "Reken-Wiskunde"
- nederlands     -> "Nederlands"
- engels         -> "Engels"
- taalverzorging -> "Taalverzorging Nederlands"
- sociaal-emotioneel -> "Sociaal-emotioneel functioneren"
- cognitieve-capaciteiten -> "Cognitieve capaciteitentoets"

Beschikbare aanbieders:
- cito-oud   -> school gebruikt al Cito, maar op het OUDE platform
- cito-nieuw -> school gebruikt al het NIEUWE Cito-platform
- dia        -> DIA Toetsen
- jij        -> JIJ (IEP)
- overig     -> andere aanbieder (vul customProviderName in)
- geen       -> module niet in gebruik of onbekend

Regels:
- Neem alleen levels op die expliciet worden genoemd of duidelijk zijn.
- Neem alleen modules op die de school gebruikt of wil vergelijken.
- Als een module wordt genoemd zonder aanbieder, gebruik 'geen'.
- Als een prijs wordt genoemd als totaal per jaar (niet per leerling), bereken dan de prijs per leerling door te delen door het leerlingaantal (als bekend).
- Schrijf unsureAbout-punten in het Nederlands, kort en concreet.
- Sluit af met maximaal 3 unsureAbout-punten.`;

// ─── SSE stream parsing helper ───────────────────────────────────────────────

/**
 * Parses SSE data lines from a chunk and extracts text deltas.
 * Returns accumulated text and whether an error occurred.
 */
export function parseSSEChunk(chunk: string): { texts: string[]; error?: string } {
  const texts: string[] = [];
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === 'content_block_delta') {
          texts.push(event.text);
        } else if (event.type === 'error') {
          return { texts, error: event.error };
        }
        // 'message_stop' means stream is complete
      } catch (e) {
        if (e instanceof SyntaxError) continue; // skip malformed SSE lines
        throw e;
      }
    }
  }

  return { texts };
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Skip auth token in dev mode (matches VITE_SKIP_AUTH + server-side SKIP_AUTH)
  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return headers;
  }

  const { supabase } = await import('@/lib/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Niet ingelogd. Log opnieuw in om AI-functies te gebruiken.');

  headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

// ─── Main extraction function ─────────────────────────────────────────────────

/**
 * Sends notes to the server-side AI proxy and accumulates the SSE stream
 * into a final parsed IntakeExtraction result.
 */
export async function extractIntakeFromNotes(
  notes: string,
): Promise<IntakeExtraction> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/ai-intake', {
    method: 'POST',
    headers,
    body: JSON.stringify({ notes, systemPrompt: SYSTEM_PROMPT }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'AI-verwerking mislukt. Probeer het opnieuw.');
  }

  // Read the SSE stream and accumulate the full text response
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

  if (!fullText) throw new Error('Onverwacht leeg AI-antwoord');

  const parsed = parseExtractionFromText(fullText);
  return parsed;
}

// ─── Parse extraction from accumulated text ─────────────────────────────────

/**
 * Parses accumulated streaming text into a validated IntakeExtractionV2 object.
 * Strips markdown code fences (```json ... ```) if present.
 * Throws a descriptive Dutch error on failure.
 */
export function parseExtractionFromText(fullText: string): IntakeExtractionV2 {
  // Strip markdown code fences if present
  let cleaned = fullText.trim();
  const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      'AI-antwoord kon niet worden verwerkt. Het antwoord is geen geldig JSON-formaat.',
    );
  }

  try {
    return IntakeExtractionSchemaV2.parse(parsed);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Onbekende validatiefout';
    throw new Error(
      `Geëxtraheerde gegevens voldoen niet aan het verwachte schema: ${message}`,
    );
  }
}

// ─── Streaming generator variant ─────────────────────────────────────────────

/**
 * Streaming variant that yields text chunks as they arrive from the SSE stream.
 * Used by IntakePanel for real-time UI updates.
 */
export async function* streamIntakeFromNotes(notes: string): AsyncGenerator<string> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/ai-intake', {
    method: 'POST',
    headers,
    body: JSON.stringify({ notes, systemPrompt: SYSTEM_PROMPT }),
  });

  if (!response.ok) throw new Error('AI-verwerking mislukt.');

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const { texts, error } = parseSSEChunk(chunk);

    if (error) throw new Error(error);
    for (const text of texts) {
      yield text;
    }
  }
}
