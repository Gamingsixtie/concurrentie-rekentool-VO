import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { getModelConfig } from '../src/lib/ai-model-config';
import { MODULE_CATALOG } from '../src/models/modules';
import { MODULE_DIFFERENTIATORS } from '../src/data/differentiators';
import { SchoolplanAnalysisResult } from '../src/features/school-profile/schemas/schoolplan-analysis.schema';

// Module-level init (reused across warm invocations)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// ─── Text extraction (PDF, DOCX, TXT only per D-16) ────────────────────────

export async function extractTextFromFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf': {
      const result = await pdfParse(buffer);
      return result.text;
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'txt':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Niet-ondersteund bestandsformaat: .${ext}`);
  }
}

// ─── AI Prompt builders (pure functions) ────────────────────────────────────

export function buildSummarizePrompt(): string {
  return `Je bent een AI-assistent die schoolplan-documenten analyseert voor Cito-accountmanagers.

STAP 1: Bepaal of het document een schoolplan is.
Een schoolplan is een strategisch document van een school dat doelen, visie, en beleid beschrijft voor de komende jaren. Het bevat typisch thema's als onderwijsvisie, kwaliteitszorg, personeelsbeleid, leerlingbegeleiding, en vakinhoudelijke doelen.

Als het document GEEN schoolplan is (bijv. een notulen, factuur, prijslijst, of ander type document):
Retourneer: { "isSchoolplan": false, "summary": "", "themes": [] }

Als het document WEL een schoolplan is:
1. Schrijf een samenvatting van 2-3 zinnen in het Nederlands die beschrijft waar het schoolplan op focust.
2. Identificeer 3-7 kernthema's/doelen uit het schoolplan (bijv. "Verbetering rekenonderwijs", "Differentiatie in de klas", "Sociaal-emotionele ontwikkeling").

Retourneer: { "isSchoolplan": true, "summary": "<samenvatting>", "themes": ["<thema1>", "<thema2>", ...] }

BELANGRIJK: Retourneer ALLEEN geldige JSON, geen markdown of extra uitleg.`;
}

export function buildMatchingPrompt(
  summary: string,
  themes: string[],
  schoolContext?: { levels?: string[]; selectedModules?: string[] },
): string {
  // Dynamically serialize MODULE_CATALOG (never hardcode module names per Research Pitfall 4)
  const moduleCatalogDescription = MODULE_CATALOG.map(
    (m) => `- ${m.id}: "${m.name}" — ${m.description} (categorie: ${m.category})`,
  ).join('\n');

  // Dynamically serialize MODULE_DIFFERENTIATORS
  const differentiatorDescription = MODULE_DIFFERENTIATORS.map((d) => {
    const module = MODULE_CATALOG.find((m) => m.id === d.moduleId);
    const moduleName = module ? module.name : d.moduleId;
    const lines = [`Module: ${moduleName} (${d.moduleId})`];
    if (d.cito.length > 0) lines.push(`  Cito-voordelen: ${d.cito.join('; ')}`);
    if (d.dia.length > 0) lines.push(`  DIA-kenmerken: ${d.dia.join('; ')}`);
    if (d.jij.length > 0) lines.push(`  JIJ-kenmerken: ${d.jij.join('; ')}`);
    return lines.join('\n');
  }).join('\n\n');

  // School context section (optional)
  let schoolContextSection = '';
  if (schoolContext) {
    const parts: string[] = [];
    if (schoolContext.levels && schoolContext.levels.length > 0) {
      parts.push(`Schoolniveaus: ${schoolContext.levels.join(', ')}`);
    }
    if (schoolContext.selectedModules && schoolContext.selectedModules.length > 0) {
      parts.push(`Huidige Cito-modules: ${schoolContext.selectedModules.join(', ')}`);
    }
    if (parts.length > 0) {
      schoolContextSection = `\n\nSCHOOLCONTEXT:\n${parts.join('\n')}
Gebruik deze context om kansen te prioriteren. Modules die de school al gebruikt zijn minder urgent (tenzij upgrade relevant is).`;
    }
  }

  return `Je bent een AI-assistent die schoolplan-thema's matcht met Cito-producten voor accountmanagers.

CITO MODULECATALOGUS:
${moduleCatalogDescription}

CONCURRENTIE-ANALYSE PER MODULE:
${differentiatorDescription}
${schoolContextSection}

INSTRUCTIES:
Je ontvangt een samenvatting en thema's uit een schoolplan. Doe het volgende:

1. KANSEN IDENTIFICEREN: Match elk schoolplan-thema met relevante Cito-modules uit de catalogus hierboven.
   Per kans:
   - theme: het schoolplan-thema
   - citoProduct: de naam van het Cito-product (uit de catalogus)
   - moduleId: de module-id (uit de catalogus)
   - explanation: waarom dit product aansluit bij het schoolplan-thema (in het Nederlands)
   - conversationTip: een concrete gesprekstip voor de accountmanager (in het Nederlands)
   - relevance: 'hoog', 'midden', of 'laag'
   - quote: een relevant citaat uit de samenvatting/thema's
   - competitorVulnerabilities: array van { provider: 'dia' | 'jij', description: string } — gebruik de concurrentie-analyse hierboven om zwakke punten te signaleren

2. MOGELIJK OOK RELEVANT: Identificeer modules die NIET direct matchen met schoolplan-thema's, maar mogelijk toch relevant zijn.
   Per item:
   - citoProduct: de naam van het Cito-product
   - moduleId: de module-id
   - reason: waarom het toch relevant kan zijn (in het Nederlands)
   - relevance: 'hoog', 'midden', of 'laag'

