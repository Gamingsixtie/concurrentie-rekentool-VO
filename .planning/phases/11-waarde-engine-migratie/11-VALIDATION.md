---
phase: 11
slug: waarde-engine-migratie
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
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
| 11-01-01 | 01 | 1 | WAARDE-01 | unit | `npx vitest run src/engine/__tests__/migration.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | WAARDE-02 | unit | `npx vitest run src/engine/__tests__/migration.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | WAARDE-03 | unit | `npx vitest run src/engine/__tests__/migration.test.ts` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | WAARDE-04 | unit | `npx vitest run src/engine/__tests__/upsell.test.ts` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | MIGR-01 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 2 | MIGR-02 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 11-03-03 | 03 | 2 | MIGR-03 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 11-03-04 | 03 | 2 | SCHOOL-07 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/migration.test.ts` — extend with break-even, switching costs, combined value tests (WAARDE-01..03)
- [ ] `src/engine/__tests__/upsell.test.ts` — new file for upsell detection engine (WAARDE-04)
- [ ] Test fixtures for school profiles with competitor module setups

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero card shows combined value | WAARDE-02 | Visual layout | Open school profile → Waarde tab → verify hero shows combined total |
| Inline editing persists | WAARDE-01 | UI interaction | Edit hours/uurtarief → refresh → verify values persist |
| Upsell badge on school cards | SCHOOL-07 | Visual rendering | Open schooloverzicht → verify badge count on cards |
| Recharts multi-year chart | MIGR-02 | Visual rendering | Open Waarde tab → verify 1/3/5yr bar chart renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
