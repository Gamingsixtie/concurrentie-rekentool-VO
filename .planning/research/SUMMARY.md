# Project Research Summary

**Project:** Rekentool VO -- Prijsvergelijking & Overstap Business Case
**Domain:** Interactive B2B pricing comparison and ROI calculator (Dutch VO education market)
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

This is a stateless, client-side single-page sales enablement tool for Cito's account managers, designed for use with Dutch secondary schools (VO). It solves two problems: (A) giving schools a trustworthy side-by-side price comparison between Cito, DIA, and JIJ, and (B) giving schools a concrete business case for migrating to Cito's new platform, including time-savings-to-euros conversion. The recommended build is React 19 + TypeScript + Vite + Tailwind CSS + Recharts, deployed as static files with no backend. This stack is decisive for one reason: the charting and print ecosystem (Recharts renders SVG for crisp printing; react-to-print manages print lifecycle) is materially better in React than any alternative. The tool runs fully in the browser, is Dutch-only, and requires no server, database, or user accounts.

The most important architectural insight from research is that the calculation engine must be built as pure TypeScript functions entirely separate from the React UI. This is not just a code quality preference — it is how you guarantee that pricing calculations are correct and auditable. The engine should be fully unit-tested before a single component is written. Data lives as typed TypeScript modules embedded at build time; pricing metadata (source, verification date, staleness threshold) must be baked into the data model from day one, because adding it later requires touching every price record.

The single greatest risk is credibility loss: 65% of B2B buyers distrust vendor-provided ROI tools before they even open one. This tool is built by Cito comparing Cito. Every design decision must fight this perception. Concretely: external mode must show cases where competitors are cheaper or comparable; all calculations must be fully decomposable; time savings assumptions must be editable by the user; and internal mode must be architecturally separated (separate URL path, access gate) so it cannot accidentally appear in a printed document handed to a school. These are Phase 1 decisions that cannot be retrofitted.

## Key Findings

### Recommended Stack

The stack is narrow and well-justified. React 19 with TypeScript and Vite 8 covers the framework. Tailwind CSS 4 handles styling with a critical advantage: the built-in `print:` variant eliminates the need for a separate print CSS file and makes print-optimized layout a first-class concern during development. Recharts 3 handles visualization because it renders SVG (crisp at any print resolution) rather than Canvas (blurry when printed). react-to-print manages the browser print lifecycle. State is managed entirely with React's built-in hooks — `useReducer` for the calculation engine, `useState` for UI — with no external state library needed. All pricing data is embedded as TypeScript modules at build time; there is no backend and no API calls.

**Core technologies:**
- React 19 + TypeScript 5.x: UI framework with type-safe calculations — prevents bugs in financial logic, largest ecosystem for charting/print tooling
- Vite 8: Build tool — produces a static `dist/` folder deployable anywhere, 10-30x faster builds than Webpack
- Tailwind CSS 4: Utility-first styling — `print:` variants control print layout without separate stylesheets; CSS-first config with Cito brand colors as CSS variables
- Recharts 3.8: SVG-based charting — prints cleanly at native resolution; Canvas-based alternatives (Chart.js) are disqualified for a print-heavy tool
- react-to-print 3.3: Print trigger — 833K weekly downloads, handles the expand-all-sections-then-print lifecycle
- Vitest 3: Unit testing — critical for validating pricing calculations before any UI work begins

### Expected Features

Research via NN/g calculator UX patterns and B2B comparison tool analysis identified a clear feature hierarchy. Scenario A (price comparison) and Scenario B (migration business case) are independent workstreams that can be sequenced or built in parallel. Scenario C (combined financial + migration case) should emerge as a composition of A and B, not be built separately.

**Must have (table stakes):**
- School profile input (student count, levels) — foundation for all per-pupil calculations
- Module selection against Cito, DIA, JIJ catalogs — the core comparison unit
- Per-pupil and total cost breakdown — the primary output format in Dutch education pricing
- Price source attribution and freshness indicator — trust through transparency; stale prices destroy credibility
- Expandable calculation detail — "show your work" is mandatory for a vendor-built comparison tool
- Bar chart comparison — visual output is expected alongside tables
- Print-optimized view — how decisions travel in Dutch VO (printed for MT overleg, rector approval)
- No registration wall — stateless tool; any friction destroys adoption

