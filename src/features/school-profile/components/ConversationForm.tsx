import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { conversationSchema } from '@/features/school-profile/schemas/conversation.schema';
import { addConversation, updateConversation } from '@/db/operations';
import type { Contact, Conversation } from '@/db/types';
import TagInput from '@/features/school-profile/components/TagInput';

type ConversationFormInput = z.input<typeof conversationSchema>;

interface ConversationFormProps {
  conversation?: Conversation;
  schoolId: number;
  contacts: Contact[];
  existingTags: string[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ConversationForm({
  conversation,
  schoolId,
  contacts,
  existingTags,
  onClose,
  onSaved,
}: ConversationFormProps) {
  const isEditing = !!conversation;

  const today = new Date().toISOString().slice(0, 10);

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

  const onSubmit = async (data: ConversationFormInput) => {
    if (isEditing && conversation) {
      await updateConversation(schoolId, conversation.id, data);
    } else {
      await addConversation(schoolId, data);
    }
    onSaved();
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
      <h3 className="text-[20px] font-semibold text-neutral-900 mb-4">
        {isEditing ? 'Gesprek bewerken' : 'Gesprek vastleggen'}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Date + Contact row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Datum */}
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

          {/* Contactpersoon */}
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
    </div>
  );
}
