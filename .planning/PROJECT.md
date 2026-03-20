# Rekentool VO — Prijsvergelijking & Overstap Business Case

## What This Is

Een interactieve prijsvergelijkingstool voor het voortgezet onderwijs (VO) die scholen en Cito-accountmanagers helpt om eerlijk en transparant te vergelijken op prijs, inhoud en tijdswinst. De tool bedient drie scenario's: Cito vs. concurrentie (A), huidig Cito-platform → nieuw Cito-platform (B), en concurrentie → nieuw Cito-platform (C). Er zijn twee modi: een objectieve externe modus voor scholen en een interne modus met sales-signalen voor accountmanagers.

## Core Value

Scholen en accountmanagers kunnen in minuten een onderbouwde, eerlijke vergelijking maken die zowel financieel als in tijdsbesparing concreet maakt waarom het (nieuwe) Cito-platform de beste keuze is — zonder te overdrijven of informatie te verbergen.

## Requirements

### Validated

**Phase 1: Fundament** (validated 2026-03-20):
- [x] Schoolprofiel-invoer: schooltype, leerlingaantallen per leerjaar/niveau, modules selecteren
- [x] Cito-huisstijl: Primary #003082, Accent #FF6600, Background #F8F9FA als Tailwind tokens
- [x] Nederlandse interface met correcte labels en navigatie
- [x] Datastructuren: school levels, pricing model, assumptions, modules
- [x] 4-staps wizard met voortgangsbalk en formuliervalidatie
- [x] Reusable UI-componenten: PriceBadge, EditableAssumption, DisclaimerFooter

### Active

**Scenario A — Cito vs. concurrentie:**
- [ ] Modulaire prijsvergelijking Cito vs. DIA en JIJ (IEP) op basis van publicatieprijzen
- [ ] Selectie van relevante modules per school (LVS Rekenen, LVS Taal, Engels, Capaciteitentest, Sociaal-emotioneel, etc.)
- [ ] Kosten per leerling en totaaloverzicht per aanbieder per module
- [ ] Visuele vergelijking (staafdiagram)
- [ ] Onderscheidend vermogen per module: wat biedt Cito dat de concurrent niet biedt (en omgekeerd)

**Scenario B — Huidig Cito-platform → nieuw Cito-platform:**
- [ ] Financieel verschil: huidige kosten vs. nieuwe kosten per module en totaal
- [ ] Tijdswinst-calculator: concrete uren bespaard op dagelijkse taken
- [ ] Tijdswinst in euro's: bespaarde uren × instelbaar uurtarief
- [ ] Totale waarde overstap: financieel verschil + waarde tijdsbesparing
- [ ] Meerjarenprojectie: terugverdientijd over 1, 3 en 5 jaar

**Tijdswinst-taken (scenario B):**
- [ ] Rechten docenten: automatisch toegekend vs. handmatig
- [ ] Toetsen resetten: zelf doen vs. klantenservice bellen
- [ ] Inloggen: Entree-federatie vs. startcodes
- [ ] Planning: automatisch planningsvoorstel vs. handmatig
- [ ] Leerling-/docentkoppeling: automatische sync Somtoday/Magister vs. handmatig EDEXML

**Beide scenario's:**
- [ ] Prijsstatus per product: geverifieerd / handmatig / mogelijk verouderd / onbekend
- [ ] Houdbaarheidsdatum per prijs, automatische markering bij >6 maanden oud
- [ ] Uitklapbare berekeningsdetails

**Prijsinvoer (drie wegen):**
- [ ] Documenten uploaden (prijslijsten)
- [ ] Handmatige invoer
- [ ] AI-agent die prijzen opzoekt

**Twee modi:**
- [ ] Externe modus: objectief, neutraal, alleen publicatieprijzen
- [ ] Interne modus: sales-signalen, gevoeligheidsanalyse (10%/20% korting), marktgemiddelde, handmatige prijsinvoer