**Should have (competitive differentiators):**
- Time savings calculator with task-level granularity (Scenario B) — converts abstract "better platform" into concrete euros
- Hours-to-euros conversion with adjustable hourly rate sourced from CAO VO salary scales
- Multi-year projection (1, 3, 5 year) with visible uncertainty ranges
- Payback period visualization — the killer question for any platform migration
- Internal/external mode toggle with architectural separation (not just CSS visibility)
- Sensitivity analysis for competitor discount scenarios (internal mode only)
- Audience-specific result emphasis views (coordinator, directie, finance)
- Clipboard copy with HTML formatting preserved for Outlook/Word paste

**Defer to v2+:**
- Document upload for price data extraction (High complexity, not needed if prices are pre-loaded)
- AI-powered price lookup (High complexity; validate feasibility before committing)
- Scenario C as explicit feature (emerges naturally once A and B are stable)
- Price verification workflow / admin interface

### Architecture Approach

The architecture is a five-layer pipeline: Data Layer (embedded TypeScript) → Calculation Engine (pure functions) → State Manager (React Context + hooks) → UI Layer (components) → Export Layer (print CSS + clipboard). The critical boundary is between the engine and the UI: no pricing math lives in components. This separation enables unit testing of all calculations before any visual work begins and makes it trivial to reuse logic across Scenario A, B, and the future Scenario C. Internal/external mode is implemented as React Context with a separate URL path for internal mode (e.g., `/intern/vergelijking`), not as a CSS visibility toggle, because accidental internal-mode leakage in a printed document is a critical trust failure.

**Major components:**
1. Data Layer (`src/data/`) — static TypeScript modules with pricing tables, module catalogs, time-savings parameters, and price metadata (source, verification date, staleness threshold per record)
2. Calculation Engine (`src/engine/`) — pure functions for price comparison, migration cost, time savings, multi-year projection, and sensitivity analysis; zero React dependencies; fully unit-testable
3. State Manager (`src/state/`) — React Context + hooks for school config, active scenario, mode (internal/external), and memoized calculation results
4. Input Components (`src/components/inputs/`) — school size, module selector, hourly rate, custom price override (internal mode only)
5. Result Components (`src/components/results/` + `charts/` + `audience/`) — renders computed results; competitor-agnostic, driven by data structures
6. Export Layer (`src/components/export/` + `src/styles/print.css`) — print layout with all sections expanded, HTML clipboard copy

### Critical Pitfalls

1. **The biased calculator perception** — If the tool always makes Cito look better, it is dismissed on sight and the reputation damage spreads in the tight-knit Dutch VO network. Prevention: external mode must explicitly surface modules where a competitor is cheaper or comparable; all assumptions are editable; conservative defaults are mandatory; have a non-sales reviewer audit the external mode before launch.

2. **Stale pricing data presented as current** — A school spots one wrong competitor price and concludes everything is wrong. Prevention: every price record carries a verification date and 180-day expiration; expired prices require explicit acknowledgment before display; the staleness indicator must be visually prominent (traffic-light badge per cell, not a footnote); a pre-launch price audit sprint and a named post-launch owner for quarterly updates are required.

3. **Internal mode leaking into external presentations** — An account manager accidentally prints in internal mode and hands a school a document showing "sales signals" or "upsell opportunity." Prevention: internal mode on a separate URL path with an access gate; print output in internal mode gets a visible watermark ("INTERN - NIET VOOR EXTERNE VERSPREIDING"); a confirmation step before printing internally; internal-only sections are visually distinct, not just conditionally visible.

4. **Apples-to-oranges module comparison** — Cito, DIA, and JIJ do not structure products identically; forced equivalence in either direction destroys credibility. Prevention: each comparison row has an expandable "what's included" section; rows with non-matching scope display a comparability indicator and explicit "DIA biedt dit niet als apart product aan" where relevant; the data model must support partial comparisons and scope notes from the start.