Retourneer JSON in dit formaat:
{
  "opportunities": [...],
  "alsoRelevant": [...]
}

BELANGRIJK:
- Sorteer kansen op relevance (hoog eerst)
- Gebruik de modulenamen en IDs exact zoals in de catalogus hierboven
- Retourneer ALLEEN geldige JSON, geen markdown of extra uitleg`;
}

// ─── AI response parsers ────────────────────────────────────────────────────

function stripMarkdownFences(text: string): string {
  const fenceMatch = text.trim().match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return fenceMatch ? fenceMatch[1].trim() : text.trim();
}

function parseSummaryResponse(response: Anthropic.Message): {
  isSchoolplan: boolean;
  summary: string;
  themes: string[];
} {
  try {
    const content = response.content[0];
    if (content.type !== 'text') {
      return { isSchoolplan: false, summary: '', themes: [] };
    }

    const cleaned = stripMarkdownFences(content.text);
    const parsed = JSON.parse(cleaned);

    return {
      isSchoolplan: Boolean(parsed.isSchoolplan),
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    };
  } catch {
    return { isSchoolplan: false, summary: '', themes: [] };
  }
}

function parseAnalysisResponse(
  response: Anthropic.Message,
  summaryResult: { isSchoolplan: boolean; summary: string; themes: string[] },
): unknown {
  try {
    const content = response.content[0];
    if (content.type !== 'text') {
      return {
        ...summaryResult,
        opportunities: [],
        alsoRelevant: [],
      };
    }

    const cleaned = stripMarkdownFences(content.text);
    const parsed = JSON.parse(cleaned);

    return {
      isSchoolplan: summaryResult.isSchoolplan,
      summary: summaryResult.summary,
      themes: summaryResult.themes,
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      alsoRelevant: Array.isArray(parsed.alsoRelevant) ? parsed.alsoRelevant : [],
    };
  } catch {
    return {
      ...summaryResult,
      opportunities: [],
      alsoRelevant: [],
    };
  }
}

// ─── Request interface ──────────────────────────────────────────────────────

interface AnalyzeRequest {
  storagePath: string;
  fileName: string;
  schoolContext?: {
    levels?: string[];
    selectedModules?: string[];
  };
}

// ─── SSE streaming POST handler ─────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    // Skip auth in dev mode (SKIP_AUTH=true in .env.local)
    const skipAuth = process.env.SKIP_AUTH === 'true';

    if (!skipAuth) {
      // Extract and verify Bearer token
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }

      // Verify JWT via Supabase admin client
      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Parse and validate request body
    const body = (await request.json()) as AnalyzeRequest;
    const { storagePath, fileName, schoolContext } = body;

    if (!storagePath || typeof storagePath !== 'string') {
      return new Response('Opslagpad is verplicht', { status: 400 });
    }
    if (!fileName || typeof fileName !== 'string') {
      return new Response('Bestandsnaam is verplicht', { status: 400 });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      return new Response('Bestand niet gevonden', { status: 404 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Extract text from document
    let documentText: string;
    try {
      documentText = await extractTextFromFile(buffer, fileName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Onbekende fout';
      if (message.startsWith('Niet-ondersteund bestandsformaat')) {
        return new Response(message, { status: 400 });
      }
      return new Response('Dit document kon niet worden gelezen.', { status: 422 });
    }

    if (!documentText || documentText.trim().length === 0) {
      return new Response('Geen tekst gevonden in document.', { status: 422 });
    }

    // SSE streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send step 1 progress
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'step', step: 1, label: 'Document wordt samengevat...' })}\n\n`,
            ),
          );

          // Run step 1: summarize
          const config = getModelConfig();
          const summaryResponse = await anthropic.messages.create({
            model: config.model,
            max_tokens: config.maxTokensSummary,
            system: buildSummarizePrompt(),
            messages: [{ role: 'user', content: documentText.slice(0, 30000) }],
          });

          // Parse step 1 result
          const summaryResult = parseSummaryResponse(summaryResponse);

          // If not a schoolplan, send result immediately
          if (!summaryResult.isSchoolplan) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'result',
                  data: {
                    ...summaryResult,
                    opportunities: [],
                    alsoRelevant: [],
                  },
                })}\n\n`,
              ),
            );
            controller.close();
            return;
          }

          // Send step 2 progress
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'step', step: 2, label: 'Kansen worden geidentificeerd...' })}\n\n`,
            ),
          );

          // Run step 2: matching
          const analysisResponse = await anthropic.messages.create({
            model: config.model,
            max_tokens: config.maxTokensAnalysis,
            system: buildMatchingPrompt(summaryResult.summary, summaryResult.themes, schoolContext),
            messages: [
              {
                role: 'user',
                content: JSON.stringify({
                  summary: summaryResult.summary,
                  themes: summaryResult.themes,
                }),
              },
            ],
          });

          // Parse and validate against Zod schema
          const analysisResult = parseAnalysisResponse(analysisResponse, summaryResult);
          const validated = SchoolplanAnalysisResult.parse(analysisResult);

          // Send final result
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'result', data: validated })}\n\n`),
          );
          controller.close();
        } catch (streamError) {
          // Send SSE error event with actual error details
          const errMsg = streamError instanceof Error ? streamError.message : String(streamError);
          console.error('Schoolplan analysis SSE error:', errMsg);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: `Analyse mislukt: ${errMsg}` })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (outerError) {
    const errMsg = outerError instanceof Error ? outerError.message : String(outerError);
    console.error('Schoolplan analysis outer error:', errMsg);
    return new Response(`Analyse mislukt: ${errMsg}`, { status: 500 });
  }
}
