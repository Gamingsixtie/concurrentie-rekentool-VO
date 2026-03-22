// Configureerbaar door accountmanager -- pas prijzen aan op basis van actuele DIA-informatie

import type { DiaPackage } from '../models/dia-packages';

export const DIA_PACKAGES: DiaPackage[] = [
  {
    id: 'lvs-basis',
    name: 'LVS Basispakket',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels'],
    pricePerStudent: 13.00,
    minModules: 3,
  },
  {
    id: 'lvs-compleet',
    name: 'LVS Compleet',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels', 'sociaal-emotioneel'],
    pricePerStudent: 15.50,
    minModules: 3,
  },
];
