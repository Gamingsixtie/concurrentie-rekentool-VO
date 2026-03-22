import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

// Mock the school profile store
const mockSchoolProfileState = {
  levels: ['havo', 'vwo'] as string[],
  studentCounts: {
    havo: { 1: 100, 2: 100, 3: 100 },
    vwo: { 1: 50, 2: 50, 3: 50 },
  },
  selectedModules: ['rekenwiskunde', 'nederlands'],
  moduleSetups: [
    { moduleId: 'rekenwiskunde', currentProvider: 'geen', pricePerStudent: null },
    { moduleId: 'nederlands', currentProvider: 'geen', pricePerStudent: null },
  ],
  scenario: null,
  currentStep: 0,
};

vi.mock('../../school-profile/store', () => ({
  useSchoolProfileStore: {
    getState: () => mockSchoolProfileState,
  },
}));

// Import after mock setup
const { usePriceComparisonStore } = await import('../store');

describe('usePriceComparisonStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    act(() => {
      usePriceComparisonStore.setState({
        result: null,
        draftOverrides: [],
        appliedOverrides: [],
        hasPendingChanges: false,
      });
    });
  });

  it('has correct initial state: result=null, draftOverrides=[], hasPendingChanges=false', () => {
    const state = usePriceComparisonStore.getState();
    expect(state.result).toBeNull();
    expect(state.draftOverrides).toEqual([]);
    expect(state.appliedOverrides).toEqual([]);
    expect(state.hasPendingChanges).toBe(false);
  });

  it('initialize() reads school profile and computes initial ComparisonResult', () => {
    act(() => {
      usePriceComparisonStore.getState().initialize();
    });

    const state = usePriceComparisonStore.getState();
    expect(state.result).not.toBeNull();
    expect(state.result!.modules).toHaveLength(2); // rekenwiskunde, nederlands
    expect(state.result!.totals).toHaveProperty('cito');
    expect(state.result!.totals).toHaveProperty('dia');
    expect(state.result!.totals).toHaveProperty('jij');

    // 450 students total (havo: 300 + vwo: 150)
    // rekenwiskunde cito: 4.5 * 450 = 2025
    expect(state.result!.modules[0].providers.cito?.totalCost).toBe(2025);
  });

  it('setDraftOverride adds override and sets hasPendingChanges=true', () => {
    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 5.0,
      });
    });

    const state = usePriceComparisonStore.getState();
    expect(state.draftOverrides).toHaveLength(1);
    expect(state.draftOverrides[0]).toEqual({
      moduleId: 'rekenwiskunde',
      provider: 'cito',
      amount: 5.0,
    });
    expect(state.hasPendingChanges).toBe(true);
  });

  it('setDraftOverride upserts existing override for same moduleId+provider', () => {
    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 5.0,
      });
    });

    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 6.0,
      });
    });

    const state = usePriceComparisonStore.getState();
    expect(state.draftOverrides).toHaveLength(1);
    expect(state.draftOverrides[0].amount).toBe(6.0);
  });

  it('recalculate() merges draftOverrides into prices and recomputes result', () => {
    // First initialize
    act(() => {
      usePriceComparisonStore.getState().initialize();
    });

    // Set a draft override
    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 10.0,
      });
    });

    // Recalculate
    act(() => {
      usePriceComparisonStore.getState().recalculate();
    });

    const state = usePriceComparisonStore.getState();
    expect(state.hasPendingChanges).toBe(false);
    // draftOverrides should be empty (moved to appliedOverrides)
    expect(state.draftOverrides).toEqual([]);
    expect(state.appliedOverrides).toHaveLength(1);

    // 450 students * 10.0 = 4500 (was 2025 with default 4.5)
    expect(state.result!.modules[0].providers.cito?.totalCost).toBe(4500);
    // Override should change the priceRecord source
    expect(state.result!.modules[0].providers.cito?.priceRecord.source).toBe('manual');
  });

  it('resetOverride removes specific override from draftOverrides', () => {
    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 5.0,
      });
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'nederlands',
        provider: 'dia',
        amount: 6.0,
      });
    });

    act(() => {
      usePriceComparisonStore.getState().resetOverride('rekenwiskunde', 'cito');
    });

    const state = usePriceComparisonStore.getState();
    expect(state.draftOverrides).toHaveLength(1);
    expect(state.draftOverrides[0].moduleId).toBe('nederlands');
    expect(state.hasPendingChanges).toBe(true);
  });

  it('resetAllOverrides clears all overrides and sets hasPendingChanges=true', () => {
    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 5.0,
      });
    });

    act(() => {
      usePriceComparisonStore.getState().resetAllOverrides();
    });

    const state = usePriceComparisonStore.getState();
    expect(state.draftOverrides).toEqual([]);
    expect(state.hasPendingChanges).toBe(true);
  });
});
