/**
 * Vite dev-server plugin that proxies /api/* requests to the Anthropic API.
 * This makes `npm run dev` work without Vercel CLI — no need for `npm run dev:full`.
 *
 * Only active during development (configureServer hook).
 * Production uses Vercel serverless functions (api/*.ts) as before.
 */

import type { Plugin } from 'vite';
import type { IncomingMessage } from 'http';
import Anthropic from '@anthropic-ai/sdk';

// ─── System prompts (mirrored from api/*.ts — single source of truth is the serverless function) ─

const INTAKE_SYSTEM_PROMPT = `Je helpt een Cito-consultant de huidige situatie van een school te structureren op basis van aantekeningen uit een gesprek (vaak telefonisch).

BELANGRIJK: Antwoord UITSLUITEND met geldig JSON. Geen uitleg, geen markdown, geen tekst voor of na de JSON.

Beschikbare modules (exacte moduleId waarden):
- rekenwiskunde, nederlands, engels, taalverzorging, sociaal-emotioneel, cognitieve-capaciteiten

Beschikbare aanbieders (exacte waarden):
- cito-oud, cito-nieuw, dia, jij, overig, geen

Beschikbare levels (exacte waarden):
- vmbo-b, vmbo-k, vmbo-gt, havo, vwo

Regels:
- Neem alleen levels op die expliciet worden genoemd of duidelijk zijn.
- Neem alleen modules op die de school gebruikt of wil vergelijken.
- Als een module wordt genoemd zonder aanbieder, gebruik "geen".
- Als een prijs wordt genoemd als totaal per jaar, deel door het leerlingaantal (als bekend).
- Leerlingaantallen: als aantallen per leerjaar bekend zijn (bijv. "leerjaar 1: 150, leerjaar 2: 140"), gebruik studentCountsPerYear. Als alleen totalen per niveau bekend zijn (bijv. "350 HAVO leerlingen"), gebruik studentCountsPerLevel. Gebruik bij voorkeur studentCountsPerYear als de data beschikbaar is — dit is het meest flexibel voor prijsberekeningen.
- unsureAbout: maximaal 3 punten, in het Nederlands.
- contactPersonen: extraheer naam, rol, dmuPositie (coordinator/mt/finance/it/onbekend), email, telefoon.
- actiePunten: extraheer wat, wanneer, verantwoordelijke.
- pipelineSignaal: interesse/twijfel/afwijzing/concurrent-switch/verlenging/neutraal. Laat weg als onduidelijk.

Verplicht JSON-formaat (voorbeeld met per-leerjaar aantallen):
{
  "levels": ["havo", "vwo"],
  "studentCountsPerLevel": null,
  "studentCountsPerYear": {"havo": {"1": 150, "2": 140, "3": 130, "4": 120, "5": 110}, "vwo": {"1": 100, "2": 95, "3": 90, "4": 85, "5": 80, "6": 75}},
  "selectedModules": ["rekenwiskunde", "nederlands"],
  "moduleSetups": [
    {"moduleId": "rekenwiskunde", "currentProvider": "dia", "pricePerStudent": 4.50},
    {"moduleId": "nederlands", "currentProvider": "cito-oud", "pricePerStudent": null}
  ],
  "unsureAbout": ["Exacte prijzen DIA onbekend"],
  "contactPersonen": [{"naam": "Jan de Vries", "rol": "Toetscoordinator", "dmuPositie": "coordinator"}],
  "actiePunten": [{"wat": "Offerte opvragen", "wanneer": "Volgende week"}],
  "pipelineSignaal": "interesse"
}

Alternatief met alleen totalen per niveau (als per-leerjaar niet bekend is):
{
  "levels": ["havo", "vwo"],
  "studentCountsPerLevel": {"havo": 650, "vwo": 525},
  "studentCountsPerYear": null,
  ...
}`;

