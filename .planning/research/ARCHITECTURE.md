# Architecture Patterns

**Domain:** Interactive pricing comparison & ROI calculator (Dutch education market)
**Researched:** 2026-03-20

## System Overview

The Rekentool is a **stateless, client-side single-page application** with embedded pricing data, no backend. It takes user inputs (school size, selected modules, scenario), runs calculations, and renders comparison views with charts and print export. There are two user modes (internal/external) and three scenarios (A, B, future C).

The architecture follows a **layered separation** with four clear boundaries:

```
[Data Layer] --> [Calculation Engine] --> [State / Scenario Manager] --> [UI Layer] --> [Export Layer]
```

All data is embedded at build time. No API calls. No authentication. No persistence.

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Data Layer** | Static pricing data, product catalogs, time-savings parameters, competitor info | Calculation Engine (read-only) |
| **Calculation Engine** | Pure functions: price comparisons, time savings, multi-year projections | State Manager (receives inputs, returns results) |
| **State Manager** | User inputs, selected scenario, active mode, current configuration | All UI components, Calculation Engine |
| **Scenario Manager** | Scenario A/B/C definitions, which inputs apply to which scenario | State Manager, UI Layer |
| **Mode Controller** | Internal vs. external mode toggle, controls feature visibility | All UI components |
| **Input Components** | School parameters, module selection, hourly rate, custom prices | State Manager |
| **Display Components** | Results tables, comparison views, per-audience summaries | State Manager (read), Calculation Engine (derived) |
| **Chart Components** | Bar charts for price comparison, multi-year projections | Display Components (receives computed data) |
| **Export Layer** | Print stylesheet, clipboard copy | Display Components (reads rendered output) |

## Recommended Project Structure

```
src/
  data/
    pricing/
      cito-current.ts        # Current Cito platform prices per module
      cito-new.ts             # New Cito platform prices per module
      competitors/
        dia.ts                # DIA prices per module
        jij-iep.ts            # JIJ (IEP) prices per module
    modules.ts                # Module definitions (LVS Rekenen, Taal, etc.)
    time-savings.ts           # Task definitions with time estimates (old vs new)
    price-metadata.ts         # Verification status, dates, staleness rules

  engine/
    price-comparison.ts       # Scenario A: Cito vs competitor per module
    migration-calculator.ts   # Scenario B: old vs new platform costs
    time-savings-calculator.ts # Scenario B: hours saved per task
    time-value-calculator.ts  # Hours * hourly rate = euro value
    multi-year-projection.ts  # 1, 3, 5 year projections
    sensitivity.ts            # Internal mode: 10%/20% discount scenarios
    types.ts                  # Shared types for all engine functions

  state/
    app-context.tsx           # React Context for app-wide state
    use-school-config.ts      # Hook: school size, selected modules
    use-scenario.ts           # Hook: active scenario (A/B)
    use-mode.ts               # Hook: internal/external mode
    use-calculation.ts        # Hook: runs engine, memoizes results

  components/
    layout/
      AppShell.tsx            # Top-level layout, mode indicator
      ScenarioTabs.tsx        # A / B scenario switcher
      ModeToggle.tsx          # Internal / external toggle (hidden in external builds)

    inputs/
      SchoolSizeInput.tsx     # Number of students
      ModuleSelector.tsx      # Checkboxes for modules
      HourlyRateInput.tsx     # Configurable hourly rate (scenario B)
      CustomPriceInput.tsx    # Manual price override (internal mode)

    results/
      PriceComparisonTable.tsx    # Scenario A: side-by-side module prices
      MigrationSummary.tsx        # Scenario B: cost difference overview
      TimeSavingsBreakdown.tsx    # Scenario B: per-task time savings
      TimeSavingsValue.tsx        # Scenario B: time savings in euros
      MultiYearProjection.tsx     # Scenario B: 1/3/5 year view
      SensitivityAnalysis.tsx     # Internal: what-if discount scenarios
      PriceStatusBadge.tsx        # Verified / manual / stale indicator

    charts/
      ComparisonBarChart.tsx      # Cito vs competitor bar chart
      ProjectionLineChart.tsx     # Multi-year cost projection

    export/
      PrintView.tsx               # Print-optimized layout (all sections expanded)
      CopyToClipboard.tsx         # Summary text to clipboard

    audience/
      CoordinatorView.tsx         # Time savings focus
      DirectionView.tsx           # Decision summary focus
      FinanceView.tsx             # Euro + multi-year focus

  styles/
    print.css                 # @media print styles
    theme.ts                  # Cito brand colors, typography

  App.tsx
  main.tsx
```

