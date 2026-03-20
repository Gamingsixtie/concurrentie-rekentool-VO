import { useState, useEffect, useCallback } from 'react';
import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { ComparisonChart } from './ComparisonChart';
import { ComparisonTable } from './ComparisonTable';
import { BusinessCaseCTA } from './BusinessCaseCTA';
import { DisclaimerFooter } from '../../components/ui/DisclaimerFooter';

interface PriceComparisonPageProps {
  onBack?: () => void;
}

export function PriceComparisonPage({ onBack }: PriceComparisonPageProps) {
  const result = usePriceComparisonStore((s) => s.result);
  const initialize = usePriceComparisonStore((s) => s.initialize);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);

  const [chartHighlight] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleBarClick = useCallback((moduleId: string) => {
    // Scroll to the corresponding table row
    const row = document.getElementById(`module-row-${moduleId}`);
    if (row) {
      const offset = 80;
      const top = row.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    // The table handles expansion via its own click; simulate click on the row
    row?.click();
  }, []);

  // Empty state
  if (selectedModules.length === 0 || result === null) {
    return (
      <div className="max-w-[960px] mx-auto px-8 py-16">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-cito-primary hover:underline mb-8 inline-flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Terug naar schoolprofiel
          </button>
        )}
        <h2 className="text-xl font-semibold mb-2">
          Geen modules geselecteerd
        </h2>
        <p className="text-base text-neutral-500 mb-6">
          Ga terug naar uw schoolprofiel en selecteer minimaal een module om de
          prijsvergelijking te bekijken.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="bg-cito-primary text-white text-sm font-semibold py-2 px-4 rounded-lg hover:opacity-90"
          >
            Terug naar schoolprofiel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-8 py-16">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-cito-primary hover:underline mb-8 inline-flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Terug naar schoolprofiel
        </button>
      )}

      {/* Page title */}
      <h1 className="text-[28px] font-semibold leading-[1.2] text-cito-primary">
        Prijsvergelijking
      </h1>
      <p className="mt-2 text-base text-neutral-500">
        Vergelijk de kosten van Cito, DIA en JIJ per module op basis van
        publicatieprijzen.
      </p>

      {/* Chart */}
      <div className="mt-8">
        <ComparisonChart result={result} onBarClick={handleBarClick} />
      </div>

      {/* Table */}
      <div className="mt-12">
        <ComparisonTable result={result} onBarHighlight={chartHighlight} />
      </div>

      {/* Business Case CTA */}
      <div className="mt-8">
        <BusinessCaseCTA />
      </div>

      {/* Disclaimer */}
      <div className="mt-6">
        <DisclaimerFooter showDisclaimer={true} />
      </div>
    </div>
  );
}