5. **Time savings claims that feel made up** — A single inflated hours-saved number that a school cannot connect to reality collapses the entire Scenario B business case. Prevention: every claim is decomposable (formula visible: "5 docenten x 3 min per reset x 40 resets = 10 uur"); all inputs are editable sliders; defaults are conservative; ranges are shown rather than point estimates; the data source and measurement methodology are cited.

## Implications for Roadmap

Based on the dependency structure identified across all four research files, the following phase structure is recommended. The architecture's build-order analysis and the pitfalls' phase-relevance mappings converge on the same sequence.

### Phase 1: Foundation — Data Model, Engine, and Architecture Skeleton

**Rationale:** Steps 1 and 2 of the architecture (Data Layer + Calculation Engine) carry zero UI risk and can be built and tested against real pricing data before any React component is written. The pitfalls analysis identifies the data model as the most consequential early decision: if staleness metadata, module scope notes, and price audit-trail fields are not in the data model from day one, every subsequent phase produces misleading output. The internal/external mode architecture must also be decided at this stage — retrofitting it later breaks URLs and workflows.
**Delivers:** Fully unit-tested pricing and time-savings calculation engine; typed data structures for all three competitors; price metadata schema; URL routing structure for internal vs. external mode
**Addresses:** School profile input (data types), module catalog, price source and freshness (data model), internal/external mode separation (architecture)
**Avoids:** Pitfall 2 (stale data), Pitfall 3 (apples-to-oranges), Pitfall 5 (internal mode leaking), Pitfall 13 (no audit trail)

### Phase 2: Scenario A — Price Comparison (External Mode MVP)

**Rationale:** Scenario A (Cito vs. competitors) is the simpler scenario and the primary trust-building output. Building it first establishes the component patterns (results table, bar chart, print layout) that Scenario B reuses. The "looks done but isn't" checklist from PITFALLS.md is a useful acceptance-criteria source for this phase: module comparison is only done when scope differences are documented per row, not just when prices appear in a table.
**Delivers:** Working external-mode tool with school profile input, module selection, per-pupil and total cost comparison, bar chart, price freshness badges, expandable calculation detail, and print-optimized output
**Uses:** React 19, Tailwind CSS 4 (print variants), Recharts 3 (SVG bar chart), react-to-print
**Implements:** Input components, PriceComparisonTable, ComparisonBarChart, PrintView, PriceStatusBadge
**Avoids:** Pitfall 1 (bias — must show competitor wins), Pitfall 7 (broken print), Pitfall 8 (overwhelming inputs — progressive disclosure from the start), Pitfall 10 (discount reality — add disclaimer about publication prices as upper bound)

### Phase 3: Scenario B — Migration Business Case

**Rationale:** Scenario B depends on the same school profile and module selection established in Phase 2, plus additional inputs (hourly rate, task configuration). It can be built against the same engine and state infrastructure. The time savings calculator is the highest-stakes credibility risk in the tool — conservative defaults, editable assumptions, and sourced methodology (CAO VO salary scales) are non-negotiable acceptance criteria before this phase ships.
**Delivers:** Time savings calculator with task-level breakdown, hours-to-euros conversion, multi-year projection (1/3/5 year with uncertainty ranges), payback period visualization, and combined financial summary
**Implements:** TimeSavingsBreakdown, TimeSavingsValue, MultiYearProjection, MigrationSummary, ProjectionLineChart
**Avoids:** Pitfall 4 (time savings credibility — editable assumptions, conservative defaults, cited sources), Pitfall 6 (hourly rate trap — CAO VO based, adjustable), Pitfall 9 (multi-year without caveats — ranges, not point estimates)

### Phase 4: Internal Mode, Sensitivity Analysis, and Audience Views

