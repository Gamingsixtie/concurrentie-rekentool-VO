# Domain Pitfalls

**Domain:** Pricing comparison & ROI calculator tool (Dutch VO education market)
**Researched:** 2026-03-20

---

## Critical Pitfalls

Mistakes that destroy credibility or require fundamental rework.

### Pitfall 1: The "Obviously Biased Calculator" Problem

**What goes wrong:** The tool is built by Cito, comparing Cito against competitors. If at any point a school administrator feels the comparison is rigged — even slightly — the entire tool becomes worthless. Forrester Research reports that 65% of B2B buyers already find vendor-provided ROI calculations "overly optimistic and lacking in real-world applicability." A comparison tool that always makes its own product look best is dismissed on sight.

**Why it happens:** Subtle bias creeps in through: cherry-picked comparison criteria where Cito excels, hiding or downplaying areas where competitors are stronger, using optimistic Cito pricing vs. list-price competitors, time savings estimates that feel inflated, and internal/external mode leaking (a school sees sales-oriented framing).

**Consequences:** Schools share the tool result with colleagues. One skeptic examines it, finds a single biased element, and the tool's credibility is permanently destroyed — not just for that school but within their network. In the tight-knit Dutch VO world, reputation damage spreads fast.

**Prevention:**
- The external mode MUST show areas where competitors score equally or better. If DIA has a cheaper module, show it prominently, not hidden.
- Every calculation must be expandable to show its full logic. No black boxes.
- Use publication prices as stated "bovengrens" (upper bound) consistently — for ALL parties including Cito.
- The "onderscheidend vermogen" (differentiating capabilities) section must be bidirectional: what Cito offers that others don't AND what others offer that Cito doesn't.
- Have someone from outside the sales team review the external mode for bias before launch.

**Detection (warning signs):** If during development nobody can point to a scenario where a competitor "wins" on a specific module's price, the tool is biased. If every default setting favors Cito, the tool is biased.

**Phase relevance:** Must be a design principle from Phase 1. Cannot be bolted on later.

---

### Pitfall 2: Stale Pricing Data Presented as Current

**What goes wrong:** Competitor pricing changes (new school year, new product versions, restructured offerings). The tool shows prices from 6+ months ago without adequate warning, or worse, with a "geverifieerd" (verified) badge that is technically outdated. A school checks the actual DIA or JIJ price list and finds a discrepancy. Instant credibility loss.

**Why it happens:** Nobody owns the update cycle. There is no forcing function to re-verify prices. The initial data entry is done carefully, but maintenance falls off. "Possibly outdated" warnings exist in the spec but get implemented as subtle footnotes instead of prominent alerts.

**Consequences:** A single wrong price invalidates the entire comparison in the school's eyes. "If they got this price wrong, what else is wrong?" The tool becomes a liability instead of a sales asset.

**Prevention:**
- Every price record needs: source URL/document, date verified, verified-by person, and a hard expiration date (6 months max, as specified in PROJECT.md).
- After expiration, the price should NOT be shown normally. It should require explicit acknowledgment: "This price was last verified on [date]. It may have changed. Show anyway?"
- Build the staleness check into the UI prominently — not a tiny footnote but a visible status badge per price cell (green/yellow/red traffic light).
- Set a calendar reminder workflow: at the start of each school year (August) ALL competitor prices must be re-verified, as this is when pricing typically changes.
- The AI-agent price lookup feature (if built) should include a "last checked" timestamp.

**Detection:** If the admin panel has no "prices expiring soon" dashboard, maintenance will be forgotten. If there is no process document for who updates prices and when, it will not happen.

**Phase relevance:** Data model design (Phase 1) must include staleness metadata. The staleness UI must be in the first functional build. The maintenance workflow must be documented before launch.

---

### Pitfall 3: Apples-to-Oranges Module Comparison

**What goes wrong:** Cito, DIA, and JIJ (IEP) do not structure their products identically. One vendor bundles features that another sells separately. Module names differ. Scope differs. A "LVS Rekenen" from Cito may include normering and rapportage that DIA charges separately for. Forcing these into the same row of a comparison table creates a misleading comparison — in either direction.

**Why it happens:** The desire for a clean, simple comparison table overrides the messy reality of different product structures. Product managers map competitors' products to Cito's structure because that is the frame of reference they know.

**Consequences:** Two failure modes: (1) Cito looks artificially cheap because bundled features are compared to unbundled competitor prices, and the school discovers this, destroying trust. (2) Cito looks artificially expensive because the comparison doesn't account for features included in Cito's bundle that the competitor charges extra for.