const ADVICE_SYSTEM_PROMPT = `Je bent een strategisch adviesassistent voor Cito-consultants die Nederlandse middelbare scholen adviseren over toetsaanbieders.

Je ontvangt een prijsvergelijking tussen toetsaanbieders (Cito, DIA, JIJ!, SAQI) en een schoolprofiel. Op basis hiervan geef je contextueel advies dat de consultant kan gebruiken in het verkoopgesprek.

BELANGRIJK:
- Schrijf in het Nederlands, professioneel maar toegankelijk
- Geef 3-5 concrete adviespunten
- Elk adviespunt heeft een korte titel (max 8 woorden) en een toelichting (1-2 zinnen)
- Focus op: prijsverschillen uitleggen, meerwaarde benadrukken, bezwaren weerleggen
- Wees eerlijk — als een concurrent goedkoper is, erken dat en leg uit waarom Cito meer biedt
- Gebruik de differentiators om meerwaarde te onderbouwen
- Houd rekening met schoolgrootte (staffelkorting DIA, licentiemodel JIJ!)
- Als een module geen concurrent heeft (bijv. Engels alleen Cito), benoem dat als uniek voordeel

Antwoord UITSLUITEND in dit JSON-formaat:
{
  "adviezen": [
    {
      "titel": "Korte titel",
      "tekst": "Toelichting met concrete cijfers en argumenten.",
      "type": "prijs | meerwaarde | bezwaar | kans"
    }
  ],
  "samenvatting": "Een zin die de kern van het advies samenvat — geschikt als openingszin in het gesprek."
}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

export function devApiPlugin(apiKey: string): Plugin {
  return {
    name: 'dev-api-proxy',

    configureServer(server) {
      const anthropic = new Anthropic({ apiKey });

      // POST /api/ai-intake — SSE streaming
      server.middlewares.use('/api/ai-intake', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        try {
          const body = JSON.parse(await readBody(req));
          const notes = body.notes;

          if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
            res.statusCode = 400;
            res.end('Notes zijn verplicht');
            return;
          }

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const stream = anthropic.messages.stream({
            model: 'claude-haiku-4-5',
            max_tokens: 4096,
            system: INTAKE_SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: `Analyseer de volgende aantekeningen en extraheer de gestructureerde schoolgegevens als JSON:\n\n${notes}`,
              },
            ],
          });

          stream.on('text', (text) => {
            res.write(`data: ${JSON.stringify({ type: 'content_block_delta', text })}\n\n`);
          });

          stream.on('message', (message) => {
            res.write(`data: ${JSON.stringify({ type: 'message_stop', message })}\n\n`);
            res.end();
          });

          stream.on('error', (error) => {
            res.write(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`);
            res.end();
          });
        } catch (err) {
          res.statusCode = 500;
          res.end(`Er is een fout opgetreden bij de AI-verwerking: ${String(err)}`);
        }
      });

      // POST /api/ai-advice — SSE streaming
      server.middlewares.use('/api/ai-advice', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        try {
          const body = JSON.parse(await readBody(req));

          if (!body.comparisonData || !body.schoolProfile) {
            res.statusCode = 400;
            res.end('Vergelijkingsdata en schoolprofiel zijn verplicht');
            return;
          }

          // Build user message (same format as api/ai-advice.ts)
          const userMessage = `Analyseer deze prijsvergelijking en geef strategisch advies:

SCHOOLPROFIEL:
- Niveaus: ${body.schoolProfile.levels.join(', ')}
- Totaal leerlingen: ${body.schoolProfile.totalStudents}
- Geselecteerde modules: ${body.schoolProfile.selectedModules.join(', ')}
- Huidige aanbieders: ${body.schoolProfile.moduleSetups.map((s: { moduleId: string; currentProvider: string }) => `${s.moduleId}: ${s.currentProvider}`).join(', ')}

PRIJSVERGELIJKING (totalen per jaar):
${Object.entries(body.comparisonData.totals).map(([provider, total]) => `- ${provider}: €${(total as number).toFixed(2)}`).join('\n')}

PRIJSVERSCHILLEN:
${Object.entries(body.comparisonData.differences).map(([key, diff]) => `- ${key}: ${diff !== null ? `€${(diff as number).toFixed(2)}` : 'n.v.t.'}`).join('\n')}

PER MODULE:
${body.comparisonData.modules.map((mod: { moduleName: string; providers: Record<string, { pricePerStudent: number } | null> }) => {
  const providers = Object.entries(mod.providers)
    .filter(([, cost]) => cost !== null)
    .map(([prov, cost]) => `${prov}: €${cost!.pricePerStudent.toFixed(2)}/lln`)
    .join(', ');
  return `- ${mod.moduleName}: ${providers || 'geen prijzen'}`;
}).join('\n')}

DIFFERENTIATORS PER MODULE:
${(body.differentiators || []).map((d: { moduleId: string; cito: string[]; dia: string[]; jij: string[]; saqi: string[] }) => {
  const parts = [
    d.cito.length > 0 ? `  Cito: ${d.cito.join('; ')}` : '',
    d.dia.length > 0 ? `  DIA: ${d.dia.join('; ')}` : '',
    d.jij.length > 0 ? `  JIJ!: ${d.jij.join('; ')}` : '',
    d.saqi.length > 0 ? `  SAQI: ${d.saqi.join('; ')}` : '',
  ].filter(Boolean).join('\n');
  return `- ${d.moduleId}:\n${parts}`;
}).join('\n')}`;

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: ADVICE_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
          });

          stream.on('text', (text) => {
            res.write(`data: ${JSON.stringify({ type: 'content_block_delta', text })}\n\n`);
          });

          stream.on('message', (message) => {
            res.write(`data: ${JSON.stringify({ type: 'message_stop', message })}\n\n`);
            res.end();
          });

          stream.on('error', (error) => {
            res.write(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`);
            res.end();
          });
        } catch (err) {
          res.statusCode = 500;
          res.end(`Er is een fout opgetreden bij de AI-adviesverwerking: ${String(err)}`);
        }
      });
    },
  };
}
