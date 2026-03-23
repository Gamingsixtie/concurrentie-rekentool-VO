import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ActionItem as ActionItemType, Conversation } from '@/db/types';

interface ActionItemProps {
  action: ActionItemType;
  conversations: Conversation[];
  onDelete: (id: string) => void;
}

export default function ActionItemCard({
  action,
  conversations,
  onDelete,
}: ActionItemProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Auto-reset delete confirmation after 3 seconds
  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  // Find linked conversation
  const linkedConversation = action.conversationId
    ? conversations.find(c => c.id === action.conversationId)
    : null;

  const linkedDate = linkedConversation
    ? new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'numeric',
      }).format(new Date(linkedConversation.date))
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-neutral-200 rounded-lg p-3 flex items-start gap-2"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex-shrink-0 w-[44px] h-[44px] flex items-center justify-center text-neutral-400 cursor-grab active:cursor-grabbing touch-none"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="3" cy="2" r="1.5" />
          <circle cx="9" cy="2" r="1.5" />
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="9" cy="8" r="1.5" />
          <circle cx="3" cy="14" r="1.5" />
          <circle cx="9" cy="14" r="1.5" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-neutral-700">{action.title}</p>
        {linkedDate && (
          <p className="text-[14px] text-neutral-500 mt-0.5 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8L2 8L2 4" />
              <path d="M12 7A5 5 0 1 0 7 12" />
            </svg>
            Gesprek {linkedDate}
          </p>
        )}
      </div>

      {/* Delete with confirmation */}
      {confirmingDelete ? (
        <button
          type="button"
          onClick={() => {
            onDelete(action.id);
            setConfirmingDelete(false);
          }}
          className="flex-shrink-0 text-[13px] font-semibold text-red-600 hover:text-red-700 whitespace-nowrap transition-colors"
        >
          Verwijderen?
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 2L10 10M10 2L2 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