**Prevention:**
- Design the comparison at the MODULE level, not the package level (already in PROJECT.md — good decision, enforce it rigorously).
- Each module comparison must have a "what's included" expandable section showing exactly what each vendor includes at that price point.
- Where products don't map 1:1, show this explicitly: "DIA biedt dit niet als apart product aan" or "Bij JIJ is dit onderdeel van [bundel X]."
- Never force a comparison where one doesn't exist. Empty cells with "Niet beschikbaar" or "Anders gestructureerd" are more honest and more credible than forced equivalences.
- Consider a "vergelijkbaarheidsindicator" (comparability indicator) per row: high (same scope), medium (similar but differences noted), low (fundamentally different structure).

**Detection:** If the product mapping spreadsheet has no "notes" or "differences" column, the comparison is oversimplified. If every competitor module maps cleanly to a Cito module, someone is forcing the mapping.

**Phase relevance:** Data modeling (Phase 1) must support partial comparisons and scope notes. UI design must handle "not directly comparable" states gracefully.

---

### Pitfall 4: Time Savings Claims That Feel Made Up

**What goes wrong:** The time savings calculator (Scenario B) claims "you save 120 hours per year" but the school administrator cannot connect that number to their lived experience. The assumptions are hidden or unrealistic. A rector who has never personally reset a toets thinks "120 hours? That seems like a lot" and dismisses the entire business case.

**Why it happens:** Time savings are estimated by Cito product managers who know the theoretical difference but not the actual frequency of each task at different school sizes. Estimates use best-case scenarios. The math multiplies small per-task savings by high frequencies to produce impressive-looking totals that feel disconnected from reality.

**Consequences:** The time savings number is THE key differentiator for the platform migration business case (Scenario B). If it lacks credibility, the entire migration argument collapses. Gartner data shows 77% of B2B buyers rate their purchase experience as "extremely complex or difficult" — and unreliable ROI projections are a key factor.

**Prevention:**
- Every time savings claim must be decomposable: show the formula. "5 docenten x 3 minuten per reset x 40 resets per jaar = 10 uur per jaar." Let the user SEE and ADJUST every input.
- Make all assumptions editable. School size, number of teachers, frequency of each task — all should be sliders or input fields with sensible defaults.
- Use conservative defaults, not optimistic ones. If the real savings are impressive, conservative defaults will still look good. If you need optimistic defaults to make the case, the case is weak.
- Provide the methodology: "This estimate is based on [source]. Average task times were measured by [method]."
- Let the user input their own current task times. "How long does it currently take you to reset a toets?" This personalizes the result and makes them co-authors of the calculation.
- Show ranges, not single numbers: "Between 80 and 150 hours per year depending on school size and usage patterns."

**Detection:** If the time savings demo always produces an impressive number regardless of school size input, the model is biased. If the defaults cannot be changed, the tool lacks credibility.

**Phase relevance:** The time savings model and its transparency must be designed in Phase 1. Each assumption should be a named, documented, adjustable parameter.

---

### Pitfall 5: Internal Mode Leaking into External Presentations

**What goes wrong:** An accountmanager uses the tool in internal mode (with sales signals, korting gevoeligheidsanalyse, marktgemiddelden) during a school visit and accidentally shows or shares internal-mode output. Or worse, internal mode content appears in a printed/exported document handed to a school. The school sees "sales signals" or "suggest upsell opportunity" and trust evaporates.

**Why it happens:** The two modes share the same URL/app. Mode switching is a toggle that is easy to forget. Print/export does not check which mode is active. Screenshots or shared links carry mode state.

**Consequences:** Catastrophic credibility loss. The school sees behind the curtain and realizes they are being "managed" by a sales tool, not informed by a neutral comparison. This is worse than having no tool at all.

**Prevention:**
- Internal mode should require explicit authentication or an access code. It should never be a simple toggle in the UI.
- Print/export from internal mode must have a VISIBLE watermark: "INTERN - NIET VOOR EXTERNE VERSPREIDING" (Internal - not for external distribution).
- The URL should differ between modes (e.g., `/vergelijking` vs. `/intern/vergelijking`) so a shared link cannot accidentally expose internal mode.
- Internal-only data (sales signals, gevoeligheidsanalyse) should be visually distinct — different background color, different section — so it is unmistakable even in screenshots.
- Add a confirmation step before printing in internal mode: "This output contains internal data. Switch to external mode for a school-ready version?"
- Consider: if the tool is stateless (no accounts), mode separation via URL path + simple access code is the minimum viable approach.

