/**
 * Scenario detection banner for the AI comparison wizard (D-26).
 * Shows info banners for all-old-Cito or all-new-Cito scenarios.
 */

import type { WizardScenario } from './types';

interface ScenarioDetectorProps {
  scenario: WizardScenario;
  onProceed?: () => void;
}

export function ScenarioDetector({ scenario, onProceed }: ScenarioDetectorProps) {
  if (scenario === 'deels-concurrent') {
    return null;
  }

  if (scenario === 'alles-oud-cito') {
    return (
      <div className="flex items-start gap-3 p-4 mb-6 rounded-lg border bg-blue-50 border-blue-200" role="alert">
        <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-blue-800">
          Deze school gebruikt uitsluitend het huidige Cito-platform. Ga naar de migratie-pagina voor een overstap-businesscase.
        </p>
      </div>
    );
  }

  if (scenario === 'alles-nieuw-cito') {
    return (
      <div className="flex items-start gap-3 p-4 mb-6 rounded-lg border bg-emerald-50 border-emerald-200" role="alert">
        <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-emerald-800 mb-3">
            Deze school gebruikt al het nieuwe Cito-platform. Wilt u alsnog een marktvergelijking uitvoeren?
          </p>
          {onProceed && (
            <button
              type="button"
              onClick={onProceed}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-lg hover:bg-emerald-200 transition-colors min-h-[44px]"
            >
              Doorgaan
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
