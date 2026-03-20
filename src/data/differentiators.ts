export interface ModuleDifferentiators {
  moduleId: string;
  cito: string[];
  dia: string[];
  jij: string[];
}

export const MODULE_DIFFERENTIATORS: ModuleDifferentiators[] = [
  {
    moduleId: 'rekenwiskunde',
    cito: ['Remediering in samenwerking met methodeaanbieders', 'Adaptieve toetsafname'],
    dia: ['Breed genormeerd'],
    jij: ['Geintegreerd in IEP-leerlingvolgsysteem'],
  },
  {
    moduleId: 'nederlands',
    cito: ['Remediering in samenwerking met methodeaanbieders', 'Adaptieve toetsafname'],
    dia: ['Breed genormeerd'],
    jij: ['Geintegreerd in IEP-leerlingvolgsysteem'],
  },
  {
    moduleId: 'engels',
    cito: ['Enige aanbieder met gevalideerde VO-toets Engels'],
    dia: ['Beschikbaar als optionele module'],
    jij: [],
  },
  {
    moduleId: 'taalverzorging',
    cito: ['Specifieke toets voor spelling en grammatica'],
    dia: [],
    jij: [],
  },
  {
    moduleId: 'sociaal-emotioneel',
    cito: ['Wetenschappelijk gevalideerd instrument'],
    dia: ['Onderdeel van breed SEL-aanbod'],
    jij: [],
  },
  {
    moduleId: 'cognitieve-capaciteiten',
    cito: ['Enige aanbieder in VO-markt', 'Losse licentie mogelijk'],
    dia: [],
    jij: [],
  },
];