**Detection:** If during testing you can get from external mode to internal mode in fewer than 2 deliberate actions, the barrier is too low. If a print from internal mode looks identical to external mode except for extra sections, someone will miss the difference.

**Phase relevance:** Architecture decision in Phase 1. URL structure and mode separation must be designed early. Cannot be retrofitted without breaking bookmarks and workflows.

---

## Moderate Pitfalls

### Pitfall 6: The Hourly Rate Assumption Trap

**What goes wrong:** Converting time savings to euros requires an hourly rate. The default hourly rate is either too high (looks like inflated savings) or too low (undersells the value). Schools challenge the number because teacher salaries are public knowledge in Dutch education, and the hourly rate for a docent vs. a coördinator vs. a conrector varies significantly.

**Prevention:**
- Use the CAO VO (Collectieve Arbeidsovereenkomst Voortgezet Onderwijs) salary scales as the basis — these are public and verifiable.
- Default to a mid-range schaal (e.g., LB schaal 10) and make it adjustable.
- Show the source: "Based on CAO VO 2025-2026, schaal [X], trede [Y], including werkgeverslasten."
- Include employer costs (werkgeverslasten, approximately 30-40% on top of gross salary) because the school's actual cost per hour is higher than gross salary. But label this explicitly.
- Let the user override with their own hourly rate.

**Phase relevance:** Phase 2 (Scenario B implementation). The rate model should be researched and sourced before building.

---

### Pitfall 7: Print/Export That Looks Broken

**What goes wrong:** The tool looks great on screen but prints terribly. Charts get cut in half across pages. Interactive elements (accordions, tooltips) disappear, leaving gaps. The bar chart comparing prices renders as a blank rectangle. The school administrator prints the comparison to bring to a management team meeting and the printout is unusable.

**Prevention:**
- Design the print layout as a first-class deliverable, not an afterthought. Many comparison tools fail here because print CSS is added last.
- Charts must have a static/image fallback for print. Canvas-based charts (Chart.js, D3) do not print reliably without explicit print handling.
- All expandable/collapsible sections must auto-expand in print mode. The spec already says "alle secties uitgevouwen" — enforce this with `@media print` CSS.
- Use `page-break-inside: avoid` on comparison table rows and chart containers.
- Use `@page` rules for margins, not `body` margins.
- Tables need `<thead>` with headers that repeat across pages.
- Test printing in Chrome, Edge, and Firefox. Print rendering differs significantly.
- Consider offering a "generate PDF" button that produces a server-rendered PDF rather than relying on browser print, for consistency.

**Detection:** If nobody has printed the tool output during development, it is broken. Print testing must be part of the QA checklist for every feature.

**Phase relevance:** Print CSS must be developed alongside each visual component, not as a separate phase. Every component ticket should include "prints correctly" as an acceptance criterion.

---

### Pitfall 8: Overwhelming Non-Technical Users

**What goes wrong:** The tool presents too many options upfront. Module selection, school size, number of teachers per vakgroep, hourly rates, depreciation periods, discount scenarios — school administrators are not financial analysts. They came for a quick comparison and got a spreadsheet.

**Prevention:**
- Progressive disclosure: start with 2-3 essential inputs (school size, which modules they use) and show a result immediately. Advanced options are secondary.
- Provide smart defaults for everything. The user should be able to get a meaningful result with minimal input.
- The three audience perspectives (coördinator, directie, finance) from the spec should function as preset views that filter complexity, not as additional options on top of everything else.
- Use plain Dutch, not financial jargon. "Wat kost het per leerling per jaar" not "TCO per capita per annum."
- Limit the initial comparison to 2 vendors (Cito vs. one competitor) rather than showing all three side by side, which creates a dense table.

**Detection:** Time the "first meaningful result" during usability testing. If it takes more than 60 seconds to get a comparison on screen, the tool is too complex. If a test user asks "what do I do first?", the flow is unclear.

**Phase relevance:** UX design in Phase 1. The interaction flow is more important than the feature set.

---

### Pitfall 9: Meerjarenprojectie (Multi-Year Projection) Without Caveats

**What goes wrong:** Showing 3-year and 5-year cost projections implies price stability that does not exist. Prices change, contracts get renegotiated, new products launch. A 5-year projection based on today's prices is fiction presented as forecast.

