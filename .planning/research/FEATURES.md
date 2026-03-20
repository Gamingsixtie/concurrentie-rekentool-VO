# Feature Landscape

**Domain:** Interactive pricing comparison and ROI/business case calculator for Dutch education market (VO)
**Researched:** 2026-03-20

## Table Stakes

Features users expect. Missing = tool feels incomplete or untrustworthy.

### Input & Configuration

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| School profile input (number of students, levels) | Every calculation depends on school size; per-pupil pricing is the norm in Dutch education | Low | Single form at start; drives all downstream calculations |
| Module selection (pick which products to compare) | Schools buy modularly -- LVS Rekenen, Taal, Engels, etc. Not all schools buy everything | Low | Checkbox/toggle list; must match Cito, DIA, JIJ product catalogs |
| Per-pupil cost breakdown | Standard pricing model in education software; users think in cost-per-leerling | Low | Auto-calculated from total price / student count |
| Total cost overview per vendor | The primary output -- what does this cost me per year, total? | Low | Summary table with subtotals per vendor |
| Immediate results (no registration wall) | NN/g research: users abandon tools that gate results behind signup. School admins have zero patience for accounts | Low | Stateless tool; no login required (already in scope) |

### Transparency & Trust

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Price source attribution | Users must know WHERE the price came from (publicatielijst, website, handmatig ingevoerd) | Low | Label per price point |
| Price freshness indicator | Stale competitor prices destroy credibility. "Is this still accurate?" is the first question | Low | Date stamp + visual indicator (green/amber/red based on age) |
| Expandable calculation details | Users need to verify: "how did you get this number?" Show-your-work builds trust | Medium | Collapsible sections showing formulas and inputs |
| Assumptions made explicit | Any hardcoded assumption (e.g., hours per task, hourly rate) must be visible and adjustable | Medium | Display defaults with edit capability |
| "Published price as upper bound" disclaimer | When competitor staffelkortingen are unknown, transparently state that actual price may be lower | Low | Inline disclaimer text near competitor prices |

### Output & Export

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Print-optimized view | School admins print for meetings, MT overleg, rector approval. This is how decisions travel in Dutch VO | Medium | Print CSS with all sections expanded, proper page breaks |
| Copy summary to clipboard | Quick sharing via email or Teams chat to colleagues | Low | Button that copies formatted text summary |
| Visual comparison (bar chart) | Humans compare visually. A table of numbers is necessary but insufficient | Medium | Side-by-side bar chart per module and total |

### Interaction Quality

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Modify inputs without restarting | NN/g recommendation #6: users must tweak individual values, not redo everything | Low | Reactive UI that recalculates on input change |
| Input guidance and defaults | NN/g recommendation #8: explain unfamiliar terms, show reasonable defaults | Low | Tooltips, placeholder text, "typical value" hints |
| Mobile/tablet usable | Sales reps visit schools with iPads; tool must work during gesprekken | Medium | Responsive layout, touch-friendly controls |

## Differentiators

Features that set the tool apart. Not expected in generic calculators, but high-value for this specific use case.

### Scenario B: Time Savings Calculator

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Task-level time savings with concrete examples | Converts abstract "better platform" into "you save 12 minutes per reset, 40 times per year = 8 hours" | Medium | Pre-configured tasks (rechten, resetten, inloggen, planning, sync) with Cito-researched time estimates |
| Hours-to-euros conversion | Bridges the gap between IT coordinator ("saves me time") and finance ("saves us money"). Adjustable hourly rate | Low | Simple multiplication, but powerful framing |
| Multi-year projection (1, 3, 5 year) | Business cases in education are multi-year; budgets are annual but contracts are long-term | Medium | Compound savings over time, possibly with discount rate |
| Payback period visualization | "When does the migration investment pay for itself?" -- the killer question for any platform switch | Medium | Break-even chart or clear month/year indicator |

### Dual Audience Modes

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| External mode (objective, neutral) | School administrators trust a tool that shows competitors fairly. Objectivity IS the sales argument | Low | Default mode; only published prices, no sales signals |
| Internal mode (sales-focused) | Account managers need sensitivity analysis, coaching signals, competitive positioning | Medium | Toggle that adds: discount scenarios, margin info, talk tracks |
| Sensitivity analysis (what-if competitor discounts) | "What if DIA gives 10% or 20% korting?" -- preempts the most common sales objection | Medium | Slider or preset scenarios that recalculate competitor totals |
| Market average benchmark line | Shows where Cito sits relative to market average, not just vs. one competitor | Medium | Requires aggregating across vendors; visual line on chart |

