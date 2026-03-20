# Technology Stack

**Project:** Rekentool VO -- Prijsvergelijking & Overstap Business Case
**Researched:** 2026-03-20
**Overall confidence:** HIGH

## Decision: React over Svelte

This project should use **React** because:

1. **Charting ecosystem is mature**: Recharts is React-native, composable, and renders SVG (critical for print). Svelte's charting options (LayerChart, Svend3r) are newer and less battle-tested.
2. **Print/export story is solved**: `react-to-print` (833K weekly downloads) handles the browser print workflow. Svelte has no equivalent.
3. **Cito is a corporate environment**: React developers are easier to find and onboard in the Netherlands. Svelte talent is scarce.
4. **The app is a single-page tool, not a web app**: No routing, no SSR, no complex state -- React's heavier runtime (~40KB) is irrelevant for a tool loaded once per session.
5. **TypeScript support is first-class**: React + TypeScript is the most documented combination in the ecosystem.

Svelte would deliver a smaller bundle and arguably cleaner code, but the charting/print ecosystem gap and hiring considerations outweigh those benefits for this project.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | 19.2.x | UI framework | Largest ecosystem, best charting/print library support, corporate-friendly hiring pool | HIGH |
| TypeScript | 5.x | Type safety | Pricing calculations need type safety; prevents bugs in financial logic | HIGH |
| Vite | 8.0.x | Build tool | 10-30x faster builds with Rolldown engine; trivial static deployment; `vite build` produces a `dist/` folder ready for any web server | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.2.x | Utility-first CSS | Built-in `print:` variant for print stylesheets; responsive utilities for tablet; fast prototyping; Cito brand colors defined once as CSS variables | HIGH |

**Print strategy:** Use Tailwind's `print:hidden` / `print:block` modifiers to control what appears in print output. Add a small `print.css` for page breaks and margins. No PDF generation library needed -- browser `window.print()` via `react-to-print` produces professional output when print CSS is done right.

### Charting / Visualization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | 3.8.x | Bar charts, comparison visuals | React-native (composable components); renders SVG (prints cleanly, unlike Canvas-based Chart.js); small datasets (<100 data points) so performance is not a concern; built-in responsive container | HIGH |

**Why not Chart.js:** Chart.js renders to `<canvas>`, which produces blurry output when printed and requires separate image export handling. Recharts renders `<svg>`, which prints at native resolution and scales perfectly. For a print-heavy sales tool, this is decisive.

### Print / Export

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-to-print | 3.3.x | Browser print dialog | 833K weekly downloads; handles print lifecycle (expand sections, wait for render, trigger print); no server needed | HIGH |
| Native Clipboard API | -- | Copy summary to clipboard | `navigator.clipboard.writeText()` is supported in all modern browsers; no library needed | HIGH |

**Why not jsPDF / html2pdf.js:** These add 150KB+ to the bundle and produce inferior output compared to browser-native printing with proper CSS. The PROJECT.md specifies "printbare output" and "print-geoptimaliseerde CSS" -- this is exactly what `@media print` CSS rules deliver. PDF generation would be over-engineering.

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React useState/useReducer | (built-in) | Component state | The app is stateless (no persistence). All state is user input + derived calculations. React's built-in hooks are sufficient; adding Redux or Zustand would be over-engineering | HIGH |

**Pattern:** Use `useReducer` for the calculation engine (school config -> derived pricing state). Use `useState` for UI state (which sections are expanded, which mode is active). No external state library.

### Data Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Embedded JSON/TypeScript modules | -- | Pricing data, product catalog, time savings data | No backend. All data is embedded at build time as typed TypeScript objects. Easy to update by editing source files and rebuilding | HIGH |