**Prevention:**
- Label projections clearly: "Projectie op basis van huidige prijzen. Werkelijke kosten kunnen afwijken."
- Show projections as ranges, not exact numbers. Use bands or shading to indicate increasing uncertainty over time.
- Include an inflation/price-increase assumption that the user can adjust (default: 0% — conservative, but adjustable).
- Do NOT present the 5-year number as the headline figure. Lead with year 1 (most reliable) and let users expand to multi-year.
- For Scenario B (migration), show the "terugverdientijd" (payback period) as a range, not a single date.

**Phase relevance:** Phase 2, Scenario B build. The projection model must be designed with uncertainty visualization built in.

---

### Pitfall 10: Ignoring the "Wat als de concurrent korting geeft?" Question

**What goes wrong:** The external mode comparison uses publication prices. But every school knows that vendors offer discounts, especially for larger orders or multi-year contracts. If the tool only shows list prices, the school says: "But DIA offered us 15% off, so your comparison is irrelevant."

**Prevention:**
- This is already partially addressed in the spec (internal mode has gevoeligheidsanalyse with 10%/20% korting scenarios). But even the EXTERNAL mode should acknowledge this reality.
- In external mode, add a note: "Deze vergelijking is gebaseerd op publicatieprijzen. Neem contact op met uw leverancier voor eventuele kortingen." This is honest and positions the tool as a starting point, not the final word.
- Consider allowing schools to input their own actual prices (or quoted prices) in external mode. This makes the tool genuinely useful rather than theoretical.
- In internal mode, the sensitivity analysis should show at what discount percentage the competitor becomes cheaper per module — this is the "pain threshold" the accountmanager needs to know.

**Phase relevance:** External mode acknowledgment in Phase 1. Sensitivity analysis in Phase 2 (internal mode).

---

## Minor Pitfalls

### Pitfall 11: Copy-to-Clipboard Produces Ugly Plain Text

**What goes wrong:** The "kopieer samenvatting" feature copies raw text that loses all formatting when pasted into email or Word. Tables become garbled. Numbers misalign.

