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
    dia: ['Adaptief toetsen', 'Koppeling met NUMO voor remediëring', 'Visuele groei-rapportage (Groeiwijzer)'],
    jij: ['Geïntegreerd in IEP-leerlingvolgsysteem', 'Adaptieve toetsroutes (ook praktijkonderwijs)', 'Woordeloze rekentoets beschikbaar (ISK)'],
  },
  {
    moduleId: 'nederlands',
    cito: ['Remediering in samenwerking met methodeaanbieders', 'Adaptieve toetsafname'],
    dia: ['Adaptief toetsen', 'Tekstenlab NE oefenmateriaal (begrijpend lezen)', 'Koppeling met NUMO', 'Woordenschat apart toetsbaar (Diawoord)'],
    jij: ['Geïntegreerd in IEP-leerlingvolgsysteem', 'Referentieniveaus 0F-4F', 'NT2-toetsen beschikbaar voor ISK'],
  },
  {
    moduleId: 'engels',
    cito: ['Enige aanbieder met gevalideerde VO-toets Engels in LVS'],
    dia: ['Pakket EN: begrijpend lezen + woordenschat', 'Tekstenlab EN oefenmateriaal'],
    jij: ['ERK-geijkt A1-B2/C1 (lezen + luisteren)', 'Kijk-/luistertoetsen als schoolexamen', 'Ook Frans, Duits en Spaans beschikbaar'],
  },
  {
    moduleId: 'taalverzorging',
    cito: ['Specifieke toets voor spelling en grammatica'],
    dia: ['Diaspel: adaptief digitaal dictee', 'Spellab: innovatief oefenplatform voor spelling'],
    jij: [],
  },
  {
    moduleId: 'sociaal-emotioneel',
    cito: ['Wetenschappelijk gevalideerd instrument'],
    dia: [],
    jij: ['Zelfevaluaties: leerbenadering, creatief vermogen, sociale context', 'Onderdeel van basislicentie (geen meerprijs)', '21e-eeuwse vaardigheden meeten'],
  },
  {
    moduleId: 'cognitieve-capaciteiten',
    cito: ['Marktleider in VO-markt', 'Losse licentie mogelijk'],
    dia: ['NSCCT: niet-schoolse cognitieve capaciteitentoets', 'Digitaal (€9,75) en papier (€4,50) beschikbaar'],
    jij: [],
  },
];