**Meerdere doelgroepen op de school:**
- [ ] Coördinator/docent-perspectief: tijdswinst in concrete uren
- [ ] Directie-perspectief (conrector/rector): overzicht en onderbouwing
- [ ] Finance/budgetverantwoordelijke-perspectief: euro's en meerjarenprojectie

**Export:**
- [ ] Printbare output (alle secties uitgevouwen, print-geoptimaliseerde CSS)
- [ ] Kopieer samenvatting naar clipboard

### Out of Scope

- Scenario C (concurrentie → nieuw Cito-platform) — logische combinatie van A+B, bouwen we later
- Real-time prijssynchronisatie met concurrenten — publicatieprijzen worden handmatig bijgehouden
- Gebruikersaccounts of opgeslagen vergelijkingen — stateless tool
- Contractonderhandeling of offertefunctionaliteit

## Context

Cito opereert in de VO-markt voor toetsing en leerlingvolgsystemen. Belangrijkste concurrenten zijn DIA en JIJ (IEP). Scholen kopen modulair in: LVS-onderdelen, capaciteitentoetsen, sociaal-emotionele instrumenten, etc.

Er spelen twee commerciële uitdagingen:
1. **New business**: scholen vergelijken aanbieders en Cito moet laten zien dat het competitief geprijsd is
2. **Migratie**: bestaande Cito-klanten twijfelen over de overstap naar het nieuwe platform — de business case moet concreet zijn

De beslissingsketen op scholen is divers: van de coördinator onderbouw of docent die het dagelijks gebruikt, via de conrector/rector die het besluit neemt, tot de financieel verantwoordelijke die het budget bewaakt. De tool moet alle drie aanspreken.

Prijsdata van concurrenten is beperkt: staffelkortingen zijn niet bekend, alleen publicatieprijzen. Het ontwerp lost dit op door transparantie (publicatieprijs als bovengrens) en gevoeligheidsanalyse (wat als de concurrent 10%/20% korting geeft).

Het nieuwe Cito-platform bespaart scholen concreet tijd op:
- Rechten verlenen aan docenten (automatisch i.p.v. handmatig)
- Toetsen resetten (zelf i.p.v. klantenservice bellen)
- Inloggen (Entree-federatie i.p.v. startcodes)
- Planning (automatisch voorstel i.p.v. handmatig)
- Leerling-/docentkoppeling (Somtoday/Magister-sync i.p.v. EDEXML)

## Constraints

- **Taal**: Volledig Nederlands, formeel "u"-vorm in externe modus
- **Huisstijl**: Cito Primary #003082, Accent #FF6600, Background #F8F9FA
- **Tech stack**: Vite 8 + React 19 + TypeScript + Tailwind CSS 4 + Zustand + Zod v4 + Vitest
- **Responsiviteit**: Nader te bepalen (bruikbaar op tablet tijdens schoolbezoek is wenselijk)
- **Toegankelijkheid**: Nader te bepalen
- **Concurrenten bij launch**: DIA en JIJ (IEP)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modulair vergelijken, niet pakketten | Appels met appels — alleen vergelijken wat beide aanbieders leveren | — Pending |
| Publicatieprijs als bovengrens | Eerlijk: werkelijke prijs kan lager zijn, dat maakt het transparant | — Pending |
| Elke prijs heeft houdbaarheidsdatum | Geen verouderde data zonder waarschuwing | — Pending |
| Scenario A en B als scope v1 | Focus op de twee meest urgente use cases, C is combinatie die later kan | — Pending |
| Drie wegen voor prijsinvoer | Documenten, handmatig, AI-agent — flexibiliteit voor verschillende situaties | — Pending |
| Tech stack: Vite 8 + React 19 + Tailwind 4 + Zustand + Zod v4 | Moderne stack, snelle builds, type-safe state management | Decided Phase 1 |

---
*Last updated: 2026-03-20 after Phase 1 completion*
