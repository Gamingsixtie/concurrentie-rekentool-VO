import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Module-level init (reused across warm invocations)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const DEFAULT_SYSTEM_PROMPT = `Je helpt een Cito-consultant de huidige situatie van een school te structureren op basis van aantekeningen uit een gesprek (vaak telefonisch).

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
- Sluit af met maximaal 3 unsureAbout-punten.

Contactpersonen:
- Extraheer naam, rol, DMU-positie (coordinator/mt/finance/it/onbekend), email, telefoon.
- Als alleen een naam wordt genoemd, gebruik rol en dmuPositie als optioneel.

Actiepunten:
- Extraheer concrete vervolgacties: wat moet er gebeuren, wanneer, wie is verantwoordelijk.

Pipelinesignaal:
- Detecteer signalen: 'interesse' (positief), 'twijfel' (onzeker), 'afwijzing' (negatief), 'concurrent-switch' (overweegt concurrent), 'verlenging' (blijft bij huidige), 'neutraal' (geen signaal).
- Als geen duidelijk signaal, laat pipelineSignaal weg.

Outputformaat: JSON met de velden levels, studentCountsPerLevel, selectedModules, moduleSetups, unsureAbout, contactPersonen, actiePunten, pipelineSignaal.`;

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
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Parse and validate request body
    const { notes, systemPrompt } = await request.json();

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return new Response('Notes zijn verplicht', { status: 400 });
    }

    // Stream the Anthropic response via SSE
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: systemPrompt || DEFAULT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyseer de volgende aantekeningen en extraheer de gestructureerde schoolgegevens:\n\n${notes}`,
        },
      ],
    });

    // Create a ReadableStream that emits SSE events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          stream.on('text', (text) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content_block_delta', text })}\n\n`),
            );
          });

          stream.on('message', (message) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'message_stop', message })}\n\n`),
            );
            controller.close();
          });

          stream.on('error', (error) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`),
            );
            controller.close();
          });
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`),
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch {
    return new Response('Er is een fout opgetreden bij de AI-verwerking', { status: 500 });
  }
}
