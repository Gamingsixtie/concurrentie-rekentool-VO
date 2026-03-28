---
phase: 24
slug: ux-audit-vergelijkingsoverzicht-stakeholder-ready
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 24 — Validation Strategy

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
| 24-01-01 | 01 | 1 | D-01/D-05 | manual | Visual: section order in PriceComparisonPage | N/A | ⬜ pending |
| 24-01-02 | 01 | 1 | D-15 | manual | Visual: alternating bg-neutral-50/bg-white bands | N/A | ⬜ pending |
| 24-02-01 | 02 | 1 | D-06/D-07 | unit | `npx vitest run` | ⬜ W0 | ⬜ pending |
| 24-02-02 | 02 | 1 | D-08 | manual | Visual: provider toolbar with tooltip/popover | N/A | ⬜ pending |
| 24-03-01 | 03 | 2 | D-09 | manual | Visual: AI hero collapsed/expanded states | N/A | ⬜ pending |
| 24-03-02 | 03 | 2 | D-10/D-11 | manual | Visual: chart and meerwaarde collapsed by default | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements. Build validation via `npm run build` confirms no TypeScript/compilation errors after restructuring.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Section order matches D-05 hierarchy | D-01–D-05 | Visual layout order | Open comparison page, verify: AI hero → bediening → totalen → toolbar → tabel → grafiek → meerwaarde → disclaimer |
| Alternating color bands | D-15 | Visual styling | Verify alternating bg-neutral-50/bg-white sections |
| AI hero collapse/expand | D-09 | Interactive behavior | Click "Lees volledig advies", verify expand/collapse |
| Provider toolbar with tooltips | D-08 | Interactive behavior | Hover/click ℹ️ icons, verify pricing model info appears |
| Chart collapsed by default | D-10 | Visual state | Load page fresh, verify chart section is collapsed |
| MeerwaardePanel collapsed by default | D-11 | Visual state | Load page fresh, verify meerwaarde is collapsed |
| Self-explanatory labels | D-14 | Content review | Verify tooltips on "bundel", "contractperiode", "per leerling/jaar" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
