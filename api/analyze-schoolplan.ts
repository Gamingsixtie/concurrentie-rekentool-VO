import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Lazy-init to avoid crashes when env vars are missing during build
let anthropic: Anthropic | null = null;
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getAnthropic() {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || '',
    );
  }
  return supabaseAdmin;
}

// ─── Text extraction ────────────────────────────────────────────────────────

function getFileExtension(fileName: string): string {
  return (fileName.split('.').pop() || '').toLowerCase();
}

interface ExtractionResult {
  text: string;
  pageCount: number | null;
}

export async function extractTextFromFile(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const ext = getFileExtension(fileName);

  switch (ext) {
    case 'pdf': {
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(buffer);
      return { text: result.text, pageCount: result.numpages ?? null };
    }
    case 'docx': {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value, pageCount: null };
    }
    case 'txt':
      return { text: buffer.toString('utf-8'), pageCount: null };
    default:
      throw new Error(`Niet-ondersteund bestandsformaat: .${ext}`);
  }
}

// ─── Inline module catalog ───────────────────────────────────────────────────

const MODULE_CATALOG = [
  { id: 'rekenwiskunde', name: 'Reken-Wiskunde', description: 'Volg de reken- en wiskundevaardigheden van leerlingen', category: 'leerlingvolgsysteem' },
  { id: 'nederlands', name: 'Nederlands', description: 'Volg de taalvaardigheden Nederlands van leerlingen', category: 'leerlingvolgsysteem' },
  { id: 'engels', name: 'Engels', description: 'Volg de Engelse taalvaardigheden van leerlingen', category: 'leerlingvolgsysteem' },
  { id: 'taalverzorging', name: 'Taalverzorging Nederlands', description: 'Toets spelling en grammatica', category: 'overige-instrumenten' },
  { id: 'sociaal-emotioneel', name: 'Sociaal-emotioneel functioneren', description: 'Breng het sociaal-emotioneel functioneren van leerlingen in kaart', category: 'overige-instrumenten' },
  { id: 'cognitieve-capaciteiten', name: 'Cognitieve capaciteitentoets', description: 'Meet cognitieve capaciteiten van leerlingen (losse licentie)', category: 'overige-instrumenten' },
];

const MODULE_DIFFERENTIATORS = [
  { moduleId: 'rekenwiskunde', cito: ['Remediering in samenwerking met methodeaanbieders', 'Adaptieve toetsafname'], dia: ['Adaptief toetsen', 'Koppeling met NUMO voor remediëring', 'Visuele groei-rapportage (Groeiwijzer)'], jij: ['Geïntegreerd in IEP-leerlingvolgsysteem', 'Adaptieve toetsroutes (ook praktijkonderwijs)', 'Woordeloze rekentoets beschikbaar (ISK)'] },
  { moduleId: 'nederlands', cito: ['Remediering in samenwerking met methodeaanbieders', 'Adaptieve toetsafname'], dia: ['Adaptief toetsen', 'Tekstenlab NE oefenmateriaal (begrijpend lezen)', 'Koppeling met NUMO', 'Woordenschat apart toetsbaar (Diawoord)'], jij: ['Geïntegreerd in IEP-leerlingvolgsysteem', 'Referentieniveaus 0F-4F', 'NT2-toetsen beschikbaar voor ISK'] },
  { moduleId: 'engels', cito: ['Enige aanbieder met gevalideerde VO-toets Engels in LVS'], dia: ['Pakket EN: begrijpend lezen + woordenschat', 'Tekstenlab EN oefenmateriaal'], jij: ['ERK-geijkt A1-B2/C1 (lezen + luisteren)', 'Kijk-/luistertoetsen als schoolexamen', 'Ook Frans, Duits en Spaans beschikbaar'] },
  { moduleId: 'taalverzorging', cito: ['Specifieke toets voor spelling en grammatica'], dia: ['Diaspel: adaptief digitaal dictee', 'Spellab: innovatief oefenplatform voor spelling'], jij: [] as string[] },
  { moduleId: 'sociaal-emotioneel', cito: ['Wetenschappelijk gevalideerd instrument'], dia: [] as string[], jij: ['Zelfevaluaties: leerbenadering, creatief vermogen, sociale context', 'Onderdeel van basislicentie (geen meerprijs)', '21e-eeuwse vaardigheden meeten'] },
  { moduleId: 'cognitieve-capaciteiten', cito: ['Marktleider in VO-markt', 'Losse licentie mogelijk'], dia: ['NSCCT: niet-schoolse cognitieve capaciteitentoets', 'Digitaal (€9,75) en papier (€4,50) beschikbaar'], jij: [] as string[] },
];

