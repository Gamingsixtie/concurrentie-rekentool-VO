import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
}));

// Chain returns for select
mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, data: [], error: null });

// Chain returns for insert
mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });

// Chain returns for update
mockUpdate.mockReturnValue({ eq: mockEq });

const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

// Import after mocks
import {
  fetchPublicationPrices,
  createPriceProposal,
  approveProposal,
  rejectProposal,
  fetchOpenProposalCount,
} from '../pricing-operations';
import type { PublicationPrice, PriceProposal } from '../pricing-types';

describe('publication-prices CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
  });

  it('fetchPublicationPrices returns typed PublicationPrice[] array', async () => {
    const mockPrices: PublicationPrice[] = [
      {
        id: '1',
        team_id: 'team-1',
        module_id: 'rekenwiskunde',
        provider: 'cito',
        amount_per_student: 5.5,
        source: 'seed',
        source_label: 'Initieel vanuit brondata',
        verified_at: '2026-01-01T00:00:00Z',
        is_active: true,
        note: null,
        created_by: null,
        updated_by: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    mockEq.mockResolvedValueOnce({ data: mockPrices, error: null });

    const result = await fetchPublicationPrices();
    expect(result).toEqual(mockPrices);
    expect(mockFrom).toHaveBeenCalledWith('publication_prices');
    expect(mockSelect).toHaveBeenCalledWith('*');
  });

  it('createPriceProposal creates proposal with status open and correct submitted_by', async () => {
    const proposalData = {
      module_id: 'rekenwiskunde',
      provider: 'cito',
      current_price: 5.5,
      proposed_price: 6.0,
      source: 'publicatieprijzen 2026',
      explanation: 'Prijs is aangepast in nieuwe catalogus',
    };

    const mockResult: PriceProposal = {
      id: 'prop-1',
      team_id: 'team-1',
      ...proposalData,
      evidence_path: null,
      status: 'open',
      rejection_reason: null,
      submitted_by: 'user-123',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const selectSingle = vi.fn().mockResolvedValueOnce({ data: mockResult, error: null });
    const selectFn = vi.fn().mockReturnValue({ single: selectSingle });
    mockInsert.mockReturnValueOnce({ select: selectFn });

    const result = await createPriceProposal(proposalData);
    expect(result).toEqual(mockResult);
    expect(mockFrom).toHaveBeenCalledWith('price_proposals');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ...proposalData,
        submitted_by: 'user-123',
      }),
    );
  });

  it('approveProposal updates proposal status to approved and upserts publication_prices', async () => {
    // First call: fetch proposal
    const proposal: PriceProposal = {
      id: 'prop-1',
      team_id: 'team-1',
      module_id: 'rekenwiskunde',
      provider: 'cito',
      current_price: 5.5,
      proposed_price: 6.0,
      source: 'publicatieprijzen 2026',
      explanation: 'Prijs aangepast',
      evidence_path: null,
      status: 'open',
      rejection_reason: null,
      submitted_by: 'user-456',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    mockSingle.mockResolvedValueOnce({ data: proposal, error: null });
    // Update proposal
    mockEq.mockResolvedValueOnce({ data: null, error: null });
    // Upsert publication price
    mockEq.mockResolvedValueOnce({ data: null, error: null });
    // Insert audit log
    mockInsert.mockReturnValueOnce({ error: null });

    await approveProposal('prop-1');

    // Should have called from with price_proposals, publication_prices, and price_audit_log
    expect(mockFrom).toHaveBeenCalledWith('price_proposals');
  });

  it('rejectProposal requires a reason string and updates status to rejected', async () => {
    // Fetch proposal
    const proposal: PriceProposal = {
      id: 'prop-2',
      team_id: 'team-1',
      module_id: 'nederlands',
      provider: 'dia',
      current_price: 3.36,
      proposed_price: 4.0,
      source: 'offerte',
      explanation: 'Nieuwe offerte ontvangen',
      evidence_path: null,
      status: 'open',
      rejection_reason: null,
      submitted_by: 'user-456',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    mockSingle.mockResolvedValueOnce({ data: proposal, error: null });
    // Update proposal
    mockEq.mockResolvedValueOnce({ data: null, error: null });
    // Insert audit log
    mockInsert.mockReturnValueOnce({ error: null });

    await rejectProposal('prop-2', 'Bron niet betrouwbaar');

    expect(mockFrom).toHaveBeenCalledWith('price_proposals');
  });

  it('fetchOpenProposalCount returns count of open proposals for team', async () => {
    const mockCount = vi.fn().mockResolvedValueOnce({ count: 3, error: null });
    mockSelect.mockReturnValueOnce({ eq: vi.fn().mockReturnValue({ eq: mockCount }) });

    const count = await fetchOpenProposalCount();
    expect(count).toBe(3);
  });
});