### Audience-Specific Views

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Coordinator/docent perspective | Shows time savings in concrete daily tasks -- speaks their language | Low | Filter/tab that emphasizes time savings, workflow improvements |
| Directie perspective | Overview and onderbouwing -- the "why should we switch" executive summary | Low | Summary view with key metrics and recommendation |
| Finance perspective | Euros, meerjarenprojectie, budget impact -- the CFO view | Low | Detailed financial breakdown, annual budget line items |

### Data Quality & Input Flexibility

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Three input paths for pricing data (upload, manual, AI) | Flexibility for different situations: have a PDF prijslijst? Upload it. Know the price? Type it. Neither? Let AI look it up | High | Document parsing + AI agent are significant technical investments |
| Price verification workflow | Internal process to verify and approve prices, maintaining data quality over time | Medium | Admin interface for price management |
| Automatic staleness detection (>6 months) | Prices auto-flag as "possibly outdated" -- prevents embarrassing meetings with wrong data | Low | Date comparison logic with visual warning |

## Anti-Features

Features to explicitly NOT build. Each would seem logical but would hurt the tool.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User accounts and saved comparisons | Adds friction, requires data management, GDPR complexity, maintenance burden. Schools do this once or twice a year. Stateless is a feature | Offer print/export so users save results their own way |
| Real-time competitor price scraping | Legally questionable, technically fragile, creates false sense of accuracy. Competitor pricing changes rarely (annual prijslijsten) | Manual price updates with clear freshness dates |
| Contract/offerte generation | Crosses from "comparison tool" into "CRM/sales automation" territory. Different product, different complexity | Link to existing Cito sales process; the tool informs, not closes |
| Negotiation/korting calculator for Cito's own pricing | Would expose internal pricing strategy. External users should not see Cito's discount logic | Keep in internal mode only as sensitivity analysis on COMPETITOR pricing |
| Feature-by-feature product comparison matrix | Quickly becomes a maintenance nightmare. Feature sets change faster than prices. Also shifts conversation from value to checklist-ticking | Use narrative "onderscheidend vermogen" per module -- what does Cito do that others don't, in prose |
| Multi-language support | Dutch-only market. English adds development cost for zero users | Ship in Dutch only. Formeel "u"-vorm in external mode |
| Complex data visualization (interactive charts, drill-downs) | Over-engineering for an audience that wants a simple answer. School admins are not data analysts | One clear bar chart for comparison, one break-even chart for ROI. That's it |
| Competitor bashing or biased language | Destroys the credibility that IS the value proposition. The moment it feels like an ad, trust evaporates | Neutral language, show both strengths and gaps honestly. Let the numbers speak |

## Feature Dependencies

```
School Profile Input ──────────────────┐
                                       ├──> Per-pupil cost calculation
Module Selection ──────────────────────┘
                                               │
                                               ├──> Total cost overview (Scenario A)
Price Data (upload/manual/AI) ─────────────────┘
                                               │
                                               ├──> Visual comparison (bar chart)
                                               │
                                               ├──> Sensitivity analysis (internal mode)
                                               │
                                               └──> Market average benchmark

Task-level time estimates ─────────────┐
                                       ├──> Time savings calculator (Scenario B)
School profile (for frequency calc) ───┘
                                               │
                                               ├──> Hours-to-euros conversion
                                               │         │
                                               │         ├──> Multi-year projection
                                               │         │         │
                                               │         │         └──> Payback period
                                               │         │
                                               │         └──> Combined business case (A+B)
                                               │
                                               └──> Audience-specific views

Print/Export ← depends on all output sections being renderable

External/Internal mode toggle ← independent; controls visibility of sections

Scenario C (future) = Scenario A output + Scenario B output combined
```

**Key dependency insight:** Scenario A (price comparison) and Scenario B (migration business case) are largely independent and can be built in parallel or sequenced either way. Scenario C is their composition -- it should NOT be built separately but should emerge naturally from combining A and B outputs.

## MVP Recommendation

### Phase 1: Scenario A -- Price Comparison (core trust-builder)

