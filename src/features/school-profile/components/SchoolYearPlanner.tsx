import { useMemo, useState } from 'react';
import type { Contact, Conversation, SystemEvent } from '@/db/types';
import {
  DMU_POSITION_ORDER,
  SCHOOL_YEAR_MONTHS,
  SCHOOL_YEAR_MONTH_SHORT,
  SCHOOL_YEAR_MONTH_LABELS,
  getSchoolYearStartYear,
  getSchoolYearMonthIndex,
  schoolYearMonthToCalendar,
} from '@/models/school';
import DMUBadge from '@/components/ui/DMUBadge';
import EngagementBadge from '@/components/ui/EngagementBadge';

interface SchoolYearPlannerProps {
  contacts: Contact[];
  conversations: Conversation[];
  systemEvents: SystemEvent[];
}

interface MonthActivity {
  conversationCount: number;
  hasStatusChange: boolean;
}

type ContactMonthMap = Map<string, Map<number, MonthActivity>>;

/** Build a map of contactId -> monthIndex -> activity for a given school year */
function buildActivityMap(
  conversations: Conversation[],
  systemEvents: SystemEvent[],
  startYear: number,
): ContactMonthMap {
  const map: ContactMonthMap = new Map();

  const getOrCreate = (contactId: string, monthIdx: number): MonthActivity => {
    if (!map.has(contactId)) map.set(contactId, new Map());
    const contactMap = map.get(contactId)!;
    if (!contactMap.has(monthIdx)) contactMap.set(monthIdx, { conversationCount: 0, hasStatusChange: false });
    return contactMap.get(monthIdx)!;
  };

  for (const conv of conversations) {
    const date = new Date(conv.date);
    const convStartYear = getSchoolYearStartYear(date);
    if (convStartYear !== startYear) continue;

    const monthIdx = getSchoolYearMonthIndex(date);
    const activity = getOrCreate(conv.contactId, monthIdx);
    activity.conversationCount += 1;
  }

  for (const event of systemEvents) {
    if (event.eventType !== 'engagement_changed') continue;
    const contactId = event.metadata?.contactId;
    if (!contactId) continue;

    const date = new Date(event.timestamp);
    const evtStartYear = getSchoolYearStartYear(date);
    if (evtStartYear !== startYear) continue;

    const monthIdx = getSchoolYearMonthIndex(date);
    const activity = getOrCreate(contactId, monthIdx);
    activity.hasStatusChange = true;
  }

  return map;
}

/** Get available school years from conversations */
function getAvailableYears(conversations: Conversation[]): number[] {
  const years = new Set<number>();
  for (const conv of conversations) {
    years.add(getSchoolYearStartYear(new Date(conv.date)));
  }
  // Always include current school year
  years.add(getSchoolYearStartYear(new Date()));
  return [...years].sort((a, b) => b - a);
}

