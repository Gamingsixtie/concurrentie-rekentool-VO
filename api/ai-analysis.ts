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

const SYSTEM_PROMPT = `Je bent een diepgaande concurrentie-analist voor Cito-consultants die Nederlandse middelbare scholen adviseren over toetsaanbieders (Cito, DIA, JIJ!/Bureau ICE).

Je ontvangt prijsvergelijkingsdata, schoolprofiel, differentiators per module, en eventueel schoolplandata. Je maakt een gestructureerde analyse die de consultant direct kan gebruiken.

PRIJSMODELLEN — dit is cruciaal om goed uit te leggen:

DIA PRIJSMODEL:
- DIA werkt met losse modules OF bundelpakketten (bijv. "VO Pakket compleet" voor Reken+NE+EN+TV).
- Bundelpakketten zijn goedkoper dan losse modules als de school meerdere vakken afneemt.
- Staffelkorting: 5% bij 500+ leerlingen, 10% bij 1000+ leerlingen.
- Als diaContext is meegegeven, gebruik de exacte pakket- en kortingsgegevens in je analyse.

JIJ! PRIJSMODEL:
- JIJ! (Bureau ICE) werkt NIET met een prijs per leerling per module, maar met een licentiemodel.
- Vast jaarlijks licentiebedrag (afhankelijk van schoolgrootte) + prijs per toetsafname.
- 4 licentietiers: Tier 1 (groot, 4001+ afnames): €5.330/jaar + €2,40/toets. Tier 2 (middelgroot, 2501-4000): €2.815 + €3,05. Tier 3 (klein, 166-2500): €975 + €3,75. Tier 4 (zeer klein, 0-165): €290 + €7,90.
- Alle JIJ! modules zitten in dezelfde licentie — extra modules kosten GEEN extra geld.
- Dit betekent: hoe meer modules een school afneemt bij JIJ!, hoe goedkoper per module.
- Als jijContext is meegegeven, gebruik de exacte tier en berekening in je analyse.

MODUS:
- Bij mode "comparison": focus op marktvergelijking Cito vs. DIA vs. JIJ op publicatieprijzen.
- Bij mode "current-vs-proposed": focus op huidige situatie vs. overstap naar Cito. Benoem besparingen, maar ook waar de school mogelijk meer gaat betalen en waarom dat gerechtvaardigd is.

EERLIJKHEID:
- Wees eerlijk over concurrentievoordelen. Als een concurrent goedkoper is, erken dat.
- Geef bij elk concurrent-voordeel een weerlegging: hoe kan de consultant dit counteren in het gesprek?
- De consultant moet voorbereid zijn op tegenargumenten van de school.

SCHOOLPLAN (indien beschikbaar):
- Koppel Cito-producten aan strategische thema's uit het schoolplan.
- Gebruik citaten uit het schoolplan om de koppeling te onderbouwen.
- Benoem waar concurrenten tekortschieten op deze thema's (competitorVulnerabilities).

REGELS:
- schoolplanKoppeling is een lege array als er geen schoolplandata is meegegeven
- Maximaal 5-8 gespreksargumenten, gerangschikt van sterkst naar zwakst
- Geen generieke one-liners — elk argument moet specifiek zijn voor deze school
- Gebruik concrete bedragen en percentages waar mogelijk
- Schrijf in het Nederlands, professioneel maar toegankelijk
- concurrentieVergelijking: vul ALTIJD voor beide concurrenten in (dia en jij), ook als er geen directe vergelijking is voor alle modules

Gebruik de analyse_result tool om je analyse te structureren.`;