## Architectural Patterns

### Pattern 1: Pure Calculation Engine (no React, no side effects)

The calculation engine is the heart of the tool and MUST be pure TypeScript functions with zero React dependencies. This enables unit testing without component rendering, reuse across scenarios, and predictable outputs.

**What:** All pricing math, time savings, projections live in `engine/` as pure functions.
**When:** Always. Every calculation goes through the engine, never inline in components.

```typescript
// engine/price-comparison.ts
interface ModuleComparison {
  moduleId: string;
  moduleName: string;
  citoPrice: number;
  competitorPrice: number | null;
  difference: number | null;
  citoPerStudent: number;
  competitorPerStudent: number | null;
}

export function compareModulePrices(
  selectedModules: string[],
  studentCount: number,
  competitor: CompetitorId,
  priceOverrides?: Map<string, number>  // internal mode
): ModuleComparison[] {
  // Pure function: data in, results out
}
```

```typescript
// engine/time-savings-calculator.ts
export function calculateTimeSavings(
  tasks: TimeSavingsTask[],
  schoolConfig: SchoolConfig
): TimeSavingsResult {
  // Pure: task definitions + school size = hours saved
}

export function timeSavingsToEuros(
  savings: TimeSavingsResult,
  hourlyRate: number
): number {
  // Pure: hours * rate
}
```

### Pattern 2: Mode as Context, Not Conditionals Everywhere

**What:** A single React Context provides the current mode. Components that differ between modes use a mode-aware wrapper, not scattered if-statements.

**When:** Any component that behaves differently in internal vs. external mode.

```typescript
// state/use-mode.ts
type AppMode = 'internal' | 'external';

const ModeContext = createContext<AppMode>('external');

export function useMode(): AppMode {
  return useContext(ModeContext);
}

// Usage pattern: mode-aware component
export function useIsInternal(): boolean {
  return useMode() === 'internal';
}
```

```typescript
// components/results/SensitivityAnalysis.tsx
export function SensitivityAnalysis({ results }: Props) {
  const isInternal = useIsInternal();
  if (!isInternal) return null;  // Simply not rendered in external mode

  return <div>...</div>;
}
```

**Key principle:** External mode is the DEFAULT. Internal mode ADDS features. Never build internal-first and strip things out -- build external-first and layer internal features on top. This prevents accidental data leakage.

### Pattern 3: Scenario as State Machine

**What:** Each scenario (A, B, future C) is a distinct configuration that defines which inputs are needed, which engine functions run, and which result components render.

**When:** Switching between scenarios, determining what to show.

```typescript
// state/use-scenario.ts
interface ScenarioConfig {
  id: 'A' | 'B';
  label: string;
  requiredInputs: InputType[];
  engineFunctions: EngineFunction[];
  resultComponents: ComponentType[];
}

const SCENARIOS: Record<string, ScenarioConfig> = {
  A: {
    id: 'A',
    label: 'Cito vs. concurrentie',
    requiredInputs: ['schoolSize', 'moduleSelection', 'competitor'],
    engineFunctions: ['compareModulePrices'],
    resultComponents: [PriceComparisonTable, ComparisonBarChart],
  },
  B: {
    id: 'B',
    label: 'Overstap nieuw platform',
    requiredInputs: ['schoolSize', 'moduleSelection', 'hourlyRate'],
    engineFunctions: ['migrationCost', 'timeSavings', 'multiYearProjection'],
    resultComponents: [MigrationSummary, TimeSavingsBreakdown, MultiYearProjection],
  },
};
```