export default function SchoolYearPlanner({
  contacts,
  conversations,
  systemEvents,
}: SchoolYearPlannerProps) {
  const currentStartYear = getSchoolYearStartYear(new Date());
  const [selectedStartYear, setSelectedStartYear] = useState(currentStartYear);

  const availableYears = useMemo(() => getAvailableYears(conversations), [conversations]);

  const activityMap = useMemo(
    () => buildActivityMap(conversations, systemEvents, selectedStartYear),
    [conversations, systemEvents, selectedStartYear],
  );

  // Sort contacts by DMU position order
  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => DMU_POSITION_ORDER[a.dmuPosition] - DMU_POSITION_ORDER[b.dmuPosition]),
    [contacts],
  );

  const currentMonthIndex = selectedStartYear === currentStartYear
    ? getSchoolYearMonthIndex(new Date())
    : -1;

  const schoolYearLabel = `${selectedStartYear}-${selectedStartYear + 1}`;

  // Totals per month
  const monthTotals = useMemo(() => {
    return SCHOOL_YEAR_MONTHS.map((_, idx) => {
      let contactCount = 0;
      let convCount = 0;
      for (const contact of sortedContacts) {
        const activity = activityMap.get(contact.id)?.get(idx);
        if (activity && activity.conversationCount > 0) {
          contactCount += 1;
          convCount += activity.conversationCount;
        }
      }
      return { contactCount, convCount };
    });
  }, [sortedContacts, activityMap]);

  const canGoPrev = availableYears.includes(selectedStartYear - 1) || selectedStartYear - 1 >= currentStartYear - 3;
  const canGoNext = selectedStartYear < currentStartYear;

  if (contacts.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
        <p className="text-[16px] font-semibold text-neutral-700 mb-1">
          Geen contactpersonen
        </p>
        <p className="text-[14px] text-neutral-500">
          Voeg contactpersonen toe om de schooljaar-planning te gebruiken.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* School year selector */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold text-neutral-900">
          Schooljaar {schoolYearLabel}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedStartYear(y => y - 1)}
            disabled={!canGoPrev}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Vorig schooljaar"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-[14px] text-neutral-600 min-w-[90px] text-center">
            {schoolYearLabel}
          </span>
          <button
            type="button"
            onClick={() => setSelectedStartYear(y => y + 1)}
            disabled={!canGoNext}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Volgend schooljaar"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop: table view */}
      <div className="hidden md:block bg-white rounded-lg border border-neutral-200 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-neutral-50">
              <th className="text-left text-[13px] font-semibold text-neutral-700 px-3 py-2.5 sticky left-0 bg-neutral-50 z-10 min-w-[160px] border-r border-neutral-200">
                Contact
              </th>
              {SCHOOL_YEAR_MONTHS.map((month, idx) => (
                <th
                  key={month}
                  className={`text-center text-[13px] font-semibold px-1.5 py-2.5 min-w-[56px] ${
                    idx === currentMonthIndex
                      ? 'text-cito-primary bg-[color:var(--color-cito-primary)]/5'
                      : 'text-neutral-700'
                  }`}
                >
                  {SCHOOL_YEAR_MONTH_SHORT[month]}
                  {idx === currentMonthIndex && (
                    <div className="h-0.5 bg-cito-primary rounded-full mt-1 mx-1" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedContacts.map(contact => {
              const contactActivity = activityMap.get(contact.id);

              return (
                <tr key={contact.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2.5 sticky left-0 bg-white z-10 border-r border-neutral-200">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-neutral-900 truncate max-w-[90px]">
                        {contact.name}
                      </span>
                      <DMUBadge position={contact.dmuPosition} />
                    </div>
                  </td>
                  {SCHOOL_YEAR_MONTHS.map((month, idx) => {
                    const activity = contactActivity?.get(idx);
                    const isCurrentMonth = idx === currentMonthIndex;

                    return (
                      <td
                        key={month}
                        className={`px-1 py-2.5 text-center ${
                          isCurrentMonth ? 'bg-[color:var(--color-cito-primary)]/5' : ''
                        }`}
                      >
                        {activity ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {activity.conversationCount > 0 && (
                              <span className="text-[11px] font-semibold text-cito-primary bg-cito-primary/10 rounded-full w-5 h-5 inline-flex items-center justify-center">
                                {activity.conversationCount}
                              </span>
                            )}
                            {activity.hasStatusChange && (
                              <EngagementBadge status={contact.engagementStatus} size="sm" />
                            )}
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Totals row */}
            <tr className="border-t-2 border-neutral-200 bg-neutral-50">
              <td className="px-3 py-2 sticky left-0 bg-neutral-50 z-10 border-r border-neutral-200">
                <span className="text-[13px] font-semibold text-neutral-600">Totaal</span>
              </td>
              {SCHOOL_YEAR_MONTHS.map((month, idx) => {
                const totals = monthTotals[idx];
                const isCurrentMonth = idx === currentMonthIndex;
                return (
                  <td
                    key={month}
                    className={`px-1 py-2 text-center ${
                      isCurrentMonth ? 'bg-[color:var(--color-cito-primary)]/5' : ''
                    }`}
                  >
                    {totals.convCount > 0 ? (
                      <span className="text-[12px] font-semibold text-neutral-600">
                        {totals.convCount}
                      </span>
                    ) : (
                      <span className="text-[12px] text-neutral-300">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* "Nog niet benaderd" notice */}
      {sortedContacts.some(c => !activityMap.get(c.id)?.size) && (
        <div className="hidden md:block mt-3 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg">
          <p className="text-[13px] text-neutral-500">
            <span className="font-semibold">Nog niet benaderd: </span>
            {sortedContacts
              .filter(c => !activityMap.get(c.id)?.size)
              .map(c => c.name)
              .join(', ')}
          </p>
        </div>
      )}

      {/* Mobile: month cards */}
      <div className="md:hidden space-y-4">
        {SCHOOL_YEAR_MONTHS.map((month, idx) => {
          const isCurrentMonth = idx === currentMonthIndex;
          const { year } = schoolYearMonthToCalendar(idx, selectedStartYear);

          // Collect contacts with activity this month
          const activeContacts = sortedContacts.filter(c => {
            const activity = activityMap.get(c.id)?.get(idx);
            return activity && (activity.conversationCount > 0 || activity.hasStatusChange);
          });

          if (activeContacts.length === 0 && !isCurrentMonth) return null;

          return (
            <div
              key={month}
              className={`rounded-lg border p-4 ${
                isCurrentMonth
                  ? 'border-cito-primary/40 bg-cito-primary/5'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-[14px] font-semibold ${
                  isCurrentMonth ? 'text-cito-primary' : 'text-neutral-700'
                }`}>
                  {SCHOOL_YEAR_MONTH_LABELS[month]} {year}
                </h4>
                {isCurrentMonth && (
                  <span className="text-[11px] font-semibold text-cito-primary bg-cito-primary/10 rounded-full px-2 py-0.5">
                    Nu
                  </span>
                )}
              </div>

              {activeContacts.length === 0 ? (
                <p className="text-[13px] text-neutral-400">Geen activiteit</p>
              ) : (
                <div className="space-y-2">
                  {activeContacts.map(contact => {
                    const activity = activityMap.get(contact.id)?.get(idx)!;
                    return (
                      <div key={contact.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium text-neutral-900">
                            {contact.name}
                          </span>
                          <DMUBadge position={contact.dmuPosition} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {activity.conversationCount > 0 && (
                            <span className="text-[12px] text-neutral-500">
                              {activity.conversationCount} gesprek{activity.conversationCount !== 1 ? 'ken' : ''}
                            </span>
                          )}
                          <EngagementBadge status={contact.engagementStatus} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Uncontacted contacts on mobile */}
        {sortedContacts.some(c => !activityMap.get(c.id)?.size) && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <h4 className="text-[14px] font-semibold text-neutral-600 mb-2">
              Nog niet benaderd
            </h4>
            <div className="space-y-1.5">
              {sortedContacts
                .filter(c => !activityMap.get(c.id)?.size)
                .map(contact => (
                  <div key={contact.id} className="flex items-center gap-1.5">
                    <span className="text-[13px] text-neutral-700">{contact.name}</span>
                    <DMUBadge position={contact.dmuPosition} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
