# Roadmap: Rekentool VO

## Overview

Van lege repository naar een werkende prijsvergelijkings- en business-case-tool voor het VO in vijf fasen. We beginnen met het datamodel en de rekenmotor (de kern die alles aandrijft), bouwen daarop Scenario A (prijsvergelijking Cito vs. concurrentie) als eerste zichtbare output, voegen Scenario B (migratieberekening met tijdswinst) toe, schakelen interne modus en doelgroep-perspectieven in, en sluiten af met AI-ondersteuning en tablet-optimalisatie.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Fundament** - Datamodel, rekenmotor, schoolprofiel-invoer en app-skelet met Cito-huisstijl
- [ ] **Phase 2: Prijsvergelijking** - Scenario A: modulaire Cito vs. DIA vs. JIJ vergelijking met staafdiagram en transparante bronvermelding
- [ ] **Phase 3: Business Case** - Scenario B: financieel verschil, tijdswinst-calculator, meerjarenprojectie en terugverdientijd
- [ ] **Phase 4: Interne Modus & Doelgroepen** - Sales-signalen, gevoeligheidsanalyse, doelgroep-perspectieven, print en clipboard-export
- [ ] **Phase 5: AI & Polish** - AI-validatie en -generatie, geavanceerde prijsinvoer (upload/AI-lookup) en tablet-optimalisatie

## Phase Details

