import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModuleDetailPanel } from '../ModuleDetailPanel';
import type { ComparisonResult } from '../../../engine/price-comparison';
import type { PriceRecord } from '../../../models/pricing';

const makePriceRecord = (
  moduleId: string,
  provider: 'cito' | 'dia' | 'jij',
  amount: number,
): PriceRecord => ({
  moduleId,
  provider,
  amountPerStudent: amount,
  source: 'publication',
  sourceLabel: 'Publicatieprijs 2025',
  verifiedAt: new Date('2026-01-15'),
  isPublicationPrice: true,
});

const mockSetDraftOverride = vi.fn();
const mockResetOverride = vi.fn();
const mockRecalculate = vi.fn();

const mockResult: ComparisonResult = {
  modules: [
    {
      moduleId: 'rekenwiskunde',
      moduleName: 'Reken-Wiskunde',
      moduleCategory: 'leerlingvolgsysteem',
      providers: {
        cito: {
          pricePerStudent: 4.5,
          totalCost: 2025,
          studentCount: 450,
          priceRecord: makePriceRecord('rekenwiskunde', 'cito', 4.5),
        },
        dia: {
          pricePerStudent: 5.2,
          totalCost: 2340,
          studentCount: 450,
          priceRecord: makePriceRecord('rekenwiskunde', 'dia', 5.2),
        },
        jij: {
          pricePerStudent: 4.8,
          totalCost: 2160,
          studentCount: 450,
          priceRecord: makePriceRecord('rekenwiskunde', 'jij', 4.8),
        },
      },
    },
    {
      moduleId: 'cognitieve-capaciteiten',
      moduleName: 'Cognitieve capaciteitentoets',
      moduleCategory: 'overige-instrumenten',
      providers: {
        cito: {
          pricePerStudent: 6.0,
          totalCost: 2700,
          studentCount: 450,
          priceRecord: makePriceRecord('cognitieve-capaciteiten', 'cito', 6.0),
        },
        dia: null,
        jij: null,
      },
    },
  ],
  totals: { cito: 4725, dia: 2340, jij: 2160 },
  differences: { citoVsDia: 2385, citoVsJij: 2565 },
};

let mockHasPendingChanges = false;

vi.mock('../store', () => ({
  usePriceComparisonStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      result: mockResult,
      draftOverrides: [],
      appliedOverrides: [],
      hasPendingChanges: mockHasPendingChanges,
      setDraftOverride: mockSetDraftOverride,
      resetOverride: mockResetOverride,
      recalculate: mockRecalculate,
    }),
}));

describe('ModuleDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPendingChanges = false;
  });

  it('shows calculation formula per provider', () => {
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    expect(screen.getByText('Berekeningsformule')).toBeInTheDocument();
    // Cito formula
    expect(screen.getByText(/Cito: 450 leerlingen/)).toBeInTheDocument();
    expect(screen.getByText(/DIA: 450 leerlingen/)).toBeInTheDocument();
    expect(screen.getByText(/JIJ: 450 leerlingen/)).toBeInTheDocument();
  });

  it('shows "Niet beschikbaar" for providers without the module', () => {
    render(<ModuleDetailPanel moduleId="cognitieve-capaciteiten" />);
    const nietBeschikbaar = screen.getAllByText(/Niet beschikbaar/);
    expect(nietBeschikbaar.length).toBeGreaterThanOrEqual(2);
  });

  it('shows Cito differentiators before competitor differentiators', () => {
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    expect(screen.getByText('Onderscheidend vermogen')).toBeInTheDocument();

    const citoHeader = screen.getByText('Cito biedt extra:');
    const diaHeader = screen.getByText('DIA biedt extra:');

    // Cito should appear before DIA in the DOM
    const allText = document.body.textContent ?? '';
    const citoIndex = allText.indexOf('Cito biedt extra:');
    const diaIndex = allText.indexOf('DIA biedt extra:');
    expect(citoIndex).toBeLessThan(diaIndex);
    expect(citoHeader).toBeInTheDocument();
    expect(diaHeader).toBeInTheDocument();
  });

  it('shows warning when competitor does not offer module and has no differentiators', () => {
    render(<ModuleDetailPanel moduleId="cognitieve-capaciteiten" />);
    // DIA now offers NSCCT (cognitieve capaciteiten) so only JIJ shows warning
    expect(
      screen.getByText(/Deze module wordt niet aangeboden door JIJ/),
    ).toBeInTheDocument();
  });

  it('shows editable price inputs', () => {
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    expect(screen.getByText('Prijs aanpassen')).toBeInTheDocument();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(3); // cito, dia, jij
  });

  it('typing new price calls setDraftOverride', () => {
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    const citoInput = screen.getByLabelText('Prijs per leerling Cito');
    fireEvent.change(citoInput, { target: { value: '5,50' } });
    expect(mockSetDraftOverride).toHaveBeenCalledWith({
      moduleId: 'rekenwiskunde',
      provider: 'cito',
      amount: 5.5,
    });
  });

  it('handles decimal comma in input (replace comma with period)', () => {
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    const citoInput = screen.getByLabelText('Prijs per leerling Cito');
    fireEvent.change(citoInput, { target: { value: '3,75' } });
    expect(mockSetDraftOverride).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 3.75 }),
    );
  });

  it('Herbereken button not visible when no pending changes', () => {
    mockHasPendingChanges = false;
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    expect(
      screen.queryByText('Herbereken vergelijking'),
    ).not.toBeInTheDocument();
  });

  it('Herbereken button visible when hasPendingChanges and calls recalculate', () => {
    mockHasPendingChanges = true;
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    const btn = screen.getByText('Herbereken vergelijking');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockRecalculate).toHaveBeenCalled();
  });
});