// ─── AI Prompt builders ──────────────────────────────────────────────────────

export function buildSummarizePrompt(): string {
  return `Je bent een AI-assistent die schoolplan-documenten analyseert voor Cito-accountmanagers.

STAP 1: Bepaal of het document een schoolplan is.
Een schoolplan is een strategisch document van een school dat doelen, visie, en beleid beschrijft voor de komende jaren.

Als het document GEEN schoolplan is:
Retourneer: { "isSchoolplan": false, "summary": "", "themes": [] }

Als het document WEL een schoolplan is:
1. Schrijf een samenvatting van 2-3 zinnen in het Nederlands.
2. Identificeer 3-7 kernthema's/doelen.

Retourneer: { "isSchoolplan": true, "summary": "<samenvatting>", "themes": ["<thema1>", ...] }

BELANGRIJK: Retourneer ALLEEN geldige JSON, geen markdown of extra uitleg.`;
}

export function buildMatchingPrompt(
  summary: string,
  themes: string[],
  schoolContext?: { levels?: string[]; selectedModules?: string[] },
): string {
  const moduleCatalogDescription = MODULE_CATALOG.map(
    (m) => `- ${m.id}: "${m.name}" — ${m.description} (categorie: ${m.category})`,
  ).join('\n');

  const differentiatorDescription = MODULE_DIFFERENTIATORS.map((d) => {
    const mod = MODULE_CATALOG.find((m) => m.id === d.moduleId);
    const moduleName = mod ? mod.name : d.moduleId;
    const lines = [`Module: ${moduleName} (${d.moduleId})`];
    if (d.cito.length > 0) lines.push(`  Cito-voordelen: ${d.cito.join('; ')}`);
    if (d.dia.length > 0) lines.push(`  DIA-kenmerken: ${d.dia.join('; ')}`);
    if (d.jij.length > 0) lines.push(`  JIJ-kenmerken: ${d.jij.join('; ')}`);
    return lines.join('\n');
  }).join('\n\n');

  let schoolContextSection = '';
  if (schoolContext) {
    const parts: string[] = [];
    if (schoolContext.levels?.length) parts.push(`Schoolniveaus: ${schoolContext.levels.join(', ')}`);
    if (schoolContext.selectedModules?.length) parts.push(`Huidige Cito-modules: ${schoolContext.selectedModules.join(', ')}`);
    if (parts.length > 0) {
      schoolContextSection = `\n\nSCHOOLCONTEXT:\n${parts.join('\n')}\nGebruik deze context om kansen te prioriteren.`;
    }
  }

  return `Je bent een AI-assistent die schoolplan-thema's matcht met Cito-producten.

CITO MODULECATALOGUS:
${moduleCatalogDescription}

CONCURRENTIE-ANALYSE PER MODULE:
${differentiatorDescription}
${schoolContextSection}

INSTRUCTIES:
Match elk schoolplan-thema met relevante Cito-modules. Per kans:
- theme, citoProduct, moduleId, explanation, conversationTip, relevance ('hoog'/'midden'/'laag'), quote, competitorVulnerabilities: [{ provider: 'dia'|'jij', description }]

Ook: "alsoRelevant" voor modules die niet direct matchen maar relevant kunnen zijn:
- citoProduct, moduleId, reason, relevance

Retourneer: { "opportunities": [...], "alsoRelevant": [...] }
ALLEEN geldige JSON, geen markdown.`;
}

// ─── Response parsers ────────────────────────────────────────────────────────

function stripMarkdownFences(text: string): string {
  const fenceMatch = text.trim().match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return fenceMatch ? fenceMatch[1].trim() : text.trim();
}

function parseSummaryResponse(response: Anthropic.Message) {
  try {
    const content = response.content[0];
    if (content.type !== 'text') {
      console.error('parseSummaryResponse: content type is not text:', content.type);
      return { isSchoolplan: false, summary: '', themes: [] as string[] };
    }
    const cleanText = stripMarkdownFences(content.text);
    console.log('parseSummaryResponse raw:', cleanText.slice(0, 500));
    const parsed = JSON.parse(cleanText);
    // Accept field name variants (isSchoolplan, is_schoolplan, is_school_plan)
    const isSchoolplan = Boolean(
      parsed.isSchoolplan ?? parsed.is_schoolplan ?? parsed.is_school_plan,
    );
    return {
      isSchoolplan,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    };
  } catch (err) {
    console.error('parseSummaryResponse parse error:', err);
    return { isSchoolplan: false, summary: '', themes: [] as string[] };
  }
}

