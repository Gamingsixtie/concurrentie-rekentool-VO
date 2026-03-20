import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardShell from '../../../components/wizard/WizardShell.tsx';
import { useSchoolProfileStore } from '../store.ts';

describe('Wizard Navigation', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
  });

  it('progress bar shows 4 steps with correct labels', () => {
    render(<WizardShell />);

    expect(screen.getByText('Niveaus')).toBeInTheDocument();
    expect(screen.getByText('Leerlingen')).toBeInTheDocument();
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByText('Scenario')).toBeInTheDocument();
  });

  it('"Vorige stap" button is hidden on step 1', () => {
    render(<WizardShell />);

    expect(screen.queryByText('Vorige stap')).not.toBeInTheDocument();
  });

  it('"Volgende stap" button is present', () => {
    render(<WizardShell />);

    expect(screen.getByText('Volgende stap')).toBeInTheDocument();
  });

  it('clicking "Volgende stap" without selection does not navigate (step 1 validation)', async () => {
    const user = userEvent.setup();
    render(<WizardShell />);

    await user.click(screen.getByText('Volgende stap'));

    // Should still be on step 1
    expect(screen.getByText('Welke niveaus biedt uw school aan?')).toBeInTheDocument();
  });

  it('navigating forward then back preserves previously entered data', async () => {
    const user = userEvent.setup();
    render(<WizardShell />);

    // Step 1: select HAVO
    const havoCheckbox = screen.getByRole('checkbox', { name: /HAVO/i });
    await user.click(havoCheckbox);

    // Navigate forward
    await user.click(screen.getByText('Volgende stap'));

    // Should be on step 2
    expect(screen.getByText('Hoeveel leerlingen per leerjaar?')).toBeInTheDocument();

    // Navigate back
    await user.click(screen.getByText('Vorige stap'));

    // Should be back on step 1 with HAVO still checked
    expect(screen.getByText('Welke niveaus biedt uw school aan?')).toBeInTheDocument();
    // Data is preserved in the store
    const state = useSchoolProfileStore.getState();
    expect(state.levels).toContain('havo');
  });

  it('clicking a future step in the progress bar does NOT navigate', async () => {
    const user = userEvent.setup();
    render(<WizardShell />);

    // Try clicking step 3 (Modules) which is a future step
    const modulesButton = screen.getByLabelText(/Stap 3: Modules/);
    await user.click(modulesButton);

    // Should still be on step 1
    expect(screen.getByText('Welke niveaus biedt uw school aan?')).toBeInTheDocument();
  });

  it('clicking a completed step in the progress bar navigates back', async () => {
    const user = userEvent.setup();
    render(<WizardShell />);

    // Complete step 1: select HAVO and navigate forward
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByText('Volgende stap'));

    // Should be on step 2
    expect(screen.getByText('Hoeveel leerlingen per leerjaar?')).toBeInTheDocument();

    // Click completed step 1 in progress bar
    const step1Button = screen.getByLabelText(/Stap 1: Niveaus.*voltooid/);
    await user.click(step1Button);

    // Should navigate back to step 1
    expect(screen.getByText('Welke niveaus biedt uw school aan?')).toBeInTheDocument();
  });

  it('shows "Bekijk resultaten" on the last step instead of "Volgende stap"', () => {
    // Set store to step 4 (index 3)
    useSchoolProfileStore.setState({ currentStep: 3 });
    render(<WizardShell />);

    expect(screen.getByText('Bekijk resultaten')).toBeInTheDocument();
    expect(screen.queryByText('Volgende stap')).not.toBeInTheDocument();
  });
});
