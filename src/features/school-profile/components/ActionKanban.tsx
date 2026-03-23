import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useUpdateAction, useCreateAction, useDeleteAction } from '@/hooks/useActions';
import type { ActionItem as ActionItemType, Conversation } from '@/db/types';
import ActionItemCard from '@/features/school-profile/components/ActionItem';

interface ActionKanbanProps {
  actions: ActionItemType[];
  conversations: Conversation[];
  schoolId: string;
  onAddAction: (conversationId?: string) => void;
}

type ColumnStatus = 'todo' | 'in-progress' | 'done';

const COLUMNS: { status: ColumnStatus; label: string; headerBg: string; headerText: string }[] = [
  { status: 'todo', label: 'Te doen', headerBg: 'bg-amber-50', headerText: 'text-amber-800' },
  { status: 'in-progress', label: 'In uitvoering', headerBg: 'bg-blue-50', headerText: 'text-blue-800' },
  { status: 'done', label: 'Afgerond', headerBg: 'bg-green-50', headerText: 'text-green-800' },
];

function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`bg-white border border-neutral-200 rounded-b-lg p-2 min-h-[120px] flex flex-col gap-2 transition-colors ${
        isOver ? 'border-cito-primary border-dashed border-2' : ''
      }`}
    >
      {children}
    </div>
  );
}

export default function ActionKanban({
  actions,
  conversations,
  schoolId,
  onAddAction: _onAddAction,
}: ActionKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingTitle, setAddingTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const updateActionMutation = useUpdateAction();
  const createActionMutation = useCreateAction();
  const deleteActionMutation = useDeleteAction();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const actionId = active.id as string;
    const overId = over.id as string;

    // Determine target column
    let targetStatus: ColumnStatus | null = null;

    // Check if dropped on a column
    for (const col of COLUMNS) {
      if (overId === col.status) {
        targetStatus = col.status;
        break;
      }
    }

    // Check if dropped on another action item
    if (!targetStatus) {
      const targetAction = actions.find(a => a.id === overId);
      if (targetAction) {
        targetStatus = targetAction.status;
      }
    }

    if (!targetStatus) return;

    const currentAction = actions.find(a => a.id === actionId);
    if (!currentAction || currentAction.status === targetStatus) return;

    updateActionMutation.mutate({
      schoolId,
      actionId,
      data: {
        status: targetStatus,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleAddAction = () => {
    if (!addingTitle.trim()) return;
    createActionMutation.mutate(
      { schoolId, data: { title: addingTitle.trim() } },
      {
        onSuccess: () => {
          setAddingTitle('');
          setShowAddForm(false);
        },
      },
    );
  };

  const handleDeleteAction = (id: string) => {
    deleteActionMutation.mutate({ schoolId, actionId: id });
  };

  const activeAction = activeId ? actions.find(a => a.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const columnActions = actions.filter(a => a.status === col.status);
          return (
            <div key={col.status}>
              {/* Column header */}
              <div
                className={`${col.headerBg} ${col.headerText} px-3 py-2 rounded-t-lg text-[14px] font-semibold`}
              >
                {col.label} ({columnActions.length})
              </div>

              {/* Column body */}
              <DroppableColumn id={col.status}>
                <SortableContext
                  items={columnActions.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnActions.map(action => (
                    <ActionItemCard
                      key={action.id}
                      action={action}
                      conversations={conversations}
                      onDelete={handleDeleteAction}
                    />
                  ))}
                </SortableContext>

                {columnActions.length === 0 && (
                  <div className="border border-dashed border-neutral-200 rounded-lg py-6 text-center">
                    <p className="text-[14px] text-neutral-400">Geen acties</p>
                  </div>
                )}

                {/* Add button in todo column */}
                {col.status === 'todo' && (
                  <>
                    {showAddForm ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          value={addingTitle}
                          onChange={e => setAddingTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddAction();
                            if (e.key === 'Escape') {
                              setShowAddForm(false);
                              setAddingTitle('');
                            }
                          }}
                          placeholder="Actietitel..."
                          autoFocus
                          className="flex-1 h-[36px] border border-neutral-200 rounded-lg px-2 text-[14px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary"
                        />
                        <button
                          type="button"
                          onClick={handleAddAction}
                          className="h-[36px] px-3 text-[14px] font-semibold bg-cito-accent text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          Toevoegen
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="w-full h-[44px] text-[14px] text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      >
                        + Actie toevoegen
                      </button>
                    )}
                  </>
                )}
              </DroppableColumn>
            </div>
          );
        })}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeAction && (
          <div className="shadow-lg opacity-90 rotate-2">
            <ActionItemCard
              action={activeAction}
              conversations={conversations}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
