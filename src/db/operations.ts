import { db } from './database';
import type { SchoolRecord, Contact, Conversation, ActionItem, SystemEvent, LostDealInfo } from './types';
import type { PipelineStatus } from '@/models/school';
import { PIPELINE_STATUS_ORDER } from '@/models/school';
import { contactSchema } from '@/features/school-profile/schemas/contact.schema';
import { conversationSchema } from '@/features/school-profile/schemas/conversation.schema';
import { actionSchema } from '@/features/school-profile/schemas/action.schema';
import type { z } from 'zod';

type ContactFormInput = z.input<typeof contactSchema>;
type ConversationFormInput = z.input<typeof conversationSchema>;
type ActionFormInput = z.input<typeof actionSchema>;
import { uniqueSlug } from '@/lib/slugify';

export async function createSchool(name: string): Promise<SchoolRecord> {
  const slug = await uniqueSlug(name);
  const now = new Date();
  const record: Omit<SchoolRecord, 'id'> = {
    slug,
    name,
    createdAt: now,
    updatedAt: now,
    isComplete: false,
    completedSteps: [],
    levels: [],
    studentCounts: {},
    selectedModules: [],
    moduleSetups: [],
    scenario: null,
    appliedOverrides: [],
    migrationHourlyRate: 50,
    migrationTimeSavingOverrides: {},
    // CRM-lite defaults
    contacts: [],
    conversations: [],
    actions: [],
    systemEvents: [{
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: 'school_created',
      description: 'School aangemaakt',
    }],
    pipelineStatus: 'prospect',
    region: '',
    tags: [],
    viewPreference: 'compact',
  };
  const id = await db.schools.add(record as SchoolRecord);
  return { ...record, id } as SchoolRecord;
}

