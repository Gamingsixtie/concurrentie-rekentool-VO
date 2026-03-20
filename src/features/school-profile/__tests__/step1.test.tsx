import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep1 from '../components/WizardStep1.tsx';
import { useSchoolProfileStore } from '../store.ts';
import { createRef } from 'react';
import type { WizardStepRef } from '../components/WizardStep1.tsx';

describe('WizardStep1 - Schoolniveau selectie', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
  });

  it('renders all 5 school level checkboxes with correct Dutch labels', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    expect(screen.getByText('VMBO Basis')).toBeInTheDocument();
    expect(screen.getByText('VMBO Kader')).toBeInTheDocument();
    expect(screen.getByText('VMBO GT')).toBeInTheDocument();
    expect(screen.getByText('HAVO')).toBeInTheDocument();
    expect(screen.getByText('VWO')).toBeInTheDocument();
  });

  it('renders the step heading in Dutch', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    expect(screen.getByText('Welke niveaus biedt uw school aan?')).toBeInTheDocument();
  });

  it('selecting at least one checkbox allows form submission (no error shown)', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    const havoCheckbox = screen.getByRole('checkbox', { name: /HAVO/i });
    await user.click(havoCheckbox);

    const result = await ref.current!.submit();
    expect(result).toBe(true);

    expect(screen.queryByText('Selecteer minimaal een niveau om door te gaan')).not.toBeInTheDocument();
  });

  it('submitting without any selection shows error "Selecteer minimaal een niveau om door te gaan"', async () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    const result = await ref.current!.submit();
    expect(result).toBe(false);

    await waitFor(() => {
      expect(screen.getByText('Selecteer minimaal een niveau om door te gaan')).toBeInTheDocument();
    });
  });

  it('selected levels are persisted to zustand store on submit', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByRole('checkbox', { name: /VWO/i }));

    await ref.current!.submit();

    const state = useSchoolProfileStore.getState();
    expect(state.levels).toContain('havo');
    expect(state.levels).toContain('vwo');
    expect(state.levels).toHaveLength(2);
  });
});
