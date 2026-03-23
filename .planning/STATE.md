---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Sales Intelligence Platform
status: Ready to execute
stopped_at: Completed 11-01-PLAN.md
last_updated: "2026-03-23T00:01:46.342Z"
progress:
  total_phases: 10
  completed_phases: 4
  total_plans: 23
  completed_plans: 18
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Accountmanagers hebben tijdens elk schoolgesprek direct een onderbouwd, eerlijk en op de DMU afgestemd overzicht dat zowel financieel als in tijdsbesparing concreet maakt waarom Cito de beste keuze is.
**Current focus:** Phase 11 — waarde-engine-migratie

## Current Position

Phase: 11 (waarde-engine-migratie) — EXECUTING
Plan: 2 of 3

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v2.0)
- Average duration: —
- Total execution time: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.0]: Stack is React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Recharts 3
- [v1.0]: Calculation engine as pure TypeScript functions, separate from React UI
- [v2.0]: AI intake via Claude Haiku 4.5 for real-time conversation capture
- [v2.0]: School profiles stored locally via Dexie/IndexedDB, not external CRM
- [v2.0]: DMU-targeted exports as core feature via @react-pdf/renderer
- [v2.0]: Reuse existing v1 code iteratively — refactor for multi-school, not rewrite
- [v2.0]: Multi-school persistence (Dexie/IndexedDB) is Phase 6 — everything depends on it
- [Phase 07]: Embedded arrays in SchoolRecord for CRM data (contacts, conversations, actions) - sufficient for 50-200 schools scale
- [Phase 07]: Use z.input<typeof schema> for CRUD function params to support optional Zod default fields
- [Phase 07]: Use z.input<typeof schema> for form types with react-hook-form zodResolver (Zod v4 input vs output type pattern)
- [Phase 07]: DMUBadge as reusable component in src/components/ui/ for cross-feature usage
- [Phase 07]: ComparisonTab wraps existing pages without duplicating logic - scenario routing determines which page renders
- [Phase 07]: Context-smart CTA maps pipeline status to recommended next action and target tab
- [Phase 07]: localStorage for view/card mode persistence - simple, no DB overhead
- [Phase 07]: @dnd-kit/core for kanban drag-and-drop with validation guard pattern
- [Phase 08]: AuthProvider uses React Context (not Zustand) for auth state - session-scoped, not persisted
- [Phase 08]: Dutch error messages mapped from Supabase AuthApiError via mapAuthError helper
- [Phase 08]: Throw on missing env vars for fail-fast; preserved existing operations.test.ts real tests
- [Phase 08]: CRM data moved from embedded arrays to separate Supabase tables with dedicated React Query hooks
- [Phase 08]: SchoolRecord.id changed from optional number to required string UUID
- [Phase 08]: DexieSchoolRecord inline type for parallel safety with Plan 08-03
- [Phase 08]: Contact ID mapping by insertion order for migration FK resolution
- [Phase 09]: Use .default([]) on V2 schema arrays for backward compatibility with v1 data
- [Phase 09]: Zod v4 uses 'error' instead of 'required_error' for custom number error messages
- [Phase 09]: Mutual exclusion activation via two sequential Supabase queries (deactivate all, then activate one)
- [Phase 09]: Replaced usePriceComparisonStore appliedOverrides with useSchoolPrices for ProductsTab price display
- [Phase 09]: Reset-to-publication deactivates all school prices via direct Supabase update in PriceManager
- [Phase 09]: DiffView maintains mutable extraction copy for inline editing before confirm
- [Phase 09]: Confirm uses Supabase mutations (operations.ts), not Zustand store for data persistence
- [Phase 09]: Inline getAuthHeaders in document-parser.ts to avoid circular import with ai-intake.ts
- [Phase 09]: Return empty array (not error) when Claude cannot extract prices from document text
- [Phase 10]: DIA package selection compares all qualifying packages by total cost and picks cheapest
- [Phase 10]: Break-even returns null when Cito is already more expensive
- [Phase 10]: Sales signals use only Cito differentiators count to determine signal type
- [Phase 10]: Added CurrentProvider and ModuleCurrentSetup types to src/models/school.ts
- [Phase 10]: isInternalMode defaults to true; activeCompetitor via alphabetical moduleId sort; sensitivity computed unconditionally
- [Phase 10]: DiaPackageManager UI deferred — user approved Phase 10 visual verification and moved to Vercel deployment
- [Phase 10]: DIA package price override store slice (diaPackageOverrides) deferred with DiaPackageManager component
- [Phase 11]: computeBreakEvenMonth as module-private function for clean encapsulation
- [Phase 11]: UpsellSignalStrength limited to green/yellow; red signals excluded from results entirely
- [Phase 11]: overig provider excluded from upsell (no comparison data for custom providers)

### Pending Todos

- [10-03 deferred] DiaPackageManager UI: create `DiaPackageManager.tsx`, add `diaPackageOverrides`/`setDiaPackageOverride` to store.ts, wire ModeToggle + SensitivitySection + DiaPackageManager into PriceComparisonPage.tsx — deferred to post-Vercel deployment
- [10-02/10-03 pending] Verify PriceComparisonPage.tsx integration (ModeToggle, PeriodToggle, SensitivitySection) is applied in main branch — worktree commits may not be merged

### Blockers/Concerns

- Competitor product catalog needs correction: DIA prijzen waren 35% overschat in v1
- JIJ! publiceert geen prijzen — offerte nodig bij Bureau ICE
- Prijsmodel nieuw Cito-platform data nog niet volledig beschikbaar
- CAO VO 2025-2026 salary scale reference needed for default hourly rate
- [Phase 11]: Research needed for @react-pdf/renderer + Recharts SVG embedding before building DMU templates
- [Phase 6]: Safari private browsing IndexedDB limitation — define fallback behavior during planning

## Session Continuity

Last session: 2026-03-23T00:01:46.339Z
Stopped at: Completed 11-01-PLAN.md
Resume file: None