This makes adding Scenario C later straightforward: define its config, wire the inputs, done.

### Pattern 4: Data with Metadata

**What:** Every price point carries metadata: source, verification status, last verified date.

**When:** All pricing data, always.

```typescript
// data/price-metadata.ts
interface PricedItem {
  moduleId: string;
  pricePerStudent: number;
  source: 'publication' | 'manual' | 'ai-extracted';
  verificationStatus: 'verified' | 'manual' | 'possibly-outdated' | 'unknown';
  lastVerified: string;  // ISO date
  stalenessThresholdDays: number;  // default 180
}

export function isPriceStale(item: PricedItem): boolean {
  const daysSinceVerified = differenceInDays(new Date(), new Date(item.lastVerified));
  return daysSinceVerified > item.stalenessThresholdDays;
}
```

### Pattern 5: Audience-Driven Result Views

**What:** The same calculated data is presented differently per audience (coordinator, direction, finance). These are NOT separate calculations -- they are different projections of the same result set.

**When:** Displaying results in Scenario B.

```typescript
// The calculation runs once:
const results = useCalculationResults();

// Each audience view selects and emphasizes different parts:
<CoordinatorView results={results} />   // Emphasizes: hours saved per task
<DirectionView results={results} />     // Emphasizes: summary, recommendation
<FinanceView results={results} />       // Emphasizes: euros, multi-year
```

## Data Flow

### Input to Output Flow

```
User enters school size (e.g., 800 students)
  |
User selects modules (e.g., LVS Rekenen, Capaciteitentest)
  |
User picks scenario (A or B)
  |
  v
State Manager aggregates: { studentCount, modules[], scenario, mode, hourlyRate? }
  |
  v
Calculation Engine (pure functions):
  Scenario A: compareModulePrices(modules, studentCount, competitor)
  Scenario B: migrationCost(...) + timeSavings(...) + multiYear(...)
  |
  v
Computed results stored in state (memoized via useMemo)
  |
  v
Result components render from computed results
  |
  v
Chart components receive same computed results, render visualizations
  |
  v
Export: print triggers @media print CSS (all sections expanded, charts rendered)
        clipboard copies pre-formatted text summary
```

### Mode Flow

```
Mode toggle (URL param or hidden toggle)
  |
  v
ModeContext provides 'internal' | 'external' to all components
  |
  v
Internal-only components: conditionally rendered (SensitivityAnalysis, CustomPriceInput, SalesSignals)
External components: always rendered
  |
  v
Calculation engine receives priceOverrides only in internal mode
  |
  v
Internal mode adds: discount scenarios, market averages, manual price entry
External mode shows: publication prices only, neutral language
```

### Print/Export Flow

