import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database';
import {
  createSchool,
  updateSchoolData,
  deleteSchool,
  getSchoolBySlug,
  getAllSchools,
  addContact,
  updateContact,
  canDeleteContact,
  deleteContact,
  addConversation,
  updateConversation,
  addAction,
  updateAction,
  deleteAction,
  setPipelineStatus,
  addSystemEvent,
  validatePipelineTransition,
} from '../operations';

describe('School CRUD operations', () => {
  beforeEach(async () => {
    await db.schools.clear();
  });

  it('createSchool creates a record with correct defaults', async () => {
    const school = await createSchool('Montessori College');
    expect(school.id).toBeDefined();
    expect(school.slug).toBe('montessori-college');
    expect(school.name).toBe('Montessori College');
    expect(school.createdAt).toBeInstanceOf(Date);
    expect(school.updatedAt).toBeInstanceOf(Date);
    expect(school.isComplete).toBe(false);
    expect(school.completedSteps).toEqual([]);
    expect(school.levels).toEqual([]);
    expect(school.selectedModules).toEqual([]);
    expect(school.moduleSetups).toEqual([]);
    expect(school.scenario).toBeNull();
    expect(school.appliedOverrides).toEqual([]);
    expect(school.migrationHourlyRate).toBe(50);
    expect(school.migrationTimeSavingOverrides).toEqual({});
  });

  it('createSchool generates unique slugs for duplicate names', async () => {
    const s1 = await createSchool('Montessori College');
    const s2 = await createSchool('Montessori College');
    expect(s1.slug).toBe('montessori-college');
    expect(s2.slug).toBe('montessori-college-2');
  });

  it('getSchoolBySlug returns the school when it exists', async () => {
    await createSchool('Montessori College');
    const found = await getSchoolBySlug('montessori-college');
    expect(found).toBeDefined();
    expect(found!.name).toBe('Montessori College');
  });

  it('getSchoolBySlug returns undefined for nonexistent slug', async () => {
    const found = await getSchoolBySlug('nonexistent');
    expect(found).toBeUndefined();
  });

  it('updateSchoolData updates record and sets newer updatedAt', async () => {
    const school = await createSchool('Test');
    const originalUpdatedAt = school.updatedAt.getTime();

    // Small delay to ensure updatedAt differs
    await new Promise((r) => setTimeout(r, 10));
    await updateSchoolData(school.id!, { levels: ['havo', 'vwo'] });

    const updated = await db.schools.get(school.id!);
    expect(updated!.levels).toEqual(['havo', 'vwo']);
    expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
  });

  it('deleteSchool removes the record', async () => {
    const school = await createSchool('To Delete');
    await deleteSchool(school.id!);
    const found = await getSchoolBySlug(school.slug);
    expect(found).toBeUndefined();
  });

  it('getAllSchools returns schools ordered by updatedAt descending', async () => {
    const s1 = await createSchool('School A');
    await new Promise((r) => setTimeout(r, 10));
    const s2 = await createSchool('School B');
    await new Promise((r) => setTimeout(r, 10));
    await updateSchoolData(s1.id!, { name: 'School A Updated' });

    const all = await getAllSchools();
    expect(all.length).toBe(2);
    // s1 was updated most recently
    expect(all[0].id).toBe(s1.id);
    expect(all[1].id).toBe(s2.id);
  });

  it('can store and query 50 school records', async () => {
    for (let i = 0; i < 50; i++) {
      await createSchool(`School ${i}`);
    }
    const all = await getAllSchools();
    expect(all.length).toBe(50);
  });
});

describe('CRM Contact operations', () => {
  let schoolId: number;

  beforeEach(async () => {
    await db.schools.clear();
    const school = await createSchool('CRM Test School');
    schoolId = school.id!;
  });

  it('addContact creates contact with UUID id', async () => {
    const contact = await addContact(schoolId, {
      name: 'Jan de Vries',
      dmuPosition: 'coordinator',
    });
    expect(contact.id).toBeDefined();
    expect(contact.id.length).toBeGreaterThan(0);
    expect(contact.name).toBe('Jan de Vries');
    expect(contact.dmuPosition).toBe('coordinator');
  });

  it('addContact with isPrimary unsets other contacts isPrimary', async () => {
    const first = await addContact(schoolId, {
      name: 'First',
      dmuPosition: 'coordinator',
      isPrimary: true,
    });
    const second = await addContact(schoolId, {
      name: 'Second',
      dmuPosition: 'mt',
      isPrimary: true,
    });

    const school = await db.schools.get(schoolId);
    const firstContact = school!.contacts.find(c => c.id === first.id);
    const secondContact = school!.contacts.find(c => c.id === second.id);
    expect(firstContact!.isPrimary).toBe(false);
    expect(secondContact!.isPrimary).toBe(true);
  });

  it('updateContact updates fields', async () => {
    const contact = await addContact(schoolId, {
      name: 'Jan',
      dmuPosition: 'coordinator',
    });
    await updateContact(schoolId, contact.id, { name: 'Jan Updated' });
    const school = await db.schools.get(schoolId);
    const updated = school!.contacts.find(c => c.id === contact.id);
    expect(updated!.name).toBe('Jan Updated');
  });

  it('canDeleteContact returns false when conversations reference the contact', async () => {
    const contact = await addContact(schoolId, {
      name: 'Jan',
      dmuPosition: 'coordinator',
    });
    await addConversation(schoolId, {
      date: '2026-03-15',
      contactId: contact.id,
      content: 'Test gesprek',
    });
    const school = await db.schools.get(schoolId);
    const result = canDeleteContact(school!, contact.id);
    expect(result.canDelete).toBe(false);
    expect(result.linkedConversations).toBe(1);
  });

  it('canDeleteContact returns true when no conversations reference the contact', async () => {
    const contact = await addContact(schoolId, {
      name: 'Jan',
      dmuPosition: 'coordinator',
    });
    const school = await db.schools.get(schoolId);
    const result = canDeleteContact(school!, contact.id);
    expect(result.canDelete).toBe(true);
    expect(result.linkedConversations).toBe(0);
  });

  it('deleteContact removes from array', async () => {
    const contact = await addContact(schoolId, {
      name: 'Jan',
      dmuPosition: 'coordinator',
    });
    await deleteContact(schoolId, contact.id);
    const school = await db.schools.get(schoolId);
    expect(school!.contacts).toHaveLength(0);
  });
});

