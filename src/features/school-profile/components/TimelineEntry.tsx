import { useState } from 'react';
import type { TimelineEvent } from '@/models/timeline';
import type { Contact, Conversation } from '@/db/types';

interface TimelineEntryProps {
  event: TimelineEvent;
  contacts: Contact[];
  onEdit?: (conversation: Conversation) => void;
  onCreateAction?: (conversationId: string) => void;
}

const SYSTEM_EVENT_COLORS: Record<string, string> = {
  pipeline_changed: 'text-purple-600',
  comparison_created: 'text-blue-600',
  prices_updated: 'text-amber-600',
  school_created: 'text-green-600',
};

// SVG icons for system events
function SystemIcon({ eventType }: { eventType: string }) {
  const color = SYSTEM_EVENT_COLORS[eventType] ?? 'text-neutral-500';
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`inline-block mr-1 ${color}`}
    >
      <circle cx="8" cy="8" r="4" />
    </svg>
  );
}

export default function TimelineEntry({
  event,
  contacts,
  onEdit,
  onCreateAction,
}: TimelineEntryProps) {
  const [expanded, setExpanded] = useState(false);

  if (event.type === 'system') {
    const color = SYSTEM_EVENT_COLORS[event.data.eventType] ?? 'text-neutral-500';
    return (
      <div className="flex items-start gap-3 py-2">
        <div className="flex-shrink-0 mt-0.5">
          <SystemIcon eventType={event.data.eventType} />
        </div>
        <span className={`text-[14px] text-neutral-500 italic ${color}`}>
          {event.data.description}
        </span>
      </div>
    );
  }

  // Conversation entry
  const conversation = event.data;
  const contact = contacts.find(c => c.id === conversation.contactId);
  const contactName = contact?.name ?? 'Onbekend';
  const initials = contactName
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isLong = conversation.content.length > 150;
  const displayContent =
    isLong && !expanded
      ? conversation.content.slice(0, 150) + '...'
      : conversation.content;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 ml-[56px]">
      <div className="flex items-start gap-3">
        {/* Contact initials */}
        <div className="flex-shrink-0 w-[32px] h-[32px] rounded-full bg-cito-primary flex items-center justify-center">
          <span className="text-white text-[14px] font-semibold">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Heading */}
          <p className="text-[16px] font-semibold text-neutral-900">
            Gesprek met {contactName}
          </p>

          {/* Content */}
          <p className="text-[16px] text-neutral-700 mt-1">
            {displayContent}
            {isLong && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-[14px] text-cito-primary ml-1 hover:underline"
              >
                ...meer
              </button>
            )}
          </p>

          {/* Tags */}
          {conversation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {conversation.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center bg-neutral-100 text-neutral-700 border border-neutral-200 text-[14px] rounded-full px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(conversation)}
                className="text-[14px] text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Bewerken
              </button>
            )}
            {onCreateAction && (
              <button
                type="button"
                onClick={() => onCreateAction(conversation.id)}
                className="text-[14px] text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Actie aanmaken
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
