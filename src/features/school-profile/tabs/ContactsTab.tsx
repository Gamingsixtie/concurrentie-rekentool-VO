import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { deleteContact, canDeleteContact } from '@/db/operations';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import type { Contact, SchoolRecord } from '@/db/types';
import ContactCard from '@/features/school-profile/components/ContactCard';
import ContactForm from '@/features/school-profile/components/ContactForm';

export default function ContactsTab() {
  const activeSchoolId = useSchoolProfileStore(s => s.activeSchoolId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const school = useLiveQuery(
    () => (activeSchoolId ? db.schools.get(activeSchoolId) : undefined),
    [activeSchoolId],
  );

  if (!school || !activeSchoolId) return null;

  const contacts = school.contacts ?? [];

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingContact(null);
    setFormOpen(true);
  };

  const handleDelete = async (contact: Contact) => {
    await deleteContact(activeSchoolId, contact.id);
  };

  const handleSaved = () => {
    setFormOpen(false);
    setEditingContact(null);
  };

  const getDeleteInfo = (contactId: string) => {
    return canDeleteContact(school as SchoolRecord, contactId);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-semibold text-neutral-900">
          Contactpersonen ({contacts.length})
        </h2>
        <button
          type="button"
          onClick={handleAdd}
          className="h-[44px] px-4 text-[14px] font-semibold bg-cito-accent text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          + Contact toevoegen
        </button>
      </div>

      {/* Contact list */}
      {contacts.length === 0 ? (
        <p className="text-base text-neutral-500">
          Nog geen contactpersonen. Voeg een contactpersoon toe om DMU-informatie bij te houden.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {contacts.map(contact => {
            const { canDelete, linkedConversations } = getDeleteInfo(contact.id);
            return (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canDelete={canDelete}
                linkedConversations={linkedConversations}
              />
            );
          })}
        </div>
      )}

      {/* Contact form slide-over */}
      {formOpen && (
        <ContactForm
          contact={editingContact ?? undefined}
          schoolId={activeSchoolId}
          onClose={() => {
            setFormOpen(false);
            setEditingContact(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
