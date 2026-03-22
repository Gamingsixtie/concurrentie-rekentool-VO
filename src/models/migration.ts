/**
 * Tijdswinst-taken voor de migratie van huidig naar nieuw Cito-platform.
 * defaultHoursPerYear is een startwaarde — de consultant past dit aan per schoolgesprek.
 */

export interface TimeSavingTask {
  id: 'rechten' | 'resetten' | 'inloggen' | 'planning' | 'koppeling';
  label: string;
  oldMethodLabel: string;
  newMethodLabel: string;
  defaultHoursPerYear: number;
}

export const TIME_SAVING_TASKS: TimeSavingTask[] = [
  {
    id: 'rechten',
    label: 'Rechten docenten',
    oldMethodLabel: 'Handmatig',
    newMethodLabel: 'Automatisch',
    defaultHoursPerYear: 10,
  },
  {
    id: 'resetten',
    label: 'Toetsen resetten',
    oldMethodLabel: 'Klantenservice bellen',
    newMethodLabel: 'Zelf doen',
    defaultHoursPerYear: 12,
  },
  {
    id: 'inloggen',
    label: 'Inlogmethode',
    oldMethodLabel: 'Startcodes',
    newMethodLabel: 'Entree-federatie',
    defaultHoursPerYear: 8,
  },
  {
    id: 'planning',
    label: 'Planning',
    oldMethodLabel: 'Handmatig',
    newMethodLabel: 'Automatisch voorstel',
    defaultHoursPerYear: 10,
  },
  {
    id: 'koppeling',
    label: 'Leerling-/docentkoppeling',
    oldMethodLabel: 'Handmatig EDEXML',
    newMethodLabel: 'Somtoday/Magister sync',
    defaultHoursPerYear: 8,
  },
];
