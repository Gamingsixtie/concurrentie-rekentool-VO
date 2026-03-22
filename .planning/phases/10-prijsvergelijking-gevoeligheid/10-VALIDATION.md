---
phase: 10
slug: prijsvergelijking-gevoeligheid
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.ts` (vitest configured inline) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | PRIJS-01 | unit | `npx vitest run src/engine/__tests__/dia-packages.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | PRIJS-02 | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 1 | PRIJS-03 | unit | `npx vitest run src/engine/__tests__/hybrid-scenario.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 1 | PRIJS-04 | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts` | ✅ | ⬜ pending |
| 10-03-01 | 03 | 2 | GEVOEL-01 | unit | `npx vitest run src/engine/__tests__/sensitivity.test.ts` | ❌ W0 | ⬜ pending |
| 10-03-02 | 03 | 2 | GEVOEL-02 | unit | `npx vitest run src/engine/__tests__/sensitivity.test.ts` | ❌ W0 | ⬜ pending |
| 10-03-03 | 03 | 2 | GEVOEL-03 | unit | `npx vitest run src/engine/__tests__/sensitivity.test.ts` | ❌ W0 | ⬜ pending |
| 10-03-04 | 03 | 2 | MODE-02 | component | `npx vitest run src/features/price-comparison/__tests__/mode-toggle.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/dia-packages.test.ts` — stubs for DIA package calculation (PRIJS-01)
- [ ] `src/engine/__tests__/hybrid-scenario.test.ts` — stubs for hybrid scenario (PRIJS-03)
- [ ] `src/engine/__tests__/sensitivity.test.ts` — stubs for sensitivity analysis + break-even (GEVOEL-01, GEVOEL-02, GEVOEL-03)
- [ ] `src/features/price-comparison/__tests__/mode-toggle.test.tsx` — stubs for internal/external mode toggle (MODE-02)

*Existing infrastructure covers engine testing patterns; new test files needed for new engine functions.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sales-signaal badges visueel correct (kleur + positie) | GEVOEL-03 | Visual styling | Open vergelijking in interne modus, verify groene/gele/rode badges naast modulenamen |
| Staafdiagram met hybride data | PRIJS-05 | Chart rendering | Open vergelijking met hybride scenario, verify staafdiagram toont alle kolommen |
| Responsive tabel op tablet | PRIJS-06 | Viewport testing | Open in devtools 768px viewport, verify tabel scrollbaar en leesbaar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
