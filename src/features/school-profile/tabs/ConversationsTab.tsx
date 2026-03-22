import { useState, useMemo } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useConversations } from '@/hooks/useConversations';
import { useActions, useCreateAction } from '@/hooks/useActions';
import { useSchools } from '@/hooks/useSchools';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { buildTimeline } from '@/models/timeline';
import type { Conversation } from '@/db/types';
import Timeline from '@/features/school-profile/components/Timeline';
import ConversationForm from '@/features/school-profile/components/ConversationForm';
import ActionKanban from '@/features/school-profile/components/ActionKanban';

export default function ConversationsTab() {
  const activeSchoolId = useSchoolProfileStore(s => s.activeSchoolId);
  const [conversationFormOpen, setConversationFormOpen] = useState(false);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: contacts = [] } = useContacts(activeSchoolId ?? '');
  const { data: conversations = [] } = useConversations(activeSchoolId ?? '');
  const { data: actions = [] } = useActions(activeSchoolId ?? '');
  const { data: schools = [] } = useSchools();
  const createActionMutation = useCreateAction();

  if (!activeSchoolId) return null;

  // Find the current school record for DiffView comparison
  const school = schools.find(s => s.id === activeSchoolId);

  // System events are no longer embedded in school record; use empty array for now
  const systemEvents: never[] = [];

  // Build timeline events
  const timelineEvents = useMemo(
    () => buildTimeline(conversations, systemEvents),
    [conversations, systemEvents],
  );

  // Collect existing tags for autocomplete
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    conversations.forEach(c => c.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [conversations]);

  const handleEditConversation = (conversation: Conversation) => {
    setEditingConversation(conversation);
    setConversationFormOpen(true);
  };

  const handleAddConversation = () => {
    setEditingConversation(null);
    setConversationFormOpen(true);
  };

  const handleSaved = () => {
    setConversationFormOpen(false);
    setEditingConversation(null);
  };

  const handleCreateAction = async (conversationId?: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    const title = conv
      ? `Vervolg: ${conv.content.slice(0, 50)}${conv.content.length > 50 ? '...' : ''}`
      : 'Nieuwe actie';
    createActionMutation.mutate({
      schoolId: activeSchoolId,
      data: { title, conversationId: conversationId ?? null },
    });
  };

  return (
    <div>
      {/* Timeline section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-neutral-900">Gesprekken</h2>
          <button
            type="button"
            onClick={handleAddConversation}
            className="h-[44px] px-4 text-[14px] font-semibold bg-cito-accent text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            + Gesprek vastleggen
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Zoek op tekst, contactpersoon of tag..."
            className="h-[44px] w-full border border-neutral-200 rounded-lg px-4 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary"
          />
        </div>

        {/* Conversation form */}
        {conversationFormOpen && (
          <ConversationForm
            conversation={editingConversation ?? undefined}
            schoolId={activeSchoolId}
            contacts={contacts}
            existingTags={existingTags}
            onClose={() => {
              setConversationFormOpen(false);
              setEditingConversation(null);
            }}
            onSaved={handleSaved}
            school={school}
            actions={actions}
          />
        )}

        {/* Timeline */}
        <Timeline
          events={timelineEvents}
          contacts={contacts}
          searchQuery={searchQuery}
          onEditConversation={handleEditConversation}
          onCreateAction={handleCreateAction}
        />
      </div>

      {/* Acties section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-neutral-900">Acties</h2>
          <button
            type="button"
            onClick={() => {
              /* ActionKanban has its own inline add form */
            }}
            className="h-[44px] px-4 text-[14px] font-semibold bg-cito-accent text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            + Actie toevoegen
          </button>
        </div>

        <ActionKanban
          actions={actions}
          conversations={conversations}
          schoolId={activeSchoolId}
          onAddAction={handleCreateAction}
        />
      </div>
    </div>
  );
}