### Phase 1: Fundament
**Goal**: De gebruiker kan een schoolprofiel invoeren en de applicatie toont de Cito-huisstijl, Nederlandse interface en correct opgezette datastructuren -- klaar om er berekeningen op los te laten
**Depends on**: Nothing (first phase)
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, DATA-01, DATA-02, DATA-03, DATA-05, DATA-06, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan schooltype (vmbo-b/k/gt, havo, vwo), leerlingaantallen per leerjaar/niveau en relevante modules selecteren
  2. Gebruiker kan kiezen tussen Scenario A en Scenario B
  3. Prijsdata bevat bronvermelding, verificatiedatum en ouderdomsindicator per record; prijzen ouder dan 6 maanden tonen automatisch een waarschuwing
  4. De interface is volledig Nederlandstalig en toont Cito-huisstijl (Primary #003082, Accent #FF6600, Background #F8F9FA)
  5. Alle aannames in het datamodel zijn zichtbaar en aanpasbaar (uurtarief, tijdsschattingen, etc.)
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffold, Tailwind CSS 4 theming, TypeScript data models, zustand store en zod schemas
- [ ] 01-02-PLAN.md — 4-staps wizard UI met voortgangsbalk, navigatie en alle stap-componenten
- [ ] 01-03-PLAN.md — Reusable UI-componenten: PriceBadge, EditableAssumption, DisclaimerFooter

### Phase 2: Prijsvergelijking
**Goal**: De gebruiker ziet een eerlijke, transparante modulaire prijsvergelijking tussen Cito, DIA en JIJ op basis van publicatieprijzen, inclusief visuele weergave en onderscheidend vermogen
**Depends on**: Phase 1
**Requirements**: PRIJS-01, PRIJS-02, PRIJS-03, PRIJS-04, PRIJS-05, PRIJS-06, DATA-04, INPUT-01, MODE-01
**Success Criteria** (what must be TRUE):
  1. Gebruiker ziet per geselecteerde module de kosten per leerling en totaalkosten per aanbieder (Cito, DIA, JIJ) naast elkaar
  2. Gebruiker ziet een staafdiagram dat de totaalkosten per aanbieder visueel vergelijkt
  3. Gebruiker kan berekeningsdetails per module uitklappen en ziet de formule en inputs
  4. Gebruiker kan prijzen handmatig invoeren of overschrijven, en de vergelijking herberekent reactief zonder opnieuw te beginnen
  5. Gebruiker ziet per module wat Cito biedt dat de concurrent niet biedt (en omgekeerd), inclusief gevallen waar de concurrent goedkoper is
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Rekenmotor: pure calculateComparison functie, uitgebreide prijsdata, differentiator-data en nl-NL formatting (TDD)
- [ ] 02-02-PLAN.md — Zustand store met draft/applied override-scheiding, Recharts staafdiagram en BusinessCaseCTA
- [ ] 02-03-PLAN.md — ComparisonTable, ModuleDetailPanel met prijsoverschrijving, PriceComparisonPage en wizard-routing

### Phase 3: Business Case
**Goal**: De gebruiker kan de complete business case voor de overstap van het huidige naar het nieuwe Cito-platform doorrekenen, met financieel verschil, tijdswinst in uren en euro's, en meerjarenprojectie
**Depends on**: Phase 2
**Requirements**: BCASE-01, BCASE-02, BCASE-03, BCASE-04, BCASE-05, BCASE-06, BCASE-07
**Success Criteria** (what must be TRUE):
  1. Gebruiker ziet het financieel verschil tussen huidig en nieuw Cito-platform per module en als totaal
  2. Gebruiker ziet per taak (rechten, resetten, inloggen, planning, koppeling) de concrete uren bespaard, met bewerkbare aannames en standaardprofielen (klein/middelgroot/groot VO)
  3. Gebruiker kan uurtarief instellen en ziet de tijdsbesparing omgerekend naar euro's
  4. Gebruiker ziet de totale waarde van de overstap (financieel verschil + tijdsbesparing) en een meerjarenprojectie over 1, 3 en 5 jaar met cumulatieve besparing
  5. Gebruiker ziet het break-even punt (terugverdientijd) visueel weergegeven
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Interne Modus & Doelgroepen
**Goal**: Accountmanagers kunnen de tool in interne modus gebruiken met sales-signalen en gevoeligheidsanalyse, en resultaten presenteren vanuit het perspectief van de juiste doelgroep, met print- en clipboard-export
**Depends on**: Phase 3
**Requirements**: MODE-02, MODE-03, MODE-04, MODE-05, DOELGR-01, DOELGR-02, DOELGR-03, EXPORT-01, EXPORT-02
**Success Criteria** (what must be TRUE):
  1. Accountmanager kan interne modus activeren (apart URL-pad met toegangspoort) en ziet sales-signalen per module ("benadruk prijs" / "focus op kwaliteit" / "focus op meerwaarde")
  2. Interne modus toont automatisch gevoeligheidsanalyse met 10%/20% kortingsscenario's en marktgemiddelde per modulecombinatie
  3. Gebruiker kan perspectief kiezen (coordinator/docent, directie, finance) en ziet resultaten met de juiste nadruk (tijdswinst, overzicht, of euro's)
  4. Gebruiker kan het resultaat printen met alle secties uitgevouwen in print-geoptimaliseerde layout
  5. Gebruiker kan een samenvatting kopieren naar clipboard
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: AI & Polish
**Goal**: AI ondersteunt de gebruiker bij validatie, inhoudsgeneratie en prijsinvoer, en de tool werkt uitstekend op tablet tijdens schoolbezoek
**Depends on**: Phase 4
**Requirements**: INPUT-02, INPUT-03, AI-01, AI-02, AI-03, UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. AI signaleert onrealistische prijzen, ontbrekende modules en inconsistenties bij invoer
  2. AI genereert onderscheidend vermogen per module en schrijft een samenvatting afgestemd op de gekozen doelgroep
  3. Gebruiker kan prijsdocumenten uploaden (PDF/Excel) voor automatische prijsextractie
  4. Gebruiker kan AI-agent inzetten om prijzen op te zoeken
  5. De tool is bruikbaar op tablet tijdens schoolbezoek: responsief, touch-friendly, met guidance en defaults bij invoervelden
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Fundament | 0/3 | Planning complete | - |
| 2. Prijsvergelijking | 0/3 | Planning complete | - |
| 3. Business Case | 0/? | Not started | - |
| 4. Interne Modus & Doelgroepen | 0/? | Not started | - |
| 5. AI & Polish | 0/? | Not started | - |
