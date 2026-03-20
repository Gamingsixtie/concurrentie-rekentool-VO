export type ModuleCategory = 'leerlingvolgsysteem' | 'overige-instrumenten';

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  category: ModuleCategory;
  separateLicense: boolean;
  differentiator?: string;
}

export const MODULE_CATALOG: ModuleDefinition[] = [
  // Leerlingvolgsysteem
  {
    id: 'rekenwiskunde',
    name: 'Reken-Wiskunde',
    description: 'Volg de reken- en wiskundevaardigheden van leerlingen',
    category: 'leerlingvolgsysteem',
    separateLicense: false,
    differentiator: 'Remediering in samenwerking met methodeaanbieders: gratis en legt de expertise neer waar het hoort',
  },
  {
    id: 'nederlands',
    name: 'Nederlands',
    description: 'Volg de taalvaardigheden Nederlands van leerlingen',
    category: 'leerlingvolgsysteem',
    separateLicense: false,
    differentiator: 'Remediering in samenwerking met methodeaanbieders: gratis en legt de expertise neer waar het hoort',
  },
  {
    id: 'engels',
    name: 'Engels',
    description: 'Volg de Engelse taalvaardigheden van leerlingen',
    category: 'leerlingvolgsysteem',
    separateLicense: false,
  },
  // Overige instrumenten
  {
    id: 'taalverzorging',
    name: 'Taalverzorging Nederlands',
    description: 'Toets spelling en grammatica',
    category: 'overige-instrumenten',
    separateLicense: false,
  },
  {
    id: 'sociaal-emotioneel',
    name: 'Sociaal-emotioneel functioneren',
    description: 'Breng het sociaal-emotioneel functioneren van leerlingen in kaart',
    category: 'overige-instrumenten',
    separateLicense: false,
  },
  {
    id: 'cognitieve-capaciteiten',
    name: 'Cognitieve capaciteitentoets',
    description: 'Meet cognitieve capaciteiten van leerlingen (losse licentie)',
    category: 'overige-instrumenten',
    separateLicense: true,
  },
];

export const MODULE_CATEGORIES: Record<ModuleCategory, string> = {
  'leerlingvolgsysteem': 'Leerlingvolgsysteem',
  'overige-instrumenten': 'Overige instrumenten',
};