**Structure:**
```
src/data/
  products.ts       # Product catalog (modules, features per provider)
  pricing.ts        # Pricing tables (Cito, DIA, JIJ)
  timeSavings.ts    # Time savings per task (minutes old vs new)
  config.ts         # Defaults (hourly rate, school size presets)
```

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| clsx | 2.x | Conditional class names | Combining Tailwind classes conditionally (e.g., mode-dependent styling) | HIGH |
| @headlessui/react | 2.x | Accessible UI primitives | Dropdowns, toggles, disclosure (expand/collapse) components -- unstyled, Tailwind-compatible | MEDIUM |

### Development Tools

| Tool | Version | Purpose | Why | Confidence |
|------|---------|---------|-----|------------|
| ESLint | 9.x | Code quality | Catches bugs in calculation logic before they ship | HIGH |
| Prettier | 3.x | Code formatting | Consistent formatting across contributors | HIGH |
| Vitest | 3.x | Unit testing | Vite-native test runner; critical for testing pricing calculations and time savings formulas | HIGH |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Next.js / Remix / SvelteKit | No SSR, no routing, no API routes needed. This is a single-page static tool. A full framework adds complexity for zero benefit. |
| Redux / Zustand / Jotai | Over-engineering. The app has no shared state across distant components. `useReducer` handles the calculation engine pattern perfectly. |
| Chart.js / react-chartjs-2 | Canvas-based rendering produces blurry prints. SVG (Recharts) is mandatory for a print-focused sales tool. |
| jsPDF / html2pdf.js / pdfmake | 150KB+ bundle bloat for inferior output. Browser `window.print()` with proper print CSS is superior. |
| Material UI / Ant Design / Chakra UI | Heavy component libraries (300KB+) that fight Cito's brand identity. Tailwind + headlessUI gives full control over Cito styling. |
| i18next / react-intl | The tool is Dutch-only. Hardcoded Dutch strings in components. No internationalization needed. |
| D3.js (directly) | Powerful but imperative and verbose. Recharts wraps D3 in React components -- use the wrapper. |
| Firebase / Supabase / any backend | The tool is explicitly stateless. No user accounts, no saved comparisons. All data is embedded. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Framework | React 19 | Svelte 5 | Weaker charting/print ecosystem; smaller hiring pool in NL corporate |
| Framework | React 19 | Vue 3 | Similar capability but React's Recharts + react-to-print combination is stronger than Vue equivalents |
| Build tool | Vite 8 | Webpack 5 | Vite is 5-30x faster; simpler config; industry standard for new projects |
| Charts | Recharts | Nivo | Nivo is excellent but heavier; Recharts is simpler for bar charts and comparison visuals |
| Charts | Recharts | Apache ECharts | Overkill for simple bar charts; imperative API doesn't fit React patterns |
| Styling | Tailwind CSS 4 | CSS Modules | Tailwind's `print:` variant and responsive utilities save significant development time |
| Styling | Tailwind CSS 4 | Styled Components | Runtime CSS-in-JS is being phased out; Tailwind is zero-runtime |
| Print | react-to-print + CSS | Puppeteer/Playwright PDF | Requires a server. This tool must work fully client-side |

## Stack Patterns

### Pattern: Calculation Engine as Pure Functions

```typescript
// src/engine/pricing.ts
export function calculateModuleCost(
  provider: Provider,
  module: Module,
  studentCount: number
): PricingResult {
  // Pure function: input -> output, no side effects
  // Easy to test with Vitest
}

// src/engine/timeSavings.ts
export function calculateTimeSavings(
  tasks: TaskSelection[],
  schoolConfig: SchoolConfig
): TimeSavingsResult {
  // Hours saved per year, converted to euros at configurable hourly rate
}
```

**Why:** Separating calculation logic from UI makes it testable, debuggable, and auditable. Pricing calculations must be correct -- pure functions with unit tests guarantee this.

### Pattern: Print-Ready Layout

```tsx
// Component uses Tailwind print variants
<div className="print:break-before-page">
  <section className="print:block hidden"> {/* Print header with Cito logo */} </section>
  <InteractiveControls className="print:hidden" /> {/* Hide controls in print */}
  <ResultsTable className="print:text-sm" /> {/* Smaller text in print */}
</div>
```