```
User clicks "Print" or "Afdrukken"
  |
  v
PrintView component: renders ALL sections in expanded state
  |
  v
@media print CSS:
  - Hides: navigation, mode toggle, input controls
  - Shows: all result sections, expanded calculations, charts
  - Adjusts: page breaks, Cito branding header/footer
  |
  v
Browser native print dialog (save as PDF or print)

User clicks "Kopieer samenvatting"
  |
  v
Generate plain-text summary from calculation results
  |
  v
navigator.clipboard.writeText(summary)
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calculations in Components
**What:** Putting price math directly in React components.
**Why bad:** Untestable, duplicated, breaks when component refactors. Makes it impossible to share logic between Scenario A, B, and future C.
**Instead:** All math in `engine/` as pure functions. Components only render results.

### Anti-Pattern 2: Internal Mode as a Separate App
**What:** Building two separate codebases or entry points for internal vs. external.
**Why bad:** Feature drift, double maintenance, bugs fixed in one but not the other.
**Instead:** Single codebase, mode as context. Internal features are additive layers on top of the external base.

### Anti-Pattern 3: Hardcoded Competitor Data in Components
**What:** Scattering competitor names, prices, module mappings throughout JSX.
**Why bad:** Adding a new competitor (or updating prices) requires touching dozens of files.
**Instead:** All competitor data in `data/pricing/competitors/`. Components are competitor-agnostic, driven by data structures.

### Anti-Pattern 4: Generating PDF Server-Side
**What:** Adding a backend just for PDF generation.
**Why bad:** Violates the stateless, no-backend constraint. Adds infrastructure for a single feature.
**Instead:** Use `@media print` CSS for print-optimized output. Browser's "Save as PDF" is the PDF export. Use `react-to-print` if programmatic trigger is needed.

### Anti-Pattern 5: Premature Audience Fragmentation
**What:** Building completely separate page flows for coordinator, director, and finance from day one.
**Why bad:** Over-engineering. The data is the same, only emphasis differs.
**Instead:** Build one results view first. Add audience-specific emphasis (tabs or accordion sections) once the calculation engine and core UI are stable.

## Suggested Build Order

Based on dependencies between components:

| Order | Component | Depends On | Rationale |
|-------|-----------|------------|-----------|
| 1 | **Data Layer** | Nothing | Foundation. Define TypeScript types for modules, prices, metadata. Populate with real Cito and competitor prices. Everything else reads from this. |
| 2 | **Calculation Engine** | Data Layer | Pure functions, fully unit-testable without any UI. Validates that the business logic is correct before any visual work. |
| 3 | **State Management** | Engine types | React Context + hooks. Wire up school config, scenario selection, mode toggle. |
| 4 | **Input Components** | State Management | School size, module selector, scenario tabs. The "left side" of the tool. |
| 5 | **Scenario A Results** | Engine + State | Price comparison table + bar chart. First visible output. Most straightforward scenario. |
| 6 | **Scenario B Results** | Engine + State | Migration costs + time savings. More complex, benefits from patterns established in step 5. |
| 7 | **Mode Layer** | State + Results | Internal/external toggle. Layer internal-only features (sensitivity, overrides) on top of working external mode. |
| 8 | **Audience Views** | Results components | Different emphasis of same data. Only makes sense once results are stable. |
| 9 | **Export** | All display components | Print CSS + clipboard. Last because it depends on all visual output being finalized. |

**Key dependency insight:** Steps 1-2 (Data + Engine) carry zero UI risk. They can be built, tested, and validated against real pricing data before any React code is written. This de-risks the most critical part of the tool: correctness of calculations.

## Scalability Considerations

| Concern | Current (2 competitors) | Future (5+ competitors) | Mitigation |
|---------|------------------------|-------------------------|------------|
| Data structure | Static TS files per competitor | Same pattern, more files | Competitor data follows interface; adding one = adding one file |
| Module mapping | Manual cross-reference | Needs mapping table | Build module equivalence mapping from day one |
| Scenario C | Not built | Combination of A+B | Scenario config pattern makes this additive, not invasive |
| Price staleness | Manual tracking | Still manual, more to track | Metadata with `lastVerified` dates flags stale data automatically |
| Print layout | Single page | Multi-page with breaks | CSS `page-break-before` on section boundaries from the start |

## Sources

- [Martin Fowler - Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) - Layered architecture patterns
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025) - Context + hooks for medium-complexity apps
- [react-to-print on npm](https://www.npmjs.com/package/react-to-print) - Client-side print trigger library
- [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) - Fallback for programmatic PDF if needed
- [React Feature Flags pattern](https://github.com/sergiodxa/flagged) - Mode toggling via context
- [GeeksforGeeks - React Architecture Patterns](https://www.geeksforgeeks.org/reactjs/react-architecture-pattern-and-best-practices/) - Container/presentation separation