// Tool definition for structured output — guarantees valid schema
const ANALYSIS_TOOL: Anthropic.Tool = {
  name: 'analyse_result',
  description: 'Gestructureerde concurrentieanalyse met alle secties.',
  input_schema: {
    type: 'object' as const,
    properties: {
      samenvatting: {
        type: 'string',
        description: 'Een alinea (3-5 zinnen) met strategisch overzicht: wat is de kern van de vergelijking, waar staat Cito sterk, wat zijn de risico\'s.',
      },
      prijsanalyse: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            module: { type: 'string', description: 'Modulenaam' },
            vergelijking: { type: 'string', description: 'Uitleg WAAROM de prijzen verschillen — bundel-effecten, volumekorting, licentiemodel. Noem concrete bedragen.' },
            citoPositie: { type: 'string', enum: ['goedkoper', 'duurder', 'vergelijkbaar'] },
          },
          required: ['module', 'vergelijking', 'citoPositie'],
        },
      },
      citoSterkePunten: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            module: { type: 'string' },
            argumenten: { type: 'array', items: { type: 'string' } },
          },
          required: ['module', 'argumenten'],
        },
      },
      concurrentieVergelijking: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            provider: { type: 'string', enum: ['dia', 'jij'] },
            citoBeter: { type: 'array', items: { type: 'string' } },
            concurrentBeter: { type: 'array', items: { type: 'string' } },
            weerlegging: { type: 'array', items: { type: 'string' } },
          },
          required: ['provider', 'citoBeter', 'concurrentBeter', 'weerlegging'],
        },
      },
      schoolplanKoppeling: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            thema: { type: 'string' },
            citoAansluiting: { type: 'string' },
            citaat: { type: 'string' },
          },
          required: ['thema', 'citoAansluiting'],
        },
      },
      gespreksargumenten: {
        type: 'array',
        items: { type: 'string' },
        description: 'Kant-en-klare gespreksargumenten (5-8), gerangschikt van sterkst naar zwakst.',
      },
    },
    required: ['samenvatting', 'prijsanalyse', 'citoSterkePunten', 'concurrentieVergelijking', 'schoolplanKoppeling', 'gespreksargumenten'],
  },
};

interface AnalysisRequest {
  mode: 'comparison' | 'current-vs-proposed';
  comparisonData: {
    modules: Array<{
      moduleId: string;
      moduleName: string;
      providers: Record<string, { pricePerStudent: number; totalCost: number } | null>;
    }>;
    totals: Record<string, number>;
    differences: Record<string, number | null>;
  };
  schoolProfile: {
    levels: string[];
    totalStudents: number;
    selectedModules: string[];
    moduleSetups: Array<{
      moduleId: string;
      currentProvider: string;
    }>;
  };
  differentiators: Array<{
    moduleId: string;
    cito: string[];
    dia: string[];
    jij: string[];
    saqi: string[];
  }>;
  diaContext: {
    activePackage: string | null;
    volumeDiscountPercent: number;
    packageSavings: number;
    coveredModuleIds: string[];
  } | null;
  jijContext: {
    tier: number;
    tierLabel: string;
    annualFee: number;
    pricePerTest: number;
    totalStudents: number;
    costPerStudent: number;
  } | null;
  currentVsProposedData?: {
    modules: Array<{
      moduleId: string;
      moduleName: string;
      currentProvider: string;
      currentProviderLabel: string;
      currentCost: number | null;
      citoCost: number | null;
      difference: number | null;
      isNewModule: boolean;
    }>;
    totalCurrentCost: number;
    totalProposedCost: number;
    totalSavings: number;
  };
  schoolplanData?: {
    summary: string;
    themes: string[];
    opportunities: Array<{
      theme: string;
      citoProduct: string;
      moduleId: string;
      explanation: string;
      relevance: string;
      quote: string;
      competitorVulnerabilities: Array<{ provider: string; description: string }>;
    }>;
  } | null;
}

