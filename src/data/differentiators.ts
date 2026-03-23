export interface ModuleDifferentiators {
  moduleId: string;
  cito: string[];
  dia: string[];
  jij: string[];
  saqi: string[];
}

export const MODULE_DIFFERENTIATORS: ModuleDifferentiators[] = [
  {
    moduleId: 'rekenwiskunde',
    cito: ['Remediering in samenwerking met methodeaanbieders', 'Adaptieve toetsafname'],
    dia: ['Adaptief toetsen', 'Koppeling met NUMO voor remediëring', 'Visuele groei-rapportage (Groeiwijzer)'],
    jij: ['Geïntegreerd in IEP-leerlingvolgsysteem', 'Adaptieve toetsroutes (ook praktijkonderwijs)', 'Woordeloze rekentoets beschikbaar (ISK)'],
    saqi: [],
  },
  {
    moduleId: 'nederlands',
    cito: ['Remediering in samenwerking met methodeaanbieders', 'Adaptieve toetsafname'],
    dia: ['Adaptief toetsen', 'Tekstenlab NE oefenmateriaal (begrijpend lezen)', 'Koppeling met NUMO', 'Woordenschat apart toetsbaar (Diawoord)'],
    jij: ['Geïntegreerd in IEP-leerlingvolgsysteem', 'Referentieniveaus 0F-4F', 'NT2-toetsen beschikbaar voor ISK'],
    saqi: [],
  },
  {
    moduleId: 'engels',
    cito: ['Enige aanbieder met gevalideerde VO-toets Engels in LVS'],
    dia: ['Pakket EN: begrijpend lezen + woordenschat', 'Tekstenlab EN oefenmateriaal'],
    jij: ['ERK-geijkt A1-B2/C1 (lezen + luisteren)', 'Kijk-/luistertoetsen als schoolexamen', 'Ook Frans, Duits en Spaans beschikbaar'],
    saqi: [],
  },
  {
    moduleId: 'taalverzorging',
    cito: ['Specifieke toets voor spelling en grammatica'],
    dia: ['Diaspel: adaptief digitaal dictee', 'Spellab: innovatief oefenplatform voor spelling'],
    jij: [],
    saqi: [],
  },
  {
    moduleId: 'sociaal-emotioneel',
    cito: [
      'Breedste constructen: 6 SEF-schalen + 14 LWH-schalen (uniek in markt)',
      'Signalering op 3 niveaus met Handreiking SEF',
      'Deelbaar met Inspectie (monitoring sociale veiligheid)',
      'Onderdeel van LVS — geen apart systeem nodig',
    ],
    dia: [],
    jij: [
      'Zelfevaluaties: leerbenadering, creatief vermogen, sociale context',
      'Onderdeel van basislicentie (geen meerprijs)',
      '21e-eeuwse vaardigheden meten',
    ],
    saqi: [
      'COTAN-gecertificeerd (enige SEF-instrument met COTAN)',
      'Adaptief: gem. 87 items i.p.v. 144 (~20 min afname)',
      'Deelbaar met Inspectie (monitoring sociale veiligheid)',
      'Docentenbeoordeling beschikbaar (18 vragen)',
      'SO/PRO-variant (SAQI OpMaat)',
      'Onafhankelijk van LVS-aanbieder',
    ],
  },
  {
    moduleId: 'cognitieve-capaciteiten',
    cito: ['Marktleider in VO-markt', 'Losse licentie mogelijk'],
    dia: ['NSCCT: niet-schoolse cognitieve capaciteitentoets', 'Digitaal (€9,75) en papier (€4,50) beschikbaar'],
    jij: [],
    saqi: [],
  },
];
