import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contactSchema } from '@/features/school-profile/schemas/contact.schema';

// Mock supabase client for canDeleteContact tests
const mockSelect = vi.fn();
const mockEq1 = vi.fn();
const mockEq2 = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq1(...eqArgs);
            return {
              eq: (...eq2Args: unknown[]) => mockEq2(...eq2Args),
            };
          },
        };
      },
    }),
  },
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq2.mockReturnValue(Promise.resolve({ count: 0, error: null }));
  });

  it('allows deletion when no conversations are linked', async () => {
    // Mock returns count = 0
    mockEq2.mockReturnValueOnce(Promise.resolve({ count: 0, error: null }));

    const { canDeleteContact } = await import('@/db/operations');
    const result = await canDeleteContact('school-1', 'c1');
    expect(result.canDelete).toBe(true);
    expect(result.linkedConversations).toBe(0);
  });

  it('blocks deletion when conversations are linked', async () => {
    // Mock returns count = 2
    mockEq2.mockReturnValueOnce(Promise.resolve({ count: 2, error: null }));

    const { canDeleteContact } = await import('@/db/operations');
    const result = await canDeleteContact('school-1', 'c1');
    expect(result.canDelete).toBe(false);
    expect(result.linkedConversations).toBe(2);
  });

  it('only counts conversations linked to the specific contact', async () => {
    // First call: c1 has 0 linked conversations
    mockEq2.mockReturnValueOnce(Promise.resolve({ count: 0, error: null }));

    const { canDeleteContact } = await import('@/db/operations');
    const resultC1 = await canDeleteContact('school-1', 'c1');
    expect(resultC1.canDelete).toBe(true);
    expect(resultC1.linkedConversations).toBe(0);

    // Second call: c2 has 1 linked conversation
    mockEq2.mockReturnValueOnce(Promise.resolve({ count: 1, error: null }));
    const resultC2 = await canDeleteContact('school-1', 'c2');
    expect(resultC2.canDelete).toBe(false);
    expect(resultC2.linkedConversations).toBe(1);
  });
});