Prioritize:
1. **School profile input** (student count, level) -- foundation for everything
2. **Module selection** with Cito, DIA, JIJ catalogs -- the core comparison
3. **Per-pupil and total cost calculation** -- the primary output
4. **Bar chart comparison** -- visual impact
5. **Price source and freshness indicators** -- trust through transparency
6. **Print-optimized output** -- how results travel in schools
7. **Manual price input** -- simplest of the three input paths

Defer from Phase 1:
- Document upload and AI price lookup (complex, not needed for v1 if prices are pre-loaded)
- Internal mode / sensitivity analysis (build external credibility first)
- Audience-specific views (add after validating the core comparison works)

### Phase 2: Scenario B -- Migration Business Case

Prioritize:
1. **Time savings calculator** with pre-configured tasks
2. **Hours-to-euros conversion** with adjustable hourly rate
3. **Multi-year projection** (1, 3, 5 year)
4. **Payback period visualization**
5. **Combined financial + time-savings summary**

### Phase 3: Dual Modes & Polish

1. **Internal/external mode toggle**
2. **Sensitivity analysis** (competitor discount scenarios)
3. **Audience-specific views** (coordinator, directie, finance)
4. **Document upload for price data**
5. **Market average benchmark**
6. **Clipboard copy of summary**

### Phase 4: Scenario C & Intelligence

1. **Scenario C** as natural composition of A + B
2. **AI-powered price lookup** (if validated as feasible)
3. **Price verification workflow** for internal data management

## Feature Prioritization Matrix

| Feature | Impact | Complexity | Trust Value | Phase |
|---------|--------|------------|-------------|-------|
| Module-based price comparison | HIGH | Low | HIGH | 1 |
| Per-pupil cost breakdown | HIGH | Low | HIGH | 1 |
| Total cost overview | HIGH | Low | MEDIUM | 1 |
| Price freshness indicators | MEDIUM | Low | HIGH | 1 |
| Expandable calculation details | MEDIUM | Medium | HIGH | 1 |
| Bar chart comparison | HIGH | Medium | MEDIUM | 1 |
| Print-optimized view | HIGH | Medium | LOW | 1 |
| Manual price input | MEDIUM | Low | MEDIUM | 1 |
| Time savings calculator | HIGH | Medium | HIGH | 2 |
| Hours-to-euros conversion | HIGH | Low | MEDIUM | 2 |
| Multi-year projection | HIGH | Medium | MEDIUM | 2 |
| Payback period visualization | HIGH | Medium | HIGH | 2 |
| Internal/external mode toggle | MEDIUM | Medium | LOW | 3 |
| Sensitivity analysis | MEDIUM | Medium | MEDIUM | 3 |
| Audience-specific views | MEDIUM | Low | LOW | 3 |
| Document upload (price data) | LOW | High | LOW | 3 |
| AI price lookup | LOW | High | LOW | 4 |
| Scenario C composition | MEDIUM | Low | MEDIUM | 4 |

## Sources

- [NN/g: 12 Design Recommendations for Calculator and Quiz Tools](https://www.nngroup.com/articles/recommendations-calculator/) -- HIGH confidence, authoritative UX research
- [Dock.us: 32 B2B Calculator Examples](https://www.dock.us/revenue-archives/calculators) -- MEDIUM confidence, pattern library
- [Outgrow: 9 Calculators Every SaaS Company Should Consider](https://outgrow.co/blog/interactive-calculators-saas-companies) -- MEDIUM confidence, practitioner perspective
- [Azure TCO Calculator](https://azure.microsoft.com/en-us/pricing/tco/calculator/) -- HIGH confidence, best-in-class TCO calculator example
- [AWS Migration Evaluator](https://aws.amazon.com/migration-evaluator/) -- HIGH confidence, migration business case tooling reference
- [Highspot ROI Calculator](https://www.highspot.com/roi-calculator/) -- MEDIUM confidence, sales enablement ROI example
- [Calconic: Interactive Calculator UX](https://www.calconic.com/improve-user-experience-with-interactive-calculator) -- MEDIUM confidence, calculator UX patterns
- [The Access Group: Education Software Pricing Models](https://www.theaccessgroup.com/en-gb/education/software/educational-software-pricing/) -- MEDIUM confidence, education pricing context
- [Capterra: School Management Software Cost](https://www.capterra.com/resources/school-management-software-cost/) -- MEDIUM confidence, education market pricing data
- [NN/g: Slider Design Rules of Thumb](https://www.nngroup.com/articles/gui-slider-controls/) -- HIGH confidence, input control UX