**Prevention:**
- Copy both plain text AND HTML to clipboard (using the Clipboard API's `text/html` MIME type). This way, pasting into email or Word preserves table formatting.
- Design the summary text specifically for paste contexts: short, scannable, with clear headers.
- Test pasting into Outlook (dominant in Dutch education) specifically.

**Phase relevance:** Export features phase. Small effort, high impact if done right.

---

### Pitfall 12: Forgetting Mobile/Tablet Use During School Visits

**What goes wrong:** Accountmanagers visit schools with an iPad or laptop. The comparison table with 3+ columns becomes unreadable on a tablet in portrait mode. Touch targets for interactive elements are too small.

**Prevention:**
- Test on iPad (Safari) as a primary device, not an afterthought.
- On narrow screens, consider switching from side-by-side comparison to a "card" view where each vendor is a swipeable card.
- Ensure touch targets are minimum 44x44px (Apple HIG standard).

**Phase relevance:** Responsive design decisions in Phase 1 architecture. The layout approach must accommodate tablet from the start.

---

### Pitfall 13: No Audit Trail for Price Changes

**What goes wrong:** An accountmanager manually updates a competitor's price. There is no record of what the previous price was, who changed it, or why. Months later, a discrepancy is discovered and nobody knows whether it was a legitimate update or a mistake.

**Prevention:**
- Even in a stateless tool, the price data store (JSON, database, CMS) must keep a version history.
- Every price change should record: old value, new value, changed by, date, source/reason.
- This is not user-facing but essential for internal governance.

**Phase relevance:** Data layer design in Phase 1. The price data model must include history from the start; retrofitting versioning is painful.

---

## "Looks Done But Isn't" Checklist

| Feature | Looks Done When... | Actually Done When... |
|---------|-------------------|----------------------|
| Module comparison | Table shows prices side by side | Scope differences are documented per row, "not comparable" states are handled, expandable detail shows what is included |
| Time savings calculator | Shows a total hours saved number | Every assumption is visible, editable, sourced, and the range/uncertainty is shown |
| Print output | Ctrl+P produces something | Charts render, tables don't split, all sections expand, headers repeat, it fits A4, margins are correct, internal mode is watermarked |
| External mode | No sales signals visible | Internal mode is architecturally separated (different URL/auth), print cannot leak internal data, links cannot accidentally share internal mode |
| Price freshness | Dates are stored in the database | Expired prices trigger prominent visual warnings, there is a maintenance workflow, someone is assigned to update, reminder system works |
| Meerjarenprojectie | Numbers for 1, 3, 5 years appear | Uncertainty increases visually over time, assumptions are labeled, inflation is adjustable, caveats are prominent |
| Clipboard copy | Text appears in clipboard | HTML formatting is preserved in Outlook/Word paste, tables are readable, summary is scannable |
| Sensitivity analysis | 10%/20% discount scenarios calculate | Break-even point is shown ("competitor becomes cheaper at X% discount"), ranges are visualized, methodology is transparent |

---

## Pitfall-to-Phase Mapping

| Phase Topic | Likely Pitfall | Mitigation | Priority |
|-------------|---------------|------------|----------|
| Data model design | #2 Stale prices, #3 Apples-to-oranges, #13 No audit trail | Build staleness metadata, scope-notes fields, and version history into the data model from day one | CRITICAL |
| Architecture / mode separation | #5 Internal mode leaking | Separate URL paths, auth gate for internal mode, print watermarking | CRITICAL |
| UX / interaction design | #1 Bias perception, #8 Overwhelming users | Progressive disclosure, bidirectional differentiators, conservative defaults | CRITICAL |
| Scenario A (price comparison) | #3 Apples-to-oranges, #10 Discount reality | Comparability indicators, scope detail, discount acknowledgment in external mode | HIGH |
| Scenario B (migration business case) | #4 Time savings credibility, #6 Hourly rate, #9 Multi-year caveats | Editable assumptions, CAO VO sourced rates, uncertainty ranges | HIGH |
| Visual components (charts/tables) | #7 Print broken, #12 Tablet | Print CSS per component, chart print fallbacks, responsive card layouts | MEDIUM |
| Export features | #7 Print, #11 Clipboard | Dedicated print stylesheet, HTML clipboard, Outlook testing | MEDIUM |
| Maintenance / operations | #2 Stale prices, #13 Audit trail | Update workflow documentation, calendar reminders, expiration dashboard | HIGH |

---

## Phase-Specific Warnings

| Phase | Warning | Action Required |
|-------|---------|-----------------|
| Phase 1 (Foundation) | If the data model does not include price metadata (source, date, expiry, verifier) and module scope notes, every subsequent phase will produce misleading output | Design the data model for transparency first, features second |
| Phase 1 (Foundation) | If internal/external mode separation is a CSS toggle rather than an architectural boundary, it WILL leak | Implement as separate routes with access control |
| Phase 2 (Scenario B) | If time savings defaults are not sourced from actual measurement or customer research, the calculator will not survive scrutiny | Invest in measuring actual task times before building the calculator |
| Launch | If no competitor price audit has been done in the 30 days before launch, the tool will launch with stale data | Schedule a pre-launch price verification sprint |
| Post-Launch | If no one is assigned to quarterly price updates, the tool will decay within 6 months | Assign ownership and set calendar reminders before launch, not after |

---

## Sources

- [Ecosystems.io: ROI Calculators: A Burned-Out Tool in B2B Sales](https://www.ecosystems.io/blog/roi-calculators-a-burned-out-tool-in-b2b-sales) — Forrester/Gartner data on buyer skepticism of vendor ROI tools
- [EU Commission: Key Principles for Comparison Tools](https://commission.europa.eu/system/files/2017-06/key_principles_for_comparison_tools_en.pdf) — EU regulatory framework for fair comparison methodology
- [ROI Selling: 5 Steps to Better Labor Savings Estimation](https://roi-selling.com/blog/5-easy-steps-to-better-estimating-labor-savings-in-your-business-case/) — Best practices for credible time/labor savings claims
- [CustomJS: Common HTML-to-PDF Issues](https://www.customjs.space/blog/html-to-pdf-issues/) — Print/export technical pitfalls and solutions
- [Prisync: Price Comparison Errors](https://prisync.com/blog/price-comparison-errors/) — Common mistakes in pricing comparison tools
- [Elastic Path: 20 Tips for Product Comparison Tools](https://www.elasticpath.com/blog/20-tips-for-product-comparison-tools) — UX and fairness best practices
- [Pulse-IQ: Advanced ROI Calculator Tools](https://pulse-iq.com/advanced-roi-calculator-tools-boost-sales/) — Building credibility in ROI calculators
- [Inside Higher Ed: How to Avoid Ed-Tech Sales Mistakes](https://www.insidehighered.com/digital-learning/blogs/default/how-avoid-ed-tech-sales-mistakes) — Dual audience challenges in education sales
- [Selling to Schools: K-12 Sales Strategy - 10 Deadly Sins](https://sellingtoschools.com/education-management/k-12-sales-strategy-ten-deadly-sins-must-avoid/) — Education market sales pitfalls
