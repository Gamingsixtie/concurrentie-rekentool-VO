---
phase: 25
slug: prijsintelligentie-stakeholder-feedback-loop
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 25 — Validation Strategy

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
| 25-01-01 | 01 | 1 | SC-1 (DB tables) | integration | `npx vitest run src/db/__tests__/publication-prices.test.ts` | ❌ W0 | ⬜ pending |
| 25-01-02 | 01 | 1 | SC-2 (provider function) | unit | `npx vitest run src/engine/__tests__/price-provider.test.ts` | ❌ W0 | ⬜ pending |
| 25-02-01 | 02 | 1 | SC-2 (engine config injection) | unit | `npx vitest run src/engine/__tests__/calculators.test.ts` | ✅ | ⬜ pending |
| 25-03-01 | 03 | 2 | SC-3 (flag price) | component | `npx vitest run src/features/pricing/__tests__/price-flag.test.tsx` | ❌ W0 | ⬜ pending |
| 25-03-02 | 03 | 2 | SC-4 (review queue) | component | `npx vitest run src/features/pricing/__tests__/review-queue.test.tsx` | ❌ W0 | ⬜ pending |
| 25-04-01 | 04 | 2 | SC-5 (auto recalc) | unit | `npx vitest run src/engine/__tests__/recalculation.test.ts` | ❌ W0 | ⬜ pending |
| 25-04-02 | 04 | 2 | SC-6 (audit trail) | integration | `npx vitest run src/db/__tests__/audit-trail.test.ts` | ❌ W0 | ⬜ pending |
| 25-05-01 | 05 | 3 | SC-7 (config editor) | component | `npx vitest run src/features/pricing/__tests__/config-editor.test.tsx` | ❌ W0 | ⬜ pending |
| 25-06-01 | 06 | 3 | SC-8 (staleness) | unit | `npx vitest run src/engine/__tests__/staleness.test.ts` | ❌ W0 | ⬜ pending |
| 25-06-02 | 06 | 3 | SC-10 (offline) | unit | `npx vitest run src/hooks/__tests__/offline-pricing.test.ts` | ❌ W0 | ⬜ pending |
| 25-07-01 | 07 | 3 | SC-13 (discount patterns) | unit | `npx vitest run src/engine/__tests__/discount-patterns.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/db/__tests__/publication-prices.test.ts` — stubs for publication_prices CRUD
- [ ] `src/engine/__tests__/price-provider.test.ts` — async provider function with fallback
- [ ] `src/features/pricing/__tests__/price-flag.test.tsx` — price flagging UI
- [ ] `src/features/pricing/__tests__/review-queue.test.tsx` — review queue component
- [ ] `src/engine/__tests__/recalculation.test.ts` — auto-recalculation on approval
- [ ] `src/db/__tests__/audit-trail.test.ts` — audit log entries
- [ ] `src/features/pricing/__tests__/config-editor.test.tsx` — config editor UI
- [ ] `src/engine/__tests__/staleness.test.ts` — staleness detection logic
- [ ] `src/hooks/__tests__/offline-pricing.test.ts` — offline fallback behavior
- [ ] `src/engine/__tests__/discount-patterns.test.ts` — discount pattern detection

*Existing calculator tests in `src/engine/__tests__/` cover regression for engine changes.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review badge count updates in real-time | SC-4 (D-09) | Requires live Supabase subscription | Open app as manager, have another user submit proposal, verify badge increments |
| Offline banner appears when disconnected | SC-10 | Requires network simulation | Disable network in DevTools, verify banner and cached data display |
| AI normalization matches correct module | SC-9 (D-12) | Requires AI API call | Submit free-text price ("DIA rekent 6,20 voor rekenen"), verify correct module/provider match |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