function parseAnalysisResponse(
  response: Anthropic.Message,
  summaryResult: { isSchoolplan: boolean; summary: string; themes: string[] },
) {
  try {
    const content = response.content[0];
    if (content.type !== 'text') return { ...summaryResult, opportunities: [], alsoRelevant: [] };
    const parsed = JSON.parse(stripMarkdownFences(content.text));
    return {
      ...summaryResult,
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      alsoRelevant: Array.isArray(parsed.alsoRelevant) ? parsed.alsoRelevant : [],
    };
  } catch {
    return { ...summaryResult, opportunities: [], alsoRelevant: [] };
  }
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();
    const skipAuth = process.env.SKIP_AUTH === 'true';

    if (!skipAuth) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      if (!token) return new Response('Unauthorized', { status: 401 });

      const { data: { user }, error: authError } = await admin.auth.getUser(token);
      if (authError || !user) return new Response('Unauthorized', { status: 401 });
    }

    const { storagePath, fileName, schoolContext } = await request.json();

    if (!storagePath || typeof storagePath !== 'string') {
      return new Response('Opslagpad is verplicht', { status: 400 });
    }
    if (!fileName || typeof fileName !== 'string') {
      return new Response('Bestandsnaam is verplicht', { status: 400 });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await admin.storage
      .from('documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return new Response('Bestand niet gevonden', { status: 404 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Extract text from all file types (including PDF via pdf-parse)
    let extraction: ExtractionResult;
    try {
      extraction = await extractTextFromFile(buffer, fileName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Onbekende fout';
      console.error('Text extraction failed:', message);
      return new Response(message, { status: 422 });
    }

    if (!extraction.text || extraction.text.trim().length === 0) {
      return new Response('Geen tekst gevonden in document.', { status: 422 });
    }

    console.log(`Extracted ${extraction.text.length} chars, ${extraction.pageCount ?? '?'} pages from ${fileName}`);

    // SSE streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const ai = getAnthropic();
          const model = process.env.SCHOOLPLAN_AI_MODEL || 'claude-sonnet-4-20250514';
          const userContent = extraction.text.slice(0, 30000);

          // Step 1: Summarize
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'step', step: 1, label: 'Document wordt samengevat...' })}\n\n`,
          ));

          const summaryResponse = await ai.messages.create({
            model,
            max_tokens: 2048,
            system: buildSummarizePrompt(),
            messages: [{ role: 'user', content: userContent }],
          });

          const summaryResult = parseSummaryResponse(summaryResponse);
          console.log('Summary result:', JSON.stringify(summaryResult).slice(0, 300));

          if (!summaryResult.isSchoolplan) {
            console.log('Document classified as non-schoolplan');
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'result', summary: '', themes: [], opportunities: [], alsoRelevant: [], pageCount: extraction.pageCount })}\n\n`,
            ));
            controller.close();
            return;
          }

          // Step 2: Match opportunities
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'step', step: 2, label: 'Kansen worden geidentificeerd...' })}\n\n`,
          ));

          const analysisResponse = await ai.messages.create({
            model,
            max_tokens: 4096,
            system: buildMatchingPrompt(summaryResult.summary, summaryResult.themes, schoolContext),
            messages: [{ role: 'user', content: JSON.stringify({ summary: summaryResult.summary, themes: summaryResult.themes }) }],
          });

          const validated = parseAnalysisResponse(analysisResponse, summaryResult);

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'result', summary: validated.summary, themes: validated.themes, opportunities: validated.opportunities, alsoRelevant: validated.alsoRelevant, pageCount: extraction.pageCount })}\n\n`,
          ));
          controller.close();
        } catch (streamError) {
          const errMsg = streamError instanceof Error ? streamError.message : String(streamError);
          console.error('SSE error:', errMsg);
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: `Analyse mislukt: ${errMsg}` })}\n\n`,
          ));
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
    console.error('Outer error:', errMsg);
    return new Response(`Analyse mislukt: ${errMsg}`, { status: 500 });
  }
}
