# Cito Rekentool — Prijsvergelijking

React SPA (Vite + TypeScript + Tailwind v4) waarmee Cito-consultants de kosten vergelijken tussen toetsaanbieders (Cito, DIA, JIJ) voor Nederlandse middelbare scholen. Wizard verzamelt schoolprofiel → engine berekent prijzen → vergelijkingsoverzicht.

# Commands

```bash
npm run dev       # Dev server (Vite)
npm run build     # Type-check + production build
npm run lint      # ESLint
npx vitest run    # Alle tests
npx vitest        # Watch mode
```

# Rules

- IMPORTANT: Alle UI-tekst in het Nederlands — labels, tooltips, foutmeldingen, alles
- Code comments en variabelenamen in het Engels
- IMPORTANT: Wijzig NOOIT prijsdata in `src/data/default-prices.ts` zonder mijn goedkeuring — dit zijn de actuele tarieven
- Nieuwe componenten: volg het patroon van bestaande wizard steps in `src/features/school-profile/components/`
- Formulieren: altijd react-hook-form + Zod schema (schemas staan in `src/features/school-profile/schemas/`)
- State via Zustand + persist middleware — geen nieuwe React Context of prop drilling
- Tests verplicht bij engine-wijzigingen — `src/engine/__tests__/`
- Pad-alias `@` = `/src` — gebruik dit in imports
- AI-intake gebruikt `claude-haiku-4-5` via `VITE_ANTHROPIC_API_KEY` in `.env.local`

# Architecture — Wat je moet weten

**Views** in `App.tsx` via `useState<View>`:
- `wizard` — 5-staps formulier (Niveaus → Leerlingen → Modules → Situatie → Doel)
- `intake` — AI gespreksnotities-paneel (pre-fills wizard vanuit vrije tekst)
- `comparison` — marktoverzicht Cito vs. DIA vs. JIJ (scenario A, geen huidige situatie)
- `current-vs-proposed` — Huidig vs. Cito (scenario A + huidige aanbieder per module)
- `migration` — Business case migratie huidig → nieuw Cito-platform (scenario B)

**Data flow**:
Intake/Wizard → `useSchoolProfileStore` → `usePriceComparisonStore.initialize()` → engine → UI

**Twee Zustand stores** (beide met `persist` middleware → localStorage):
- `useSchoolProfileStore` — wizard inputs: levels, studentCounts, selectedModules, **moduleSetups** (huidige situatie per module), scenario
- `usePriceComparisonStore` — resultaten + prijsoverschrijvingen + migratie-instellingen. Leest school profile via `getState()` (niet via hooks). Heeft draft overrides en applied overrides — `recalculate()` merged beide lagen.

**Drie engines** (alle pure functions, geen side effects):
- `src/engine/price-comparison.ts` — `calculateComparison()`: Cito vs. DIA vs. JIJ op publicatieprijzen
- `src/engine/current-vs-proposed.ts` — `calculateCurrentVsProposed()`: huidige kosten vs. Cito
- `src/engine/migration.ts` — `calculateMigration()`: business case huidig → nieuw Cito-platform

**AI intake** (`src/lib/ai-intake.ts`):
- Gebruikt `claude-haiku-4-5` (snel, real-time tijdens gesprek)
- Structured output via `@anthropic-ai/sdk` + Zod + `messages.parse()`
- API-sleutel in `.env.local` als `VITE_ANTHROPIC_API_KEY`

**Migratieprijzen** (`src/data/cito-migration-prices.ts`):
- Bevat placeholder tarieven — vul werkelijke tarieven in via VS Code
- NOOIT wijzigen zonder goedkeuring

# Gotchas

- IMPORTANT: Alle engine-functies zijn pure functions — geen side effects, geen state-mutaties. Houd dit zo.
- `usePriceComparisonStore` leest via `getState()`, NIET via hooks — dit voorkomt stale closures. Niet veranderen.
- `setSelectedModules` in school-profile store synct automatisch `moduleSetups` (behoudt bestaande, voegt nieuwe toe met 'geen').
- Routing in App.tsx: Scenario B → `migration`. Scenario A + moduleSetups met provider ≠ 'geen' → `current-vs-proposed`. Scenario A zonder → `comparison` (fallback).
- IMPORTANT: Drie providers (`cito`, `dia`, `jij`) zijn hard-coded in de comparison engine. Nieuwe provider toevoegen raakt meerdere bestanden.
- Static data in `src/data/` en types in `src/models/` — twee aparte mappen, niet verwarren.
- Zod schemas in `schemas/` moeten matchen met form fields — wijzig ze altijd samen.
- Wizard is 5 stappen (index 0–4). TOTAL_STEPS = 5 in WizardShell. ProgressBar labels: Niveaus, Leerlingen, Modules, Situatie, Doel.

# Workflow

- IMPORTANT: Na elke goedgekeurde wijziging (bugfix, feature, verbetering): automatisch committen EN pushen naar remote. Niet wachten tot de gebruiker erom vraagt. Build moet eerst slagen.
- IMPORTANT: Run `npm run build` voordat je klaar bent — moet slagen zonder errors
- Bij engine-wijzigingen: run `npx vitest run` en controleer dat alle tests slagen
- Nieuwe wizard step? Maak component + Zod schema + test — alle drie
- IMPORTANT: Wijzig geen prijzen, aannames of differentiators in `src/data/` zonder mijn toestemming
- Tests staan in `__tests__/` naast de code — houd dit patroon aan
