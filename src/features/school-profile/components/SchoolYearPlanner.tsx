import { useMemo, useState, useRef, useEffect } from 'react';
import type { Contact, Conversation, SystemEvent, PlannedTouchpoint } from '@/db/types';
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
  plannedTouchpoints: PlannedTouchpoint[];
  onCreateTouchpoint: (data: { contactId: string; schoolYearStart: number; monthIndex: number; note?: string }) => void;
  onUpdateTouchpoint: (touchpointId: string, data: Partial<Pick<PlannedTouchpoint, 'note' | 'status' | 'monthIndex'>>) => void;
  onDeleteTouchpoint: (touchpointId: string) => void;
  onQuickMark?: (contactId: string, date: string) => void;
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

/** Get available school years from conversations + planned touchpoints */
function getAvailableYears(conversations: Conversation[], touchpoints: PlannedTouchpoint[]): number[] {
  const years = new Set<number>();
  for (const conv of conversations) {
    years.add(getSchoolYearStartYear(new Date(conv.date)));
  }
  for (const tp of touchpoints) {
    years.add(tp.schoolYearStart);
  }
  // Always include current school year
  years.add(getSchoolYearStartYear(new Date()));
  return [...years].sort((a, b) => b - a);
}

// --- Cell Popover ---

type PopoverTarget = { contactId: string; monthIdx: number } | null;

interface CellPopoverProps {
  target: NonNullable<PopoverTarget>;
  contactName: string;
  monthLabel: string;
  activity: MonthActivity | undefined;
  touchpoints: PlannedTouchpoint[];
  onCreateTouchpoint: (note: string) => void;
  onCompleteTouchpoint: (id: string) => void;
  onSkipTouchpoint: (id: string) => void;
  onDeleteTouchpoint: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onMoveTouchpoint: (id: string, newMonthIdx: number) => void;
  onClose: () => void;
}