export async function updateSchoolData(
  id: number,
  data: Partial<SchoolRecord>,
): Promise<void> {
  await db.schools.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteSchool(id: number): Promise<void> {
  await db.schools.delete(id);
}

export async function getSchoolBySlug(
  slug: string,
): Promise<SchoolRecord | undefined> {
  return db.schools.where('slug').equals(slug).first();
}

export async function getAllSchools(): Promise<SchoolRecord[]> {
  return db.schools.orderBy('updatedAt').reverse().toArray();
}

// --- Contact CRUD ---

async function getSchoolOrThrow(schoolId: number): Promise<SchoolRecord> {
  const school = await db.schools.get(schoolId);
  if (!school) throw new Error(`School met id ${schoolId} niet gevonden`);
  return school;
}

export async function addContact(
  schoolId: number,
  data: ContactFormInput,
): Promise<Contact> {
  const school = await getSchoolOrThrow(schoolId);
  const now = new Date().toISOString();
  const contact: Contact = {
    id: crypto.randomUUID(),
    name: data.name,
    dmuPosition: data.dmuPosition,
    jobTitle: data.jobTitle ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    preferredChannel: data.preferredChannel ?? 'email',
    authority: data.authority ?? 'adviserend',
    lastContactDate: null,
    notes: data.notes ?? '',
    isPrimary: data.isPrimary ?? false,
    createdAt: now,
  };

  let contacts = [...school.contacts];
  if (contact.isPrimary) {
    contacts = contacts.map(c => ({ ...c, isPrimary: false }));
  }
  contacts.push(contact);

  await updateSchoolData(schoolId, { contacts });
  return contact;
}

export async function updateContact(
  schoolId: number,
  contactId: string,
  data: Partial<Contact>,
): Promise<void> {
  const school = await getSchoolOrThrow(schoolId);
  let contacts = school.contacts.map(c =>
    c.id === contactId ? { ...c, ...data } : c,
  );
  if (data.isPrimary === true) {
    contacts = contacts.map(c =>
      c.id === contactId ? c : { ...c, isPrimary: false },
    );
  }
  await updateSchoolData(schoolId, { contacts });
}

export function canDeleteContact(
  school: SchoolRecord,
  contactId: string,
): { canDelete: boolean; linkedConversations: number } {
  const linkedConversations = school.conversations.filter(
    conv => conv.contactId === contactId,
  ).length;
  return {
    canDelete: linkedConversations === 0,
    linkedConversations,
  };
}

export async function deleteContact(
  schoolId: number,
  contactId: string,
): Promise<void> {
  const school = await getSchoolOrThrow(schoolId);
  const contacts = school.contacts.filter(c => c.id !== contactId);
  await updateSchoolData(schoolId, { contacts });
}

// --- Conversation CRUD ---

export async function addConversation(
  schoolId: number,
  data: ConversationFormInput,
): Promise<Conversation> {
  const school = await getSchoolOrThrow(schoolId);
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    date: data.date,
    contactId: data.contactId,
    content: data.content,
    tags: data.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const conversations = [...school.conversations, conversation];

  // Update the linked contact's lastContactDate
  const contacts = school.contacts.map(c =>
    c.id === data.contactId ? { ...c, lastContactDate: data.date } : c,
  );

  await updateSchoolData(schoolId, { conversations, contacts });
  return conversation;
}

export async function updateConversation(
  schoolId: number,
  conversationId: string,
  data: Partial<Conversation>,
): Promise<void> {
  const school = await getSchoolOrThrow(schoolId);
  const conversations = school.conversations.map(c =>
    c.id === conversationId
      ? { ...c, ...data, updatedAt: new Date().toISOString() }
      : c,
  );
  await updateSchoolData(schoolId, { conversations });
}

// --- Action CRUD ---

export async function addAction(
  schoolId: number,
  data: ActionFormInput,
): Promise<ActionItem> {
  const school = await getSchoolOrThrow(schoolId);
  const now = new Date().toISOString();
  const action: ActionItem = {
    id: crypto.randomUUID(),
    title: data.title,
    status: data.status ?? 'todo',
    conversationId: data.conversationId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const actions = [...school.actions, action];
  await updateSchoolData(schoolId, { actions });
  return action;
}

export async function updateAction(
  schoolId: number,
  actionId: string,
  data: Partial<ActionItem>,
): Promise<void> {
  const school = await getSchoolOrThrow(schoolId);
  const actions = school.actions.map(a =>
    a.id === actionId
      ? { ...a, ...data, updatedAt: new Date().toISOString() }
      : a,
  );
  await updateSchoolData(schoolId, { actions });
}

export async function deleteAction(
  schoolId: number,
  actionId: string,
): Promise<void> {
  const school = await getSchoolOrThrow(schoolId);
  const actions = school.actions.filter(a => a.id !== actionId);
  await updateSchoolData(schoolId, { actions });
}

// --- Pipeline status ---

export async function setPipelineStatus(
  schoolId: number,
  newStatus: PipelineStatus,
  reason?: string,
  lostDealInfo?: LostDealInfo,
): Promise<void> {
  const school = await getSchoolOrThrow(schoolId);
  const oldStatus = school.pipelineStatus;

  const event: SystemEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    eventType: 'pipeline_changed',
    description: `Pipeline gewijzigd: ${oldStatus} → ${newStatus}`,
    ...(reason ? { metadata: { reason } } : {}),
  };

  const systemEvents = [...school.systemEvents, event];

  const update: Partial<SchoolRecord> = {
    pipelineStatus: newStatus,
    systemEvents,
  };

  if (newStatus === 'verloren' && lostDealInfo) {
    update.lostDealInfo = lostDealInfo;
  }

  await updateSchoolData(schoolId, update);
}

export async function addSystemEvent(
  schoolId: number,
  event: Omit<SystemEvent, 'id' | 'timestamp'>,
): Promise<void> {
  const school = await getSchoolOrThrow(schoolId);
  const fullEvent: SystemEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  const systemEvents = [...school.systemEvents, fullEvent];
  await updateSchoolData(schoolId, { systemEvents });
}

// --- Pipeline validation ---

export function validatePipelineTransition(
  from: PipelineStatus,
  to: PipelineStatus,
): { allowed: boolean; requiresReason: boolean; requiresLostDeal: boolean } {
  const fromOrder = PIPELINE_STATUS_ORDER[from];
  const toOrder = PIPELINE_STATUS_ORDER[to];
  const isBackward = toOrder < fromOrder;

  return {
    allowed: true,
    requiresReason: isBackward,
    requiresLostDeal: to === 'verloren',
  };
}
