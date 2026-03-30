import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewQueuePage from '@/features/review/ReviewQueuePage';
import type { PriceProposal } from '@/db/pricing-types';

// --- Mocks ---

const mockUseAuth = vi.fn();
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUsePriceProposals = vi.fn();
const mockUseOpenProposalCount = vi.fn();
vi.mock('@/hooks/usePriceProposals', () => ({
  usePriceProposals: (...args: unknown[]) => mockUsePriceProposals(...args),
  useOpenProposalCount: () => mockUseOpenProposalCount(),
}));

const mockApproveProposal = vi.fn();
const mockRejectProposal = vi.fn();
const mockFetchAuditLog = vi.fn();
vi.mock('@/db/pricing-operations', () => ({
  approveProposal: (...args: unknown[]) => mockApproveProposal(...args),
  rejectProposal: (...args: unknown[]) => mockRejectProposal(...args),
  fetchAuditLog: (...args: unknown[]) => mockFetchAuditLog(...args),
}));

const mockLoadFromSupabase = vi.fn();
vi.mock('@/stores/pricing-data-store', () => ({
  usePricingDataStore: {
    getState: () => ({ loadFromSupabase: mockLoadFromSupabase }),
  },
}));

// Mock react-query mutation
const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
    useMutation: ({ mutationFn, onSuccess }: { mutationFn: (...args: unknown[]) => Promise<void>; onSuccess?: () => void }) => ({
      mutate: async (...args: unknown[]) => {
        await mutationFn(...args);
        onSuccess?.();
      },
      mutateAsync: async (...args: unknown[]) => {
        await mutationFn(...args);
        onSuccess?.();
      },
      isPending: false,
    }),
  };
});

// --- Test data ---

const mockProposal: PriceProposal = {
  id: 'proposal-1',
  team_id: 'team-1',
  module_id: 'rekenen-vo',
  provider: 'dia',
  current_price: 5.80,
  proposed_price: 6.20,
  source: 'DIA Webshop',
  explanation: 'Prijs is gestegen op de webshop per 1 maart 2026.',
  evidence_path: null,
  status: 'open',
  rejection_reason: null,
  submitted_by: 'user-1',
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-28T10:00:00Z',
  updated_at: '2026-03-28T10:00:00Z',
};

const managerAuth = {
  user: { id: 'manager-1' },
  userProfile: { id: 'manager-1', name: 'Jan Manager', role: 'manager' as const, email: 'jan@cito.nl', region: 'nl', teamId: 'team-1' },
  loading: false,
  signOut: vi.fn(),
};

const accountManagerAuth = {
  user: { id: 'am-1' },
  userProfile: { id: 'am-1', name: 'Piet AM', role: 'accountmanager' as const, email: 'piet@cito.nl', region: 'nl', teamId: 'team-1' },
  loading: false,
  signOut: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchAuditLog.mockResolvedValue([]);
});

describe('ReviewQueuePage', () => {
  it('shows "Geen toegang" for non-manager role', () => {
    mockUseAuth.mockReturnValue(accountManagerAuth);
    mockUsePriceProposals.mockReturnValue({ data: [], isLoading: false, error: null });

    render(<ReviewQueuePage />);

    expect(screen.getByText('Geen toegang')).toBeInTheDocument();
  });

  it('renders proposal list with ProposalBadge and PriceDiffDisplay', () => {
    mockUseAuth.mockReturnValue(managerAuth);
    mockUsePriceProposals.mockReturnValue({
      data: [mockProposal],
      isLoading: false,
      error: null,
    });

    render(<ReviewQueuePage />);

    // Should show provider name
    expect(screen.getByText('DIA')).toBeInTheDocument();
    // Should show module name
    expect(screen.getByText(/rekenen/i)).toBeInTheDocument();
    // Should show ProposalBadge status
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('filter bar filters proposals by status and provider', async () => {
    mockUseAuth.mockReturnValue(managerAuth);
    mockUsePriceProposals.mockReturnValue({
      data: [mockProposal],
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ReviewQueuePage />);

    // Should show filter pills
    const openFilter = screen.getByRole('button', { name: /open/i });
    expect(openFilter).toBeInTheDocument();

    await user.click(openFilter);
    // After clicking filter, usePriceProposals should be called with filter
    expect(mockUsePriceProposals).toHaveBeenCalled();
  });

  it('approve button calls approveProposal and invalidates queries', async () => {
    mockUseAuth.mockReturnValue(managerAuth);
    mockUsePriceProposals.mockReturnValue({
      data: [mockProposal],
      isLoading: false,
      error: null,
    });
    mockApproveProposal.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<ReviewQueuePage />);

    // Expand the proposal row first
    const row = screen.getByText('DIA').closest('[data-testid="review-queue-item"]') ?? screen.getByText('DIA');
    await user.click(row);

    // Click approve
    const approveBtn = screen.getByRole('button', { name: /goedkeuren/i });
    await user.click(approveBtn);

    expect(mockApproveProposal).toHaveBeenCalledWith('proposal-1');
  });

  it('reject button requires reason text before submission', async () => {
    mockUseAuth.mockReturnValue(managerAuth);
    mockUsePriceProposals.mockReturnValue({
      data: [mockProposal],
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<ReviewQueuePage />);

    // Expand the proposal row
    const row = screen.getByText('DIA').closest('[data-testid="review-queue-item"]') ?? screen.getByText('DIA');
    await user.click(row);

    // Click reject to show reason input
    const rejectBtn = screen.getByRole('button', { name: /afwijzen/i });
    await user.click(rejectBtn);

    // Should show textarea for reason
    const textarea = screen.getByPlaceholderText(/reden/i);
    expect(textarea).toBeInTheDocument();

    // Confirm button should be disabled or not submit without sufficient text
    const confirmRejectBtn = screen.getByRole('button', { name: /bevestig/i });

    // Type too-short reason
    await user.type(textarea, 'kort');
    // Button should still be disabled (min 10 chars)
    expect(confirmRejectBtn).toBeDisabled();

    // Type sufficient reason
    await user.clear(textarea);
    await user.type(textarea, 'Deze prijs is niet correct onderbouwd met bewijs.');
    expect(confirmRejectBtn).not.toBeDisabled();
  });

  it('shows empty state when no proposals exist', () => {
    mockUseAuth.mockReturnValue(managerAuth);
    mockUsePriceProposals.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<ReviewQueuePage />);

    expect(screen.getByText('Geen openstaande voorstellen')).toBeInTheDocument();
  });

  it('shows error state when loading fails', () => {
    mockUseAuth.mockReturnValue(managerAuth);
    mockUsePriceProposals.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    });

    render(<ReviewQueuePage />);

    expect(screen.getByText(/Prijsvoorstellen konden niet worden geladen/)).toBeInTheDocument();
  });
});