function CellPopover({
  contactName,
  monthLabel,
  activity,
  touchpoints,
  onCreateTouchpoint,
  onCompleteTouchpoint,
  onSkipTouchpoint,
  onDeleteTouchpoint,
  onUpdateNote,
  onMoveTouchpoint,
  onClose,
}: CellPopoverProps) {
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [movingId, setMovingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const plannedTouchpoints = touchpoints.filter(tp => tp.status === 'planned');
  const completedTouchpoints = touchpoints.filter(tp => tp.status === 'completed');
  const skippedTouchpoints = touchpoints.filter(tp => tp.status === 'skipped');

  const handleSubmitNew = () => {
    onCreateTouchpoint(newNote.trim());
    setNewNote('');
  };

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white rounded-lg border border-neutral-200 shadow-lg p-4 min-w-[280px] max-w-[340px]"
      style={{ top: '100%', left: '50%', transform: 'translateX(-50%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-semibold text-neutral-900">{contactName}</p>
          <p className="text-[12px] text-neutral-500">{monthLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 p-1"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Existing conversations info */}
      {activity && activity.conversationCount > 0 && (
        <div className="mb-3 px-2 py-1.5 bg-cito-primary/5 rounded text-[12px] text-cito-primary font-medium">
          {activity.conversationCount} gesprek{activity.conversationCount !== 1 ? 'ken' : ''} gevoerd
        </div>
      )}

      {/* Planned touchpoints */}
      {plannedTouchpoints.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Gepland</p>
          {plannedTouchpoints.map(tp => (
            <div key={tp.id} className="border border-amber-200 bg-amber-50 rounded-lg p-2">
              {editingId === tp.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    className="w-full text-[13px] px-2 py-1 border border-neutral-200 rounded"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { onUpdateNote(tp.id, editNote); setEditingId(null); }}
                      className="text-[11px] px-2 py-1 bg-cito-primary text-white rounded hover:bg-cito-primary/90"
                    >
                      Opslaan
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-[11px] px-2 py-1 text-neutral-500 hover:text-neutral-700"
                    >
                      Annuleer
                    </button>
                  </div>
                </div>
              ) : movingId === tp.id ? (
                <div className="space-y-2">
                  <p className="text-[12px] text-neutral-600">Verplaats naar:</p>
                  <div className="grid grid-cols-4 gap-1">
                    {SCHOOL_YEAR_MONTHS.map((m, idx) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { onMoveTouchpoint(tp.id, idx); setMovingId(null); }}
                        className={`text-[11px] px-1 py-1 rounded ${
                          idx === tp.monthIndex
                            ? 'bg-amber-300 text-amber-900 font-semibold'
                            : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        {SCHOOL_YEAR_MONTH_SHORT[m]}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMovingId(null)}
                    className="text-[11px] text-neutral-500 hover:text-neutral-700"
                  >
                    Annuleer
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-neutral-800 mb-2">
                    {tp.note || <span className="italic text-neutral-400">Geen notitie</span>}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => onCompleteTouchpoint(tp.id)}
                      className="text-[11px] px-2 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                    >
                      Afgerond
                    </button>
                    <button
                      type="button"
                      onClick={() => onSkipTouchpoint(tp.id)}
                      className="text-[11px] px-2 py-1 bg-neutral-100 text-neutral-600 rounded hover:bg-neutral-200"
                    >
                      Overslaan
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMovingId(tp.id); }}
                      className="text-[11px] px-2 py-1 bg-neutral-100 text-neutral-600 rounded hover:bg-neutral-200"
                    >
                      Verplaats
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingId(tp.id); setEditNote(tp.note); }}
                      className="text-[11px] px-2 py-1 bg-neutral-100 text-neutral-600 rounded hover:bg-neutral-200"
                    >
                      Bewerk
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTouchpoint(tp.id)}
                      className="text-[11px] px-2 py-1 text-red-500 hover:text-red-700"
                    >
                      Verwijder
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed touchpoints */}
      {completedTouchpoints.length > 0 && (
        <div className="mb-3 space-y-1">
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Afgerond</p>
          {completedTouchpoints.map(tp => (
            <div key={tp.id} className="flex items-center gap-1.5 text-[12px] text-emerald-600">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {tp.note || 'Contactmoment'}
            </div>
          ))}
        </div>
      )}

      {/* Skipped touchpoints */}
      {skippedTouchpoints.length > 0 && (
        <div className="mb-3 space-y-1">
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Overgeslagen</p>
          {skippedTouchpoints.map(tp => (
            <div key={tp.id} className="text-[12px] text-neutral-400 line-through">
              {tp.note || 'Contactmoment'}
            </div>
          ))}
        </div>
      )}

      {/* Add new planned touchpoint */}
      <div className="border-t border-neutral-100 pt-3">
        <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Contactmoment plannen
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="bv. Offerte bespreken"
            className="flex-1 text-[13px] px-2 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cito-primary"
            onKeyDown={e => { if (e.key === 'Enter') handleSubmitNew(); }}
          />
          <button
            type="button"
            onClick={handleSubmitNew}
            className="text-[13px] px-3 py-1.5 bg-cito-primary text-white rounded-lg hover:bg-cito-primary/90 font-medium whitespace-nowrap"
          >
            Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Mobile Month Card ---

interface MobileMonthCardProps {
  month: typeof SCHOOL_YEAR_MONTHS[number];
  monthIdx: number;
  isCurrentMonth: boolean;
  year: number;
  contacts: Contact[];
  activityMap: ContactMonthMap;
  touchpointMap: Map<string, PlannedTouchpoint[]>;
  onCellClick: (contactId: string, monthIdx: number) => void;
  popoverTarget: PopoverTarget;
  onCreateTouchpoint: (contactId: string, note: string) => void;
  onCompleteTouchpoint: (id: string) => void;
  onSkipTouchpoint: (id: string) => void;
  onDeleteTouchpoint: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onMoveTouchpoint: (id: string, newMonthIdx: number) => void;
  onClosePopover: () => void;
  onQuickMark?: (contactId: string, monthIdx: number) => void;
}

function MobileMonthCard({
  month,
  monthIdx,
  isCurrentMonth,
  year,
  contacts,
  activityMap,
  touchpointMap,
  onCellClick,
  popoverTarget,
  onCreateTouchpoint,
  onCompleteTouchpoint,
  onSkipTouchpoint,
  onDeleteTouchpoint,
  onUpdateNote,
  onMoveTouchpoint,
  onClosePopover,
  onQuickMark,
}: MobileMonthCardProps) {
  // Contacts with any activity, touchpoints, or that are relevant this month
  const relevantContacts = contacts.filter(c => {
    const activity = activityMap.get(c.id)?.get(monthIdx);
    const tps = touchpointMap.get(c.id);
    const hasActivity = activity && (activity.conversationCount > 0 || activity.hasStatusChange);
    const hasTouchpoints = tps && tps.length > 0;
    return hasActivity || hasTouchpoints;
  });

  if (relevantContacts.length === 0 && !isCurrentMonth) return null;

  return (
    <div
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

      {relevantContacts.length === 0 ? (
        <p className="text-[13px] text-neutral-400">Geen activiteit</p>
      ) : (
        <div className="space-y-2">
          {relevantContacts.map(contact => {
            const activity = activityMap.get(contact.id)?.get(monthIdx);
            const tps = touchpointMap.get(contact.id) ?? [];
            const plannedCount = tps.filter(tp => tp.status === 'planned').length;
            const isOpen = popoverTarget?.contactId === contact.id && popoverTarget?.monthIdx === monthIdx;

            return (
              <div key={contact.id} className="relative">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onCellClick(contact.id, monthIdx)}
                    className="flex-1 flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-neutral-900">
                        {contact.name}
                      </span>
                      <DMUBadge position={contact.dmuPosition} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {activity && activity.conversationCount > 0 && (
                        <span className="text-[11px] font-semibold text-cito-primary bg-cito-primary/10 rounded-full w-5 h-5 inline-flex items-center justify-center">
                          {activity.conversationCount}
                        </span>
                      )}
                      {plannedCount > 0 && (
                        <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full w-5 h-5 inline-flex items-center justify-center">
                          !
                        </span>
                      )}
                      <EngagementBadge status={contact.engagementStatus} size="sm" />
                    </div>
                  </button>
                  {onQuickMark && (
                    <button
                      type="button"
                      onClick={() => onQuickMark(contact.id, monthIdx)}
                      className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 hover:bg-emerald-600 transition-colors"
                      title="Gesproken"
                      aria-label={`Markeer als gesproken: ${contact.name}`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
                {isOpen && (
                  <CellPopover
                    target={{ contactId: contact.id, monthIdx }}
                    contactName={contact.name}
                    monthLabel={`${SCHOOL_YEAR_MONTH_LABELS[month]} ${year}`}
                    activity={activity}
                    touchpoints={tps}
                    onCreateTouchpoint={note => onCreateTouchpoint(contact.id, note)}
                    onCompleteTouchpoint={onCompleteTouchpoint}
                    onSkipTouchpoint={onSkipTouchpoint}
                    onDeleteTouchpoint={onDeleteTouchpoint}
                    onUpdateNote={onUpdateNote}
                    onMoveTouchpoint={onMoveTouchpoint}
                    onClose={onClosePopover}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add button for contacts without activity this month */}
      {contacts.filter(c => !relevantContacts.includes(c)).length > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-100">
          <details className="text-[12px] text-neutral-500">
            <summary className="cursor-pointer hover:text-neutral-700">
              Overige contacten ({contacts.length - relevantContacts.length})
            </summary>
            <div className="mt-2 space-y-1">
              {contacts.filter(c => !relevantContacts.includes(c)).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCellClick(c.id, monthIdx)}
                  className="w-full text-left flex items-center gap-1.5 p-1.5 rounded hover:bg-neutral-50"
                >
                  <span className="text-[12px] text-neutral-600">{c.name}</span>
                  <DMUBadge position={c.dmuPosition} />
                </button>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---

export default function SchoolYearPlanner({
  contacts,
  conversations,
  systemEvents,
  plannedTouchpoints,
  onCreateTouchpoint,
  onUpdateTouchpoint,
  onDeleteTouchpoint,
  onQuickMark,
}: SchoolYearPlannerProps) {
  const currentStartYear = getSchoolYearStartYear(new Date());
  const [selectedStartYear, setSelectedStartYear] = useState(currentStartYear);
  const [popoverTarget, setPopoverTarget] = useState<PopoverTarget>(null);
  const [quickMarkFlash, setQuickMarkFlash] = useState<Set<string>>(new Set());

  const handleQuickMark = (contactId: string, monthIdx: number) => {
    if (!onQuickMark) return;
    const { year, jsMonth } = schoolYearMonthToCalendar(monthIdx, selectedStartYear);
    const date = `${year}-${String(jsMonth + 1).padStart(2, '0')}-01`;
    onQuickMark(contactId, date);

    const key = `${contactId}-${monthIdx}`;
    setQuickMarkFlash(prev => new Set(prev).add(key));
    setTimeout(() => {
      setQuickMarkFlash(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 1500);
  };

  const availableYears = useMemo(
    () => getAvailableYears(conversations, plannedTouchpoints),
    [conversations, plannedTouchpoints],
  );

  const activityMap = useMemo(
    () => buildActivityMap(conversations, systemEvents, selectedStartYear),
    [conversations, systemEvents, selectedStartYear],
  );

  // Build touchpoint map: contactId -> monthIdx -> touchpoints[]
  const touchpointsByContactMonth = useMemo(() => {
    const map = new Map<string, Map<number, PlannedTouchpoint[]>>();
    for (const tp of plannedTouchpoints) {
      if (tp.schoolYearStart !== selectedStartYear) continue;
      if (!map.has(tp.contactId)) map.set(tp.contactId, new Map());
      const contactMap = map.get(tp.contactId)!;
      if (!contactMap.has(tp.monthIndex)) contactMap.set(tp.monthIndex, []);
      contactMap.get(tp.monthIndex)!.push(tp);
    }
    return map;
  }, [plannedTouchpoints, selectedStartYear]);

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
      let convCount = 0;
      let plannedCount = 0;
      for (const contact of sortedContacts) {
        const activity = activityMap.get(contact.id)?.get(idx);
        if (activity && activity.conversationCount > 0) {
          convCount += activity.conversationCount;
        }
        const tps = touchpointsByContactMonth.get(contact.id)?.get(idx);
        if (tps) {
          plannedCount += tps.filter(tp => tp.status === 'planned').length;
        }
      }
      return { convCount, plannedCount };
    });
  }, [sortedContacts, activityMap, touchpointsByContactMonth]);

  const canGoPrev = availableYears.includes(selectedStartYear - 1) || selectedStartYear - 1 >= currentStartYear - 3;
  const canGoNext = selectedStartYear < currentStartYear;

  const handleCellClick = (contactId: string, monthIdx: number) => {
    if (popoverTarget?.contactId === contactId && popoverTarget?.monthIdx === monthIdx) {
      setPopoverTarget(null);
    } else {
      setPopoverTarget({ contactId, monthIdx });
    }
  };

  const handleCreateTouchpoint = (contactId: string, note: string) => {
    onCreateTouchpoint({
      contactId,
      schoolYearStart: selectedStartYear,
      monthIndex: popoverTarget?.monthIdx ?? 0,
      note,
    });
  };

  const handleCompleteTouchpoint = (id: string) => {
    onUpdateTouchpoint(id, { status: 'completed' });
  };

  const handleSkipTouchpoint = (id: string) => {
    onUpdateTouchpoint(id, { status: 'skipped' });
  };

  const handleUpdateNote = (id: string, note: string) => {
    onUpdateTouchpoint(id, { note });
  };

  const handleMoveTouchpoint = (id: string, newMonthIdx: number) => {
    onUpdateTouchpoint(id, { monthIndex: newMonthIdx });
    setPopoverTarget(null);
  };

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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-[12px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-cito-primary bg-cito-primary/10 rounded-full w-5 h-5 inline-flex items-center justify-center">1</span>
          Gesprekken
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full w-5 h-5 inline-flex items-center justify-center">!</span>
          Gepland
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Afgerond
        </span>
        {onQuickMark && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-500 inline-flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Snel markeren (hover)
          </span>
        )}
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
              const contactTouchpoints = touchpointsByContactMonth.get(contact.id);

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
                    const touchpoints = contactTouchpoints?.get(idx) ?? [];
                    const plannedTps = touchpoints.filter(tp => tp.status === 'planned');
                    const completedTps = touchpoints.filter(tp => tp.status === 'completed');
                    const isCurrentMonth = idx === currentMonthIndex;
                    const isOpen = popoverTarget?.contactId === contact.id && popoverTarget?.monthIdx === idx;
                    const hasContent = (activity && (activity.conversationCount > 0 || activity.hasStatusChange)) || touchpoints.length > 0;

                    return (
                      <td
                        key={month}
                        className={`px-1 py-2.5 text-center relative group/cell ${
                          isCurrentMonth ? 'bg-[color:var(--color-cito-primary)]/5' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleCellClick(contact.id, idx)}
                          className={`w-full min-h-[32px] rounded-md transition-colors flex flex-col items-center justify-center gap-0.5 ${
                            hasContent
                              ? 'hover:bg-neutral-100'
                              : 'hover:bg-neutral-50 group'
                          } ${quickMarkFlash.has(`${contact.id}-${idx}`) ? 'animate-pulse bg-emerald-50' : ''}`}
                        >
                          {activity && activity.conversationCount > 0 && (
                            <span className="text-[11px] font-semibold text-cito-primary bg-cito-primary/10 rounded-full w-5 h-5 inline-flex items-center justify-center">
                              {activity.conversationCount}
                            </span>
                          )}
                          {plannedTps.length > 0 && (
                            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full w-5 h-5 inline-flex items-center justify-center">
                              !
                            </span>
                          )}
                          {completedTps.length > 0 && (
                            <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {activity?.hasStatusChange && (
                            <EngagementBadge status={contact.engagementStatus} size="sm" />
                          )}
                          {!hasContent && (
                            <span className="text-neutral-300 group-hover:text-neutral-400 text-[14px] leading-none">+</span>
                          )}
                        </button>
                        {/* Quick-mark button */}
                        {onQuickMark && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleQuickMark(contact.id, idx); }}
                            className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center shadow-sm hover:bg-emerald-600"
                            title="Gesproken"
                            aria-label={`Markeer als gesproken: ${contact.name}`}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}

                        {/* Popover */}
                        {isOpen && (
                          <CellPopover
                            target={{ contactId: contact.id, monthIdx: idx }}
                            contactName={contact.name}
                            monthLabel={`${SCHOOL_YEAR_MONTH_LABELS[month]} ${schoolYearMonthToCalendar(idx, selectedStartYear).year}`}
                            activity={activity}
                            touchpoints={touchpoints}
                            onCreateTouchpoint={note => handleCreateTouchpoint(contact.id, note)}
                            onCompleteTouchpoint={handleCompleteTouchpoint}
                            onSkipTouchpoint={handleSkipTouchpoint}
                            onDeleteTouchpoint={onDeleteTouchpoint}
                            onUpdateNote={handleUpdateNote}
                            onMoveTouchpoint={handleMoveTouchpoint}
                            onClose={() => setPopoverTarget(null)}
                          />
                        )}
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
                    <div className="flex flex-col items-center gap-0.5">
                      {totals.convCount > 0 ? (
                        <span className="text-[12px] font-semibold text-neutral-600">
                          {totals.convCount}
                        </span>
                      ) : (
                        <span className="text-[12px] text-neutral-300">-</span>
                      )}
                      {totals.plannedCount > 0 && (
                        <span className="text-[10px] text-amber-500">
                          {totals.plannedCount} gepland
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* "Nog niet benaderd" notice */}
      {sortedContacts.some(c => {
        const hasActivity = activityMap.get(c.id)?.size;
        const hasTouchpoints = touchpointsByContactMonth.get(c.id)?.size;
        return !hasActivity && !hasTouchpoints;
      }) && (
        <div className="hidden md:block mt-3 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg">
          <p className="text-[13px] text-neutral-500">
            <span className="font-semibold">Nog niet benaderd/gepland: </span>
            {sortedContacts
              .filter(c => {
                const hasActivity = activityMap.get(c.id)?.size;
                const hasTouchpoints = touchpointsByContactMonth.get(c.id)?.size;
                return !hasActivity && !hasTouchpoints;
              })
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

          // Build touchpoint map for this month (contactId -> touchpoints[])
          const monthTouchpointMap = new Map<string, PlannedTouchpoint[]>();
          for (const contact of sortedContacts) {
            const tps = touchpointsByContactMonth.get(contact.id)?.get(idx);
            if (tps) monthTouchpointMap.set(contact.id, tps);
          }

          return (
            <MobileMonthCard
              key={month}
              month={month}
              monthIdx={idx}
              isCurrentMonth={isCurrentMonth}
              year={year}
              contacts={sortedContacts}
              activityMap={activityMap}
              touchpointMap={monthTouchpointMap}
              onCellClick={handleCellClick}
              popoverTarget={popoverTarget}
              onCreateTouchpoint={(contactId, note) => {
                onCreateTouchpoint({
                  contactId,
                  schoolYearStart: selectedStartYear,
                  monthIndex: idx,
                  note,
                });
              }}
              onCompleteTouchpoint={handleCompleteTouchpoint}
              onSkipTouchpoint={handleSkipTouchpoint}
              onDeleteTouchpoint={onDeleteTouchpoint}
              onUpdateNote={handleUpdateNote}
              onMoveTouchpoint={handleMoveTouchpoint}
              onClosePopover={() => setPopoverTarget(null)}
              onQuickMark={onQuickMark ? (contactId, monthIdx) => handleQuickMark(contactId, monthIdx) : undefined}
            />
          );
        })}

        {/* Uncontacted contacts on mobile */}
        {sortedContacts.some(c => {
          const hasActivity = activityMap.get(c.id)?.size;
          const hasTouchpoints = touchpointsByContactMonth.get(c.id)?.size;
          return !hasActivity && !hasTouchpoints;
        }) && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <h4 className="text-[14px] font-semibold text-neutral-600 mb-2">
              Nog niet benaderd/gepland
            </h4>
            <div className="space-y-1.5">
              {sortedContacts
                .filter(c => {
                  const hasActivity = activityMap.get(c.id)?.size;
                  const hasTouchpoints = touchpointsByContactMonth.get(c.id)?.size;
                  return !hasActivity && !hasTouchpoints;
                })
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
