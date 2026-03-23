import type { Scenario } from '@/models/school';
import type { Contact } from '@/db/types';

interface DMUContextPanelProps {
  contacts: Contact[];
  scenario: Scenario;
}

const SCENARIO_DMU_MAP: Record<Scenario, { positions: string[]; explanation: string }> = {
  A: {
    positions: ['coordinator', 'mt'],
    explanation: 'Scenario A (vergelijking) is vooral relevant voor coördinatoren (inhoudelijk) en MT (financieel).',
  },
  B: {
    positions: ['finance', 'mt'],
    explanation: 'Scenario B (migratie) is vooral relevant voor finance (kosten/baten) en MT (besluitvorming).',
  },
};

export default function DMUContextPanel({ contacts, scenario }: DMUContextPanelProps) {
  if (contacts.length === 0) return null;

  const mapping = SCENARIO_DMU_MAP[scenario];
  const relevantContacts = contacts.filter((c) =>
    mapping.positions.includes(c.dmuPosition),
  );

  if (relevantContacts.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
        DMU-context
      </div>
      <p className="text-xs text-neutral-500 mb-3">{mapping.explanation}</p>

      <div className="space-y-2">
        {relevantContacts.map((contact) => (
          <div key={contact.id} className="flex items-center gap-3 text-sm">
            <div className="w-7 h-7 rounded-full bg-cito-primary/10 text-cito-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-neutral-900 truncate">{contact.name}</div>
              <div className="text-xs text-neutral-500">{contact.dmuPosition}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