### Pattern: Embedded Data with Type Safety

```typescript
// src/data/pricing.ts
export const pricing: Record<Provider, Record<Module, PriceEntry>> = {
  cito: {
    lvsRekenen: {
      pricePerStudent: 4.50,
      verified: true,
      verifiedDate: '2026-01-15',
      source: 'Cito prijslijst 2026',
    },
    // ...
  },
  dia: { /* ... */ },
  jij: { /* ... */ },
} as const;
```

## Version Compatibility Matrix

| Package | Min Version | Tested With | Notes |
|---------|-------------|-------------|-------|
| Node.js | 20.x | 22.x | Vite 8 requires Node 20+ |
| React | 19.0.0 | 19.2.4 | Stable, no RC features needed |
| Vite | 8.0.0 | 8.0.1 | Rolldown bundler (stable) |
| Tailwind CSS | 4.0.0 | 4.2.1 | v4 uses CSS-first config (no tailwind.config.js) |
| Recharts | 3.0.0 | 3.8.0 | v3 has breaking changes from v2; use v3 docs |
| TypeScript | 5.5 | 5.8.x | React 19 types require TS 5.5+ |
| react-to-print | 3.0.0 | 3.3.0 | v3 uses hooks API (useReactToPrint) |

## Installation

```bash
# Create project
npm create vite@latest rekentool-vo -- --template react-ts
cd rekentool-vo

# Core dependencies
npm install recharts react-to-print clsx @headlessui/react

# Tailwind CSS v4 (new CSS-first approach)
npm install tailwindcss @tailwindcss/vite

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D eslint prettier eslint-config-prettier
```

### Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
  },
});
```

### Tailwind CSS v4 Config (CSS-first)

```css
/* src/app.css */
@import "tailwindcss";

@theme {
  --color-cito-primary: #003082;
  --color-cito-accent: #FF6600;
  --color-cito-bg: #F8F9FA;
}
```

## Deployment

Static files only. `npm run build` produces a `dist/` folder. Deploy to:
- Any web server (Apache, Nginx, IIS)
- Azure Static Web Apps (if Cito uses Azure)
- Netlify / Vercel (free tier sufficient)
- Even a SharePoint document library or internal file share

No server runtime needed. No environment variables. No API keys.

## Tablet Considerations

- Tailwind's responsive breakpoints (`md:`, `lg:`) handle tablet layouts
- Touch targets: minimum 44x44px for all interactive elements (Tailwind: `min-h-11 min-w-11`)
- Recharts `<ResponsiveContainer>` automatically resizes charts
- Test on iPad Safari and Chrome Android -- both support `window.print()`

## Sources

- [React 19.2 release blog](https://react.dev/blog/2025/10/01/react-19-2) -- React versions confirmed
- [Vite 8.0 announcement](https://vite.dev/blog/announcing-vite8) -- Rolldown bundler, version confirmed
- [Recharts npm](https://www.npmjs.com/package/recharts) -- v3.8.0 confirmed
- [react-to-print npm](https://www.npmjs.com/package/react-to-print) -- v3.3.0, 833K weekly downloads
- [Tailwind CSS v4 release](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config approach
- [Chart.js npm](https://www.npmjs.com/package/chart.js) -- v4.5.1, canvas-based (not recommended)
- [Svelte npm](https://www.npmjs.com/package/svelte) -- v5.54.0, considered but not recommended
- [Best React Chart Libraries 2025 (LogRocket)](https://blog.logrocket.com/best-react-chart-libraries-2025/) -- Recharts vs Chart.js comparison
- [Tailwind print styles](https://www.jacobparis.com/content/css-print-styles) -- print: variant usage
- [Best Chart Libraries for Svelte 2026 (Weavelinx)](https://weavelinx.com/best-chart-libraries-for-svelte-projects-in-2026/) -- Svelte charting ecosystem assessment
