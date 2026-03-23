import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import { conversationSchema } from '@/features/school-profile/schemas/conversation.schema';
import { addConversation, updateConversation, addContact, addAction, updateSchoolData } from '@/db/operations';
import type { Contact, Conversation, ActionItem, SchoolRecord } from '@/db/types';
import type { DMUPosition } from '@/models/school';
import TagInput from '@/features/school-profile/components/TagInput';
import IntakeModeToggle from '@/features/school-profile/components/IntakeModeToggle';
import StreamingExtraction, { STREAMING_FIELD_LABELS } from '@/features/school-profile/components/StreamingExtraction';
import DiffView, { type DiffSelection } from '@/features/school-profile/components/DiffView';
import { streamIntakeFromNotes, parseExtractionFromText } from '@/lib/ai-intake';
import type { IntakeExtractionV2 } from '@/features/school-profile/schemas/intake-extraction.schema';
import StructuredIntakeForm from '@/features/school-profile/components/StructuredIntakeForm';
import { detectScenario } from '@/engine/scenario-detection';

type ConversationFormInput = z.input<typeof conversationSchema>;

interface ConversationFormProps {
  conversation?: Conversation;
  schoolId: string;
  contacts: Contact[];
  existingTags: string[];
  onClose: () => void;
  onSaved: () => void;
  /** Called after AI intake confirm to navigate to comparison view. */
  onNavigateToComparison?: () => void;
  school?: SchoolRecord;
  actions?: ActionItem[];
}

// Map extraction DMU positions to school model DMU positions
function mapDmuPosition(dmuPos?: string): DMUPosition {
  if (dmuPos === 'coordinator' || dmuPos === 'mt' || dmuPos === 'finance') {
    return dmuPos;
  }
  return 'overig';
}

