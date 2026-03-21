# Roadmap: Rekentool VO

## Milestones

- ✅ **v1.0 Fundament** - Phases 1-5 (shipped 2026-03-20)
- 🚧 **v2.0 Sales Intelligence Platform** - Phases 6-11 (in progress)

## Phases

<details>
<summary>✅ v1.0 Fundament (Phases 1-5) - SHIPPED 2026-03-20</summary>

### Phase 1: Fundament
**Goal**: Schoolprofiel-invoer, datastructuren, Cito-huisstijl en app-skelet
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, DATA-01, DATA-02, DATA-03, DATA-05, DATA-06, UX-03, UX-04
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, Tailwind CSS 4 theming, TypeScript data models, zustand store en zod schemas
- [x] 01-02-PLAN.md — 4-staps wizard UI met voortgangsbalk, navigatie en alle stap-componenten
- [x] 01-03-PLAN.md — Reusable UI-componenten: PriceBadge, EditableAssumption, DisclaimerFooter

### Phase 2: Prijsvergelijking
**Goal**: Modulaire Cito vs. DIA vs. JIJ vergelijking met staafdiagram en transparante bronvermelding
**Requirements**: PRIJS-01, PRIJS-02, PRIJS-03, PRIJS-04, PRIJS-05, PRIJS-06, DATA-04, INPUT-01, MODE-01
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Rekenmotor: pure calculateComparison functie, uitgebreide prijsdata, differentiator-data en nl-NL formatting (TDD)
- [x] 02-02-PLAN.md — Zustand store met draft/applied override-scheiding, Recharts staafdiagram en BusinessCaseCTA
- [x] 02-03-PLAN.md — ComparisonTable, ModuleDetailPanel met prijsoverschrijving, PriceComparisonPage en wizard-routing

### Phase 3: Business Case
**Goal**: Migratie huidig → nieuw Cito-platform met financieel verschil, tijdswinst en meerjarenprojectie
**Requirements**: BCASE-01, BCASE-02, BCASE-03, BCASE-04, BCASE-05, BCASE-06, BCASE-07
**Plans**: 2 plans

### Phase 4: Interne Modus & Doelgroepen
**Goal**: Sales-signalen, gevoeligheidsanalyse, doelgroep-perspectieven, print en clipboard-export
**Requirements**: MODE-02, MODE-03, MODE-04, MODE-05, DOELGR-01, DOELGR-02, DOELGR-03, EXPORT-01, EXPORT-02
**Plans**: 2 plans

### Phase 5: AI & Polish
**Goal**: AI-validatie, prijsinvoer en tablet-optimalisatie
**Requirements**: INPUT-02, INPUT-03, AI-01, AI-02, AI-03, UX-01, UX-02
**Plans**: 2 plans

</details>

### 🚧 v2.0 Sales Intelligence Platform (In Progress)

**Milestone Goal:** Van statische prijsvergelijker naar dynamisch sales intelligence platform met multi-school persistentie, AI-intake, schoolprofielen, waarde-engine en DMU-exports.