**Rationale:** Internal mode is built as an additive layer on top of the working external mode — never the reverse. The architecture pattern is external-first by design (mode context, not mode-branching). Audience-specific views are different projections of the same calculated data, not separate calculation flows, so they are straightforward to add once the result components are stable.
**Delivers:** Internal mode with access gate, sensitivity analysis (competitor discount scenarios, break-even thresholds), audience-specific result views (coordinator, directie, finance), clipboard copy with HTML formatting, market average benchmark line
**Implements:** ModeToggle (auth-gated), SensitivityAnalysis, CoordinatorView, DirectionView, FinanceView, CopyToClipboard
**Avoids:** Pitfall 5 (mode leakage — print watermark, visual distinction, confirmation dialog), Pitfall 11 (ugly clipboard — HTML MIME type for Outlook)

### Phase 5: Polish, Tablet Optimization, and Maintenance Infrastructure

**Rationale:** Responsive layout, touch targets, and tablet-specific UX (card view vs. comparison table on narrow screens) are addressed last because layout patterns must be stable before optimizing them. Maintenance infrastructure (price expiration dashboard, update workflow documentation, ownership assignment) must be documented and assigned before launch, not after — the pitfalls research is explicit that post-launch price decay is the most common failure mode for tools of this type.
**Delivers:** iPad-optimized layout, 44x44px touch targets, card view for narrow viewports, pre-launch price audit, maintenance workflow documentation, and named owner for quarterly price updates
**Avoids:** Pitfall 12 (tablet usability), Pitfall 2 (stale prices post-launch — requires process, not just code)

### Phase Ordering Rationale

- Data Layer and Engine first because they are the highest-risk, lowest-visibility work. Discovering that the competitor product catalog doesn't map cleanly to Cito's module structure (Pitfall 3) during Phase 1 is recoverable. Discovering it after the UI is built is expensive.
- Scenario A before Scenario B because A establishes component patterns that B reuses, and A is the core trust-building output. Getting the credibility mechanism right (transparent pricing, bias-free comparison) is more important than the migration business case.
- Internal mode last (within the core features) because the external-first principle is architectural. Internal mode is explicitly additive; building it before external mode is stable creates the risk of the "internal mode as a separate app" anti-pattern identified in ARCHITECTURE.md.
- Scenario C is not a separate phase — it should emerge as a natural composition of Scenario A and B outputs once both are stable.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Scenario B):** The time savings model requires sourced measurement data before implementation. Task times (minutes per reset, minutes per planning sync, etc.) must come from actual customer research or Cito's own usage data, not estimates. The hourly rate model needs specific CAO VO 2025-2026 salary scale references. This is domain-specific and cannot be improvised.
- **Phase 4 (Internal Mode):** The access gate mechanism (URL path + access code vs. environment variable vs. separate build) needs a decision. The stateless constraint means no authentication server is available; the access code approach has tradeoffs that should be evaluated during phase planning.
- **Phase 5 (Maintenance):** The price update workflow requires organizational decisions (who owns it, what tool manages the source data, how changes are reviewed) that are outside the codebase. These must be resolved before launch.

Phases with well-documented patterns (skip research-phase):
- **Phase 1 (Data + Engine):** Pure TypeScript modules and function patterns are standard; the architecture document provides sufficient guidance.
- **Phase 2 (Scenario A UI):** React + Recharts + Tailwind print patterns are well-documented; STACK.md and ARCHITECTURE.md provide sufficient technical guidance.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major technology choices are verified against npm download counts, official release blogs, and comparative analyses. Version compatibility matrix is explicit. The React-over-Svelte decision is well-argued and defensible. |
| Features | HIGH | Feature set is grounded in NN/g research (authoritative UX source), best-in-class examples (Azure TCO Calculator, AWS Migration Evaluator), and Dutch education market context. Table stakes vs. differentiators distinction is clear. |
| Architecture | HIGH | Layered architecture with pure-function engine is a standard, well-documented pattern for calculation-heavy tools. Component boundaries and build order are specific and internally consistent. Anti-patterns are explicitly identified. |
| Pitfalls | HIGH | Pitfalls are sourced from Forrester/Gartner B2B buyer research, EU comparison tool regulatory guidance, and education sales practitioner experience. Each pitfall includes concrete detection criteria and phase-specific relevance. |