export default function ConversationForm({
  conversation,
  schoolId,
  contacts,
  existingTags,
  onClose,
  onSaved,
  onNavigateToComparison,
  school,
  actions = [],
}: ConversationFormProps) {
  const isEditing = !!conversation;
  const today = new Date().toISOString().slice(0, 10);
  const queryClient = useQueryClient();

  // AI intake state
  const [intakeMode, setIntakeMode] = useState<'manual' | 'ai'>('manual');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [streamFields, setStreamFields] = useState<{ label: string; done: boolean }[]>(
    STREAMING_FIELD_LABELS.map(label => ({ label, done: false })),
  );
  const [extractionResult, setExtractionResult] = useState<IntakeExtractionV2 | null>(null);
  const [showDiffView, setShowDiffView] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Manual form
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ConversationFormInput>({
    resolver: zodResolver(conversationSchema),
    defaultValues: conversation
      ? {
          date: conversation.date,
          contactId: conversation.contactId,
          content: conversation.content,
          tags: conversation.tags,
        }
      : {
          date: today,
          contactId: contacts[0]?.id ?? '',
          content: '',
          tags: [],
        },
  });

  const onManualSubmit = async (data: ConversationFormInput) => {
    if (isEditing && conversation) {
      await updateConversation(schoolId, conversation.id, data);
    } else {
      await addConversation(schoolId, data);
    }
    onSaved();
  };

  // Determine streaming field completion from accumulated text
  const updateStreamFieldsFromText = useCallback((text: string) => {
    const fieldDetectors: [string, RegExp][] = [
      ['Niveaus', /"levels"\s*:/],
      ['Leerlingen', /"studentCountsPerLevel"\s*:/],
      ['Modules & aanbieders', /"moduleSetups"\s*:/],
      ['Prijzen', /"pricePerStudent"\s*:/],
      ['Contactpersonen', /"contactPersonen"\s*:/],
      ['Actiepunten', /"actiePunten"\s*:/],
      ['Pipelinesignaal', /"pipelineSignaal"\s*:/],
      ['Verificatiepunten', /"unsureAbout"\s*:/],
    ];

    setStreamFields(
      STREAMING_FIELD_LABELS.map(label => {
        const detector = fieldDetectors.find(([l]) => l === label);
        const done = detector ? detector[1].test(text) : false;
        return { label, done };
      }),
    );
  }, []);

  // Handle AI analysis — accepts notes string from StructuredIntakeForm
  const handleAnalyze = async (notesInput?: string) => {
    const text = notesInput || aiNotes;
    if (!text.trim()) return;

    setAiNotes(text); // Store for conversation record
    setIsAnalyzing(true);
    setAiError(null);
    setStreamFields(STREAMING_FIELD_LABELS.map(label => ({ label, done: false })));

    try {
      let fullText = '';
      for await (const chunk of streamIntakeFromNotes(text)) {
        fullText += chunk;
        updateStreamFieldsFromText(fullText);
      }

      // Mark all fields as done
      setStreamFields(STREAMING_FIELD_LABELS.map(label => ({ label, done: true })));

      const result = parseExtractionFromText(fullText);
      setExtractionResult(result);
      setShowDiffView(true);
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'Analyse mislukt. Controleer uw internetverbinding en probeer opnieuw.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle DiffView confirm - use Supabase mutations (NOT Zustand store per Warning 4)
  const handleDiffConfirm = async (selection: DiffSelection) => {
    setIsSaving(true);
    try {
      // 1. Append new modules to school record via Supabase
      if (school && selection.modules.length > 0) {
        const existingSetups = school.moduleSetups || [];
        const newSetups = selection.modules.map(m => ({
          moduleId: m.moduleId,
          currentProvider: m.provider as 'cito-oud' | 'cito-nieuw' | 'dia' | 'jij' | 'overig' | 'geen',
          pricePerStudent: m.pricePerStudent,
        }));

        // Merge: keep existing, add new (by moduleId)
        const mergedSetups = [...existingSetups];
        for (const ns of newSetups) {
          if (!mergedSetups.find(es => es.moduleId === ns.moduleId)) {
            mergedSetups.push(ns);
          }
        }

        // Also merge selectedModules
        const mergedModules = Array.from(
          new Set([...school.selectedModules, ...selection.modules.map(m => m.moduleId)]),
        );

        // Auto-detect scenario from module setups
        const detection = detectScenario(mergedSetups);

        await updateSchoolData(schoolId, {
          moduleSetups: mergedSetups,
          selectedModules: mergedModules,
          scenario: detection.recommended,
        });
      }

      // 2. Add new contacts
      for (const contact of selection.contacts) {
        await addContact(schoolId, {
          name: contact.naam,
          dmuPosition: mapDmuPosition(contact.dmuPositie),
          jobTitle: contact.rol || '',
          email: contact.email || '',
          phone: contact.telefoon || '',
        });
      }

      // 3. Add new actions
      for (const action of selection.actions) {
        await addAction(schoolId, {
          title: [action.wat, action.wanneer, action.verantwoordelijke].filter(Boolean).join(' - '),
        });
      }

      // 4. Save conversation record with original notes
      const firstContact = contacts[0];
      await addConversation(schoolId, {
        date: today,
        contactId: firstContact?.id ?? '',
        content: aiNotes,
        tags: ['ai-intake'],
      });

      // 5. Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ['contacts', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['actions', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school'] });

      // 6. Close form and navigate to comparison if modules were saved
      onSaved();
      if (selection.modules.length > 0 && onNavigateToComparison) {
        onNavigateToComparison();
      }
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'Opslaan mislukt. Probeer het opnieuw.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle DiffView cancel - go back to notes editing
  const handleDiffCancel = () => {
    setShowDiffView(false);
    setExtractionResult(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  // Show DiffView when extraction is complete and user hasn't cancelled
  if (showDiffView && extractionResult && school) {
    return (
      <div className="mb-6">
        {isSaving && (
          <div className="text-center py-2 mb-2 text-sm font-semibold text-cito-primary">
            Gegevens worden opgeslagen...
          </div>
        )}
        <DiffView
          extraction={extractionResult}
          existingSchool={school}
          existingContacts={contacts}
          existingActions={actions}
          onConfirm={handleDiffConfirm}
          onCancel={handleDiffCancel}
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
      <h3 className="text-[20px] font-semibold text-neutral-900 mb-4">
        {isEditing ? 'Gesprek bewerken' : 'Gesprek vastleggen'}
      </h3>

      {/* Mode toggle - only when creating new conversation */}
      {!isEditing && (
        <IntakeModeToggle mode={intakeMode} onChange={setIntakeMode} />
      )}

      {intakeMode === 'manual' ? (
        /* ─── Manual Mode ─── */
        <form onSubmit={handleSubmit(onManualSubmit)} className="flex flex-col gap-4">
          {/* Date + Contact row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
                Datum <span className="text-red-600">*</span>
              </label>
              <input
                {...register('date')}
                type="date"
                className="h-[44px] w-full border border-neutral-200 rounded-lg px-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary"
              />
              {errors.date && (
                <p className="text-[14px] text-red-600 mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
                Contactpersoon <span className="text-red-600">*</span>
              </label>
              <select
                {...register('contactId')}
                className="h-[44px] w-full border border-neutral-200 rounded-lg px-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary bg-white"
              >
                {contacts.length === 0 && (
                  <option value="">Geen contactpersonen</option>
                )}
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.contactId && (
                <p className="text-[14px] text-red-600 mt-1">{errors.contactId.message}</p>
              )}
            </div>
          </div>

          {/* Inhoud */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Inhoud <span className="text-red-600">*</span>
            </label>
            <textarea
              {...register('content')}
              rows={4}
              className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary resize-y"
            />
            {errors.content && (
              <p className="text-[14px] text-red-600 mt-1">{errors.content.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Tags
            </label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  existingTags={existingTags}
                />
              )}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[44px] px-4 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[44px] px-6 text-[14px] font-semibold bg-cito-accent text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Opslaan...' : 'Gesprek opslaan'}
            </button>
          </div>
        </form>
      ) : (
        /* ─── AI Intake Mode ─── */
        <div className="flex flex-col gap-4">
          <StructuredIntakeForm
            disabled={isAnalyzing}
            onAnalyze={handleAnalyze}
            onCancel={onClose}
          />

          {/* Streaming extraction display */}
          {isAnalyzing && <StreamingExtraction fields={streamFields} />}

          {/* Error message */}
          {aiError && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {aiError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