function buildUserMessage(body: AnalysisRequest): string {
  const parts: string[] = [];

  parts.push(`MODUS: ${body.mode === 'comparison' ? 'Marktvergelijking (Cito vs. DIA vs. JIJ)' : 'Huidig vs. Cito (overstapsituatie)'}`);

  parts.push(`\nSCHOOLPROFIEL:
- Niveaus: ${body.schoolProfile.levels.join(', ')}
- Totaal leerlingen: ${body.schoolProfile.totalStudents}
- Geselecteerde modules: ${body.schoolProfile.selectedModules.join(', ')}
- Huidige aanbieders: ${body.schoolProfile.moduleSetups.map((s) => `${s.moduleId}: ${s.currentProvider}`).join(', ')}`);

  parts.push(`\nPRIJSVERGELIJKING (totalen per jaar):
${Object.entries(body.comparisonData.totals).map(([provider, total]) => `- ${provider}: €${(total as number).toFixed(2)}`).join('\n')}`);

  parts.push(`\nPRIJSVERSCHILLEN:
${Object.entries(body.comparisonData.differences).map(([key, diff]) => `- ${key}: ${diff !== null ? `€${(diff as number).toFixed(2)}` : 'n.v.t.'}`).join('\n')}`);

  parts.push(`\nPER MODULE:
${body.comparisonData.modules.map((mod) => {
    const providers = Object.entries(mod.providers)
      .filter(([, cost]) => cost !== null)
      .map(([prov, cost]) => `${prov}: €${cost!.pricePerStudent.toFixed(2)}/lln (totaal €${cost!.totalCost.toFixed(2)})`)
      .join(', ');
    return `- ${mod.moduleName}: ${providers || 'geen prijzen'}`;
  }).join('\n')}`);

  // DIA context
  if (body.diaContext) {
    parts.push(`\nDIA CONTEXT:
- Actief pakket: ${body.diaContext.activePackage ?? 'Geen pakket (losse modules)'}
- Staffelkorting: ${body.diaContext.volumeDiscountPercent}%
- Pakketbesparing: €${body.diaContext.packageSavings.toFixed(2)}/lln
- Gedekte modules: ${body.diaContext.coveredModuleIds.join(', ') || 'geen'}`);
  }

  // JIJ context
  if (body.jijContext) {
    parts.push(`\nJIJ! CONTEXT:
- Licentie tier: ${body.jijContext.tier} (${body.jijContext.tierLabel})
- Jaarlijks licentiebedrag: €${body.jijContext.annualFee.toFixed(2)}
- Prijs per toetsafname: €${body.jijContext.pricePerTest.toFixed(2)}
- Berekende kosten per leerling: €${body.jijContext.costPerStudent.toFixed(2)}/lln
- Totaal leerlingen: ${body.jijContext.totalStudents}`);
  }

  // Current vs proposed
  if (body.currentVsProposedData) {
    parts.push(`\nHUIDIGE SITUATIE VS. CITO:
- Huidige totale kosten: €${body.currentVsProposedData.totalCurrentCost.toFixed(2)}/jaar
- Cito totale kosten: €${body.currentVsProposedData.totalProposedCost.toFixed(2)}/jaar
- Totale besparing: €${body.currentVsProposedData.totalSavings.toFixed(2)}/jaar
Per module:
${body.currentVsProposedData.modules.map((mod) => {
      const current = mod.currentCost !== null ? `€${mod.currentCost.toFixed(2)}` : 'onbekend';
      const cito = mod.citoCost !== null ? `€${mod.citoCost.toFixed(2)}` : 'n.v.t.';
      const diff = mod.difference !== null ? `verschil €${mod.difference.toFixed(2)}` : '';
      return `- ${mod.moduleName}: ${mod.currentProviderLabel} ${current} → Cito ${cito} ${diff}${mod.isNewModule ? ' (NIEUW)' : ''}`;
    }).join('\n')}`);
  }

  // Differentiators
  parts.push(`\nDIFFERENTIATORS PER MODULE:
${body.differentiators.map((d) => {
    const lines = [
      d.cito.length > 0 ? `  Cito: ${d.cito.join('; ')}` : '',
      d.dia.length > 0 ? `  DIA: ${d.dia.join('; ')}` : '',
      d.jij.length > 0 ? `  JIJ!: ${d.jij.join('; ')}` : '',
      d.saqi.length > 0 ? `  SAQI: ${d.saqi.join('; ')}` : '',
    ].filter(Boolean).join('\n');
    return `- ${d.moduleId}:\n${lines}`;
  }).join('\n')}`);

  // Schoolplan
  if (body.schoolplanData) {
    parts.push(`\nSCHOOLPLAN ANALYSE:
Samenvatting: ${body.schoolplanData.summary}
Thema's: ${body.schoolplanData.themes.join(', ')}
Kansen:
${body.schoolplanData.opportunities.map((opp) => {
      const vulns = opp.competitorVulnerabilities.map((v) => `${v.provider}: ${v.description}`).join('; ');
      return `- ${opp.theme} → ${opp.citoProduct} (${opp.relevance})
    Uitleg: ${opp.explanation}
    Citaat: "${opp.quote}"
    Concurrentzwaktes: ${vulns || 'geen'}`;
    }).join('\n')}`);
  } else {
    parts.push('\nSCHOOLPLAN: Niet beschikbaar. Laat schoolplanKoppeling leeg.');
  }

  return parts.join('\n');
}

export async function POST(request: Request): Promise<Response> {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';

    if (!skipAuth) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }

      const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);

      if (authError || !user) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const body: AnalysisRequest = await request.json();

    if (!body.comparisonData || !body.schoolProfile) {
      return new Response('Vergelijkingsdata en schoolprofiel zijn verplicht', { status: 400 });
    }

    const userMessage = buildUserMessage(body);

    // Use tool_use for guaranteed structured output — no JSON parsing needed
    const message = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: 'tool', name: 'analyse_result' },
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract tool input from the response
    const toolBlock = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    if (!toolBlock) {
      return new Response('AI-analyse kon geen resultaat genereren. Probeer het opnieuw.', { status: 500 });
    }

    return new Response(JSON.stringify(toolBlock.input), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response('Er is een fout opgetreden bij de AI-analyse', { status: 500 });
  }
}