**Overall confidence:** HIGH

### Gaps to Address

- **Competitor product catalog completeness:** The research establishes the data model structure, but the actual module-by-module mapping between Cito, DIA, and JIJ products has not been completed. This is a content gap, not a technical one. It must be resolved before Phase 2 can deliver a trustworthy comparison. Requires product management input.
- **Time savings measurement data:** The Scenario B calculator design is sound, but the actual task-time estimates (minutes per specific task type, frequency per school size) are not in the research. These numbers must come from Cito's customer success data or structured user interviews. Placeholder values will not survive scrutiny.
- **CAO VO 2025-2026 salary scale specifics:** The hourly rate default needs a specific schaal and trede reference. The research recommends CAO VO as the source but does not provide the exact number. This is a 30-minute lookup that should be done before Phase 3.
- **Internal mode access control mechanism:** The research identifies the requirement (separate URL path, access gate) but not the implementation. For a stateless tool, the options are: environment-specific build, URL path + hardcoded access code, or a query parameter that is checked client-side. Each has tradeoffs for shareability and security that need a deliberate decision in Phase 4 planning.

## Sources

### Primary (HIGH confidence)
- [NN/g: 12 Design Recommendations for Calculator and Quiz Tools](https://www.nngroup.com/articles/recommendations-calculator/) — UX patterns for interactive calculators
- [NN/g: Slider Design Rules of Thumb](https://www.nngroup.com/articles/gui-slider-controls/) — input control UX
- [Azure TCO Calculator](https://azure.microsoft.com/en-us/pricing/tco/calculator/) — best-in-class TCO comparison tool reference
- [AWS Migration Evaluator](https://aws.amazon.com/migration-evaluator/) — migration business case tooling reference
- [Vite 8.0 announcement](https://vite.dev/blog/announcing-vite8) — Rolldown bundler, version confirmed
- [Tailwind CSS v4 release](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config, print variants
- [Martin Fowler - Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) — layered architecture patterns
- [Ecosystems.io: ROI Calculators in B2B Sales](https://www.ecosystems.io/blog/roi-calculators-a-burned-out-tool-in-b2b-sales) — Forrester/Gartner buyer skepticism data
- [EU Commission: Key Principles for Comparison Tools](https://commission.europa.eu/system/files/2017-06/key_principles_for_comparison_tools_en.pdf) — regulatory framework for fair comparison methodology

### Secondary (MEDIUM confidence)
- [Recharts npm](https://www.npmjs.com/package/recharts) — v3.8.0 download counts and SVG rendering confirmed
- [react-to-print npm](https://www.npmjs.com/package/react-to-print) — v3.3.0, 833K weekly downloads
- [Best React Chart Libraries 2025 (LogRocket)](https://blog.logrocket.com/best-react-chart-libraries-2025/) — Recharts vs Chart.js print comparison
- [Elastic Path: 20 Tips for Product Comparison Tools](https://www.elasticpath.com/blog/20-tips-for-product-comparison-tools) — UX and fairness best practices
- [Inside Higher Ed: How to Avoid Ed-Tech Sales Mistakes](https://www.insidehighered.com/digital-learning/blogs/default/how-avoid-ed-tech-sales-mistakes) — dual audience challenges in education sales
- [ROI Selling: 5 Steps to Better Labor Savings Estimation](https://roi-selling.com/blog/5-easy-steps-to-better-estimating-labor-savings-in-your-business-case/) — credible time savings claims

### Tertiary (LOW confidence / needs validation)
- [Best Chart Libraries for Svelte 2026 (Weavelinx)](https://weavelinx.com/best-chart-libraries-for-svelte-projects-in-2026/) — Svelte ecosystem assessment (used to confirm React is the right choice; not primary guidance)
- [The Access Group: Education Software Pricing Models](https://www.theaccessgroup.com/en-gb/education/software/educational-software-pricing/) — Dutch VO market pricing context (UK source; validate against NL-specific data)

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