**Phase Numbering:**
- Integer phases (6, 7, 8...): Planned milestone work
- Decimal phases (7.1, 7.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 6: Multi-School Data Layer** - IndexedDB persistentie, v1 migratie, navigatie-scaffolding en basisweergave
- [ ] **Phase 7: School Intelligence** - Schoolprofielen met CRM-lite functionaliteit: contactpersonen, productgebruik, pipeline, gespreksnotities
- [ ] **Phase 8: AI Intake & Prijsbeheer** - AI-gestuurde gespreksverwerking en prijsinvoer/-beheer met validatie
- [ ] **Phase 9: Prijsvergelijking & Gevoeligheid** - Uitgebreide vergelijkingsengine met DIA-pakketten, hybride scenario, differentiators en gevoeligheidsanalyse
- [ ] **Phase 10: Waarde-engine & Migratie** - Tijdwinst in euro's, meerjarenprojectie, migratie-businesscase en upsell-detectie
- [ ] **Phase 11: DMU-Export & Offline** - PDF-rapporten per DMU-rol, clipboard-export en offline werking

## Phase Details

### Phase 6: Multi-School Data Layer
**Goal**: Applicatie ondersteunt meerdere schoolprofielen met persistente opslag, bestaande v1-data behouden, en navigatie met browser-history
**Depends on**: v1.0 (Phase 5)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, MODE-01, MODE-03
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een nieuw schoolprofiel aanmaken, opslaan, heropenen en verwijderen — data blijft bewaard na browser-herstart
  2. Bestaande v1-data (wizard inputs, prijsoverschrijvingen) is automatisch beschikbaar als schoolprofiel in de v2-interface zonder handmatige actie
  3. Gebruiker kan via browser-back-button terug navigeren naar vorige view en via URL direct naar een specifieke school/view gaan
  4. Alle UI-tekst is in formeel Nederlands (u-vorm) en de interface is bruikbaar op tablet met touch
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — Dexie database, SchoolRecord types, CRUD operations, slug utility en v1 localStorage migratie (TDD)
- [ ] 06-02-PLAN.md — TanStack Router setup met code-based routing, route guards en smart redirect
- [ ] 06-03-PLAN.md — Store refactoring, SchoolLayout, school overview UI, migration wizard, wizard naamveld en App.tsx rewrite

### Phase 7: School Intelligence
**Goal**: Accountmanager heeft per school een compleet profiel met contactpersonen, productgebruik, gesprekshistorie en pipeline-status — en kan snel de juiste school vinden
**Depends on**: Phase 6
**Requirements**: SCHOOL-01, SCHOOL-02, SCHOOL-03, SCHOOL-04, SCHOOL-05, SCHOOL-06, PRIJS-07
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een school aanmaken met basisgegevens en per school vastleggen welke modules van welke aanbieder worden gebruikt, inclusief prijzen en bron
  2. Gebruiker kan contactpersonen (naam, rol, DMU-positie) en gespreksnotities (datum, contactpersoon, kernpunten) per school beheren
  3. Gebruiker kan pipeline-status instellen (prospect t/m at-risk) en ziet een doorzoekbaar schooloverzicht gesorteerd op laatst gebruikt met status-badges
  4. Schoolspecifieke prijsoverschrijvingen (deals/kortingen) worden apart opgeslagen per school en worden niet verward met publicatieprijzen
**Plans**: 4 plans

Plans:
- [ ] 07-01-PLAN.md — CRM-lite data layer: types, Dexie v2 schema migratie, CRUD operaties, Zod schemas en timeline utility
- [ ] 07-02-PLAN.md — Profiel-UI: tab-routing, ProfileHeader, TabNavigation, DashboardTab, ComparisonTab, ProductsTab en pipeline-management
- [ ] 07-03-PLAN.md — ContactsTab met CRUD en DMU-mapping, ConversationsTab met tijdlijn, tags, zoekfunctie en kanban-actielijst
- [ ] 07-04-PLAN.md — Schooloverzicht: FilterBar, ViewToggle, CardModeToggle, PipelineKanbanView met drag & drop en visuele verificatie

### Phase 8: AI Intake & Prijsbeheer
**Goal**: Accountmanager kan tijdens een telefoongesprek vrije tekst invoeren die automatisch wordt gestructureerd in schooldata, en kan prijzen beheren via handmatige invoer of AI-documentextractie
**Depends on**: Phase 7
**Requirements**: INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-04, INTAKE-05, PRIJSMGT-01, PRIJSMGT-02, PRIJSMGT-03, PRIJSMGT-04
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan tijdens een gesprek vrije tekst invoeren die real-time (streaming) wordt gestructureerd — modules, aanbieders, prijzen en contactpersonen worden herkend met fuzzy matching
  2. Geextraheerde data verschijnt op een bevestigingsscherm waar de gebruiker kan corrigeren voordat het wordt opgeslagen — prijzen buiten bekende ranges worden gemarkeerd als ongebruikelijk
  3. AI intake voegt toe aan een bestaand schoolprofiel zonder eerdere data te overschrijven
  4. Gebruiker kan prijzen handmatig invoeren/bijwerken met bron en verificatiedatum, en prijzen ouder dan 6 maanden worden automatisch als "mogelijk verouderd" gemarkeerd
  5. Gebruiker kan een prijsdocument (PDF) uploaden en de AI extraheert prijzen die ter goedkeuring worden getoond — nooit automatisch doorgevoerd
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD
- [ ] 08-03: TBD

### Phase 9: Prijsvergelijking & Gevoeligheid
**Goal**: Accountmanager ziet een compleet, interactief prijsvergelijkingsoverzicht met DIA-pakketlogica, hybride scenario's, onderscheidend vermogen en gevoeligheidsanalyse voor interne voorbereiding
**Depends on**: Phase 7 (schoolprofielen), Phase 8 (prijsdata)
**Requirements**: PRIJS-01, PRIJS-02, PRIJS-03, PRIJS-04, PRIJS-05, PRIJS-06, PRIJS-08, GEVOEL-01, GEVOEL-02, GEVOEL-03, MODE-02
**Success Criteria** (what must be TRUE):
  1. Gebruiker ziet per module de kosten per leerling en totaalkosten per aanbieder naast elkaar, met visueel staafdiagram en uitklapbare berekeningsdetails
  2. Gebruiker kan prijzen handmatig overschrijven met bronvermelding en de vergelijking herberekent reactief — DIA-pakketprijzen worden automatisch correct berekend bij 3+ modules
  3. Gebruiker ziet per module wat Cito biedt dat de concurrent niet biedt (en omgekeerd) als onderscheidend vermogen
  4. Hybride scenario berekent per module apart de besparingen waar een school van aanbieder wisselt
  5. In interne modus ziet de gebruiker gevoeligheidsanalyse met 10%/20% kortingsscenario's, het effect per module, en het break-even kortingspercentage — plus sales-signalen per module
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD
- [ ] 09-03: TBD

### Phase 10: Waarde-engine & Migratie
**Goal**: Accountmanager kan de totale waarde van Cito onderbouwen: prijsverschil plus tijdwinst in euro's, meerjarenprojectie, migratie-businesscase en automatische upsell-detectie
**Depends on**: Phase 9 (prijsvergelijking)
**Requirements**: WAARDE-01, WAARDE-02, WAARDE-03, WAARDE-04, MIGR-01, MIGR-02, MIGR-03, SCHOOL-07
**Success Criteria** (what must be TRUE):
  1. Gebruiker ziet per taak (rechten, resetten, inloggen, planning, koppeling) de concrete uren bespaard met bewerkbare aannames, en kan een uurtarief instellen om tijdsbesparing in euro's te zien
  2. Gebruiker ziet de totale waarde van de overstap: financieel verschil plus tijdsbesparing in euro's, met meerjarenprojectie over 1, 3 en 5 jaar inclusief cumulatieve besparing en break-even punt
  3. Gebruiker ziet het financieel verschil tussen huidig en nieuw Cito-platform per module en als totaal, met een gecombineerde businesscase (prijsverschil + tijdwinst + meerjarenprojectie)
  4. Systeem detecteert automatisch upsell-kansen: modules waar school een concurrent gebruikt en overstap naar Cito voordelig is
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD
- [ ] 10-03: TBD

### Phase 11: DMU-Export & Offline
**Goal**: Accountmanager kan na elk gesprek direct een op de DMU afgestemd PDF-rapport genereren en de applicatie werkt offline op tablet
**Depends on**: Phase 10 (waarde-engine, migratie), Phase 9 (prijsvergelijking)
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04, EXPORT-05, ARCH-05
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een PDF-rapport genereren per DMU-rol: coordinator (tijdwinst, dagelijks gebruik), MT (overzicht, onderbouwing, strategische waarde), finance (euro's, meerjarenprojectie, terugverdientijd)
  2. PDF-rapporten bevatten schoolspecifieke data, Cito-huisstijl (Primary #003082, Accent #FF6600), bronvermelding en disclaimer
  3. Gebruiker kan de vergelijking kopiëren naar clipboard als geformatteerde samenvatting
  4. Applicatie werkt offline op tablet na eerste laden — service worker cacht assets en data
**Plans**: TBD

Plans:
- [ ] 11-01: TBD
- [ ] 11-02: TBD
- [ ] 11-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 6 → 7 → 8 → 9 → 10 → 11
(Decimal phases, if inserted, execute between their surrounding integers)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Fundament | v1.0 | 3/3 | Complete | 2026-03-20 |
| 2. Prijsvergelijking | v1.0 | 3/3 | Complete | 2026-03-20 |
| 3. Business Case | v1.0 | 2/2 | Complete | 2026-03-20 |
| 4. Interne Modus & Doelgroepen | v1.0 | 2/2 | Complete | 2026-03-20 |
| 5. AI & Polish | v1.0 | 2/2 | Complete | 2026-03-20 |
| 6. Multi-School Data Layer | v2.0 | 0/3 | Planning complete | - |
| 7. School Intelligence | v2.0 | 0/4 | Planning complete | - |
| 8. AI Intake & Prijsbeheer | v2.0 | 0/3 | Not started | - |
| 9. Prijsvergelijking & Gevoeligheid | v2.0 | 0/3 | Not started | - |
| 10. Waarde-engine & Migratie | v2.0 | 0/3 | Not started | - |
| 11. DMU-Export & Offline | v2.0 | 0/3 | Not started | - |
