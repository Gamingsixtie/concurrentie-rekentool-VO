import { describe, it, expect } from 'vitest';
import { canDeleteContact } from '@/db/operations';
import type { SchoolRecord } from '@/db/types';
import { contactSchema } from '@/features/school-profile/schemas/contact.schema';

// Helper to create a minimal SchoolRecord for testing canDeleteContact
function makeSchool(overrides: Partial<SchoolRecord> = {}): SchoolRecord {
  return {
    id: 1,
    slug: 'test-school',
    name: 'Test School',
    createdAt: new Date(),
    updatedAt: new Date(),
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
    contacts: [],
    conversations: [],
    actions: [],
    systemEvents: [],
    pipelineStatus: 'prospect',
    region: '',
    tags: [],
    viewPreference: 'compact',
    ...overrides,
  };
}

describe('ContactForm schema validation', () => {
  it('validates required fields: name and dmuPosition', () => {
    const result = contactSchema.safeParse({ name: '', dmuPosition: 'coordinator' });
    expect(result.success).toBe(false);

    const valid = contactSchema.safeParse({ name: 'Jan', dmuPosition: 'coordinator' });
    expect(valid.success).toBe(true);
  });

  it('provides defaults for optional fields', () => {
    const result = contactSchema.parse({ name: 'Jan', dmuPosition: 'mt' });
    expect(result.jobTitle).toBe('');
    expect(result.email).toBe('');
    expect(result.phone).toBe('');
    expect(result.preferredChannel).toBe('email');
    expect(result.authority).toBe('adviserend');
    expect(result.notes).toBe('');
    expect(result.isPrimary).toBe(false);
  });

  it('validates email format when provided', () => {
    const invalid = contactSchema.safeParse({
      name: 'Jan',
      dmuPosition: 'coordinator',
      email: 'not-an-email',
    });
    expect(invalid.success).toBe(false);

    const valid = contactSchema.safeParse({
      name: 'Jan',
      dmuPosition: 'coordinator',
      email: 'jan@school.nl',
    });
    expect(valid.success).toBe(true);
  });

  it('allows empty email string', () => {
    const result = contactSchema.safeParse({
      name: 'Jan',
      dmuPosition: 'coordinator',
      email: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('canDeleteContact', () => {
  it('allows deletion when no conversations are linked', () => {
    const school = makeSchool({
      contacts: [
        {
          id: 'c1',
          name: 'Jan',
          dmuPosition: 'coordinator',
          jobTitle: '',
          email: '',
          phone: '',
          preferredChannel: 'email',
          authority: 'adviserend',
          lastContactDate: null,
          notes: '',
          isPrimary: false,
          createdAt: new Date().toISOString(),
        },
      ],
      conversations: [],
    });

    const result = canDeleteContact(school, 'c1');
    expect(result.canDelete).toBe(true);
    expect(result.linkedConversations).toBe(0);
  });

  it('blocks deletion when conversations are linked', () => {
    const school = makeSchool({
      contacts: [
        {
          id: 'c1',
          name: 'Jan',
          dmuPosition: 'coordinator',
          jobTitle: '',
          email: '',
          phone: '',
          preferredChannel: 'email',
          authority: 'adviserend',
          lastContactDate: null,
          notes: '',
          isPrimary: false,
          createdAt: new Date().toISOString(),
        },
      ],
      conversations: [
        {
          id: 'conv1',
          date: '2026-03-20',
          contactId: 'c1',
          content: 'Test conversation',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'conv2',
          date: '2026-03-21',
          contactId: 'c1',
          content: 'Another conversation',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    const result = canDeleteContact(school, 'c1');
    expect(result.canDelete).toBe(false);
    expect(result.linkedConversations).toBe(2);
  });

  it('only counts conversations linked to the specific contact', () => {
    const school = makeSchool({
      contacts: [
        {
          id: 'c1',
          name: 'Jan',
          dmuPosition: 'coordinator',
          jobTitle: '',
          email: '',
          phone: '',
          preferredChannel: 'email',
          authority: 'adviserend',
          lastContactDate: null,
          notes: '',
          isPrimary: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'c2',
          name: 'Petra',
          dmuPosition: 'mt',
          jobTitle: '',
          email: '',
          phone: '',
          preferredChannel: 'email',
          authority: 'beslissend',
          lastContactDate: null,
          notes: '',
          isPrimary: false,
          createdAt: new Date().toISOString(),
        },
      ],
      conversations: [
        {
          id: 'conv1',
          date: '2026-03-20',
          contactId: 'c2',
          content: 'Conversation with Petra',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    const resultC1 = canDeleteContact(school, 'c1');
    expect(resultC1.canDelete).toBe(true);
    expect(resultC1.linkedConversations).toBe(0);

    const resultC2 = canDeleteContact(school, 'c2');
    expect(resultC2.canDelete).toBe(false);
    expect(resultC2.linkedConversations).toBe(1);
  });
});