describe('CRM Conversation operations', () => {
  let schoolId: number;

  beforeEach(async () => {
    await db.schools.clear();
    const school = await createSchool('Conv Test School');
    schoolId = school.id!;
  });

  it('addConversation creates conversation and updates contact lastContactDate', async () => {
    const contact = await addContact(schoolId, {
      name: 'Jan',
      dmuPosition: 'coordinator',
    });
    const conversation = await addConversation(schoolId, {
      date: '2026-03-15',
      contactId: contact.id,
      content: 'Gesprek over prijzen',
    });
    expect(conversation.id).toBeDefined();
    expect(conversation.content).toBe('Gesprek over prijzen');

    const school = await db.schools.get(schoolId);
    const updatedContact = school!.contacts.find(c => c.id === contact.id);
    expect(updatedContact!.lastContactDate).toBe('2026-03-15');
  });

  it('updateConversation updates fields', async () => {
    const contact = await addContact(schoolId, {
      name: 'Jan',
      dmuPosition: 'coordinator',
    });
    const conv = await addConversation(schoolId, {
      date: '2026-03-15',
      contactId: contact.id,
      content: 'Original',
    });
    await updateConversation(schoolId, conv.id, { content: 'Updated' });
    const school = await db.schools.get(schoolId);
    const updated = school!.conversations.find(c => c.id === conv.id);
    expect(updated!.content).toBe('Updated');
  });
});

describe('CRM Action operations', () => {
  let schoolId: number;

  beforeEach(async () => {
    await db.schools.clear();
    const school = await createSchool('Action Test School');
    schoolId = school.id!;
  });

  it('addAction creates action with UUID and default status', async () => {
    const action = await addAction(schoolId, { title: 'Offerte sturen' });
    expect(action.id).toBeDefined();
    expect(action.title).toBe('Offerte sturen');
    expect(action.status).toBe('todo');
  });

  it('updateAction updates fields', async () => {
    const action = await addAction(schoolId, { title: 'Test' });
    await updateAction(schoolId, action.id, { status: 'done' });
    const school = await db.schools.get(schoolId);
    const updated = school!.actions.find(a => a.id === action.id);
    expect(updated!.status).toBe('done');
  });

  it('deleteAction removes from array', async () => {
    const action = await addAction(schoolId, { title: 'Test' });
    await deleteAction(schoolId, action.id);
    const school = await db.schools.get(schoolId);
    expect(school!.actions).toHaveLength(0);
  });
});

describe('Pipeline status operations', () => {
  let schoolId: number;

  beforeEach(async () => {
    await db.schools.clear();
    const school = await createSchool('Pipeline Test School');
    schoolId = school.id!;
  });

  it('setPipelineStatus adds system event', async () => {
    await setPipelineStatus(schoolId, 'contact-gelegd');
    const school = await db.schools.get(schoolId);
    expect(school!.pipelineStatus).toBe('contact-gelegd');
    const events = school!.systemEvents.filter(
      e => e.eventType === 'pipeline_changed',
    );
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain('prospect');
    expect(events[0].description).toContain('contact-gelegd');
  });

  it('setPipelineStatus to verloren stores lostDealInfo', async () => {
    await setPipelineStatus(schoolId, 'verloren', 'Te duur', {
      competitor: 'dia',
      reason: 'Te duur',
    });
    const school = await db.schools.get(schoolId);
    expect(school!.pipelineStatus).toBe('verloren');
    expect(school!.lostDealInfo).toBeDefined();
    expect(school!.lostDealInfo!.competitor).toBe('dia');
    expect(school!.lostDealInfo!.reason).toBe('Te duur');
  });

  it('addSystemEvent adds event with generated id and timestamp', async () => {
    await addSystemEvent(schoolId, {
      eventType: 'prices_updated',
      description: 'Prijzen bijgewerkt',
    });
    const school = await db.schools.get(schoolId);
    const event = school!.systemEvents.find(
      e => e.eventType === 'prices_updated',
    );
    expect(event).toBeDefined();
    expect(event!.id).toBeDefined();
    expect(event!.timestamp).toBeDefined();
  });
});

describe('validatePipelineTransition', () => {
  it('forward is allowed without reason', () => {
    const result = validatePipelineTransition('prospect', 'contact-gelegd');
    expect(result.allowed).toBe(true);
    expect(result.requiresReason).toBe(false);
  });

  it('backward requires reason', () => {
    const result = validatePipelineTransition('offerte', 'prospect');
    expect(result.allowed).toBe(true);
    expect(result.requiresReason).toBe(true);
  });

  it('to verloren requires lost deal info', () => {
    const result = validatePipelineTransition('offerte', 'verloren');
    expect(result.requiresLostDeal).toBe(true);
  });
});
