// DIA VO pakketten — prijzen uit DIA Webshop (shop.dia.nl), schooljaar 2025-2026.
// Geverifieerd: maart 2026.

import type { DiaPackage } from '../models/dia-packages';

export const DIA_PACKAGES: DiaPackage[] = [
  // ── Taalpakketten ──────────────────────────────────────────────────────────
  {
    id: 'pakket-ne',
    name: 'VO Pakket NE',
    includedModuleIds: ['nederlands'],
    pricePerStudent: 5.84,
    minModules: 2,
    // Diatekst NE (lezen) + Diawoord NE (woordenschat) — 2 DIA-modules, 1 tool-module
  },
  {
    id: 'pakket-ne-compleet',
    name: 'VO Pakket NE compleet',
    includedModuleIds: ['nederlands', 'taalverzorging'],
    pricePerStudent: 8.58,
    minModules: 2,
    // Diatekst NE + Diawoord NE + Diaspel — 3 DIA-modules
  },
  {
    id: 'pakket-en',
    name: 'VO Pakket EN compleet',
    includedModuleIds: ['engels'],
    pricePerStudent: 5.84,
    minModules: 2,
    // Diatekst EN (lezen) + Diawoord EN (woordenschat) — 2 DIA-modules, 1 tool-module
  },

  // ── Combinatiepakketten ────────────────────────────────────────────────────
  {
    id: 'pakket-compleet',
    name: 'VO Pakket compleet',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging'],
    pricePerStudent: 18.13,
    minModules: 3,
    // Alle 7 DIA LVS-modules: Diatekst NE, Diawoord NE, Diaspel, Diacijfer, Diawisk, Diatekst EN, Diawoord EN
  },

  // ── Basisvaardigheden pakketten (inclusief oefenmateriaal) ─────────────────
  {
    id: 'basisvaardigheden-2',
    name: 'VO Basisvaardigheden 2',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging'],
    pricePerStudent: 21.10,
    minModules: 3,
    // 5 modules + Diaplus Burgerschap (oefenmateriaal)
  },
  {
    id: 'basisvaardigheden-1-plus',
    name: 'VO Basisvaardigheden 1+',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging'],
    pricePerStudent: 35.58,
    minModules: 3,
    // Uitgebreid pakket inclusief alle oefenmateriaal (Tekstenlab, Spellab, Burgerschap)
  },
];
