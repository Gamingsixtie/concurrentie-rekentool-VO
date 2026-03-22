import { useState, useEffect, useCallback } from 'react';
import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { PROVIDER_LABELS, getTotalStudents } from '../../engine/price-comparison';
import type { ComparisonResult } from '../../engine/price-comparison';
import { MODULE_DIFFERENTIATORS } from '../../data/differentiators';
import { formatCurrency } from '../../lib/format';
import { ComparisonChart } from './ComparisonChart';
import { ComparisonTable } from './ComparisonTable';
import { BusinessCaseCTA } from './BusinessCaseCTA';
import { DisclaimerFooter } from '../../components/ui/DisclaimerFooter';
import { ModeToggle } from './ModeToggle';
import { PeriodToggle } from './PeriodToggle';
import { SensitivitySection } from './SensitivitySection';

interface PriceComparisonPageProps {
  onBack?: () => void;
}

// ─── Samenvatting boven de tabel ────────────────────────────────────────────

function ComparisonSummary({ result }: { result: ComparisonResult }) {
  const { citoVsDia, citoVsJij } = result.differences;

  // Collect unique Cito differentiators across all selected modules
  const citoAdvantages = result.modules
    .flatMap((mod) => MODULE_DIFFERENTIATORS.find((d) => d.moduleId === mod.moduleId)?.cito ?? [])
    .filter((item, i, arr) => arr.indexOf(item) === i);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-10">
      <h2 className="text-[15px] font-semibold text-cito-primary mb-5">
        Samenvatting vergelijking
      </h2>

      {/* Totalen per aanbieder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* Cito — baseline */}
        <div className="rounded-lg bg-cito-primary p-4 text-white">
          <div className="text-xs font-semibold opacity-70 mb-1 uppercase tracking-wide">
            {PROVIDER_LABELS.cito}
          </div>
          <div className="text-[22px] font-semibold leading-none">
            {formatCurrency(result.totals.cito)}
          </div>
          <div className="text-xs opacity-60 mt-1">per jaar · referentieprijs</div>
        </div>

        {/* DIA */}
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
          <div className="text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wide">
            {PROVIDER_LABELS.dia}
          </div>
          <div className="text-[22px] font-semibold leading-none text-neutral-900">
            {formatCurrency(result.totals.dia)}
          </div>
          {citoVsDia !== null && (
            <div className="text-xs mt-1 font-medium text-neutral-500">
              {citoVsDia === 0
                ? 'Gelijk aan Cito'
                : citoVsDia < 0
                  ? `${formatCurrency(Math.abs(citoVsDia))} goedkoper dan Cito`
                  : `${formatCurrency(citoVsDia)} duurder dan Cito`}
            </div>
          )}
          {citoVsDia === null && (
            <div className="text-xs mt-1 text-neutral-400">Geen overeenkomende modules</div>
          )}
        </div>

        {/* JIJ */}
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
          <div className="text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wide">
            {PROVIDER_LABELS.jij}
          </div>
          <div className="text-[22px] font-semibold leading-none text-neutral-900">
            {formatCurrency(result.totals.jij)}
          </div>
          {citoVsJij !== null && (
            <div className="text-xs mt-1 font-medium text-neutral-500">
              {citoVsJij === 0
                ? 'Gelijk aan Cito'
                : citoVsJij < 0
                  ? `${formatCurrency(Math.abs(citoVsJij))} goedkoper dan Cito`
                  : `${formatCurrency(citoVsJij)} duurder dan Cito`}
            </div>
          )}
          {citoVsJij === null && (
            <div className="text-xs mt-1 text-neutral-400">Geen overeenkomende modules</div>
          )}
        </div>
      </div>

      {/* Cito voordelen */}
      {citoAdvantages.length > 0 && (
        <div className="border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-cito-primary mb-3">
            Unieke Cito voordelen voor deze moduleselectie
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {citoAdvantages.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-cito-primary flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Tijdswinst sectie ───────────────────────────────────────────────────────

function TimeSavingsSection() {
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-cito-primary/10 rounded-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-cito-primary"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-neutral-900">
            Tijdbesparing — meer dan alleen kosten
          </h3>
          <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
            Cito biedt aantoonbare tijdswinst voor docenten en administratie door geïntegreerde
            remediering, automatische rapportages en directe koppeling met methodeaanbieders.
            Vraag uw accountmanager om een gepersonaliseerde tijdwinst-analyse voor deze school.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white border border-neutral-200 rounded-full px-3 py-1 text-xs font-medium text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Automatische rapportages
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-neutral-200 rounded-full px-3 py-1 text-xs font-medium text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Remediering inbegrepen
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-neutral-200 rounded-full px-3 py-1 text-xs font-medium text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Directe methodeaanbiederintegratie
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hoofd component ─────────────────────────────────────────────────────────

export function PriceComparisonPage({ onBack }: PriceComparisonPageProps) {
  const result = usePriceComparisonStore((s) => s.result);
  const initialize = usePriceComparisonStore((s) => s.initialize);
  const isInternalMode = usePriceComparisonStore((s) => s.isInternalMode);
  const sensitivityResult = usePriceComparisonStore((s) => s.sensitivityResult);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);

  const [chartHighlight] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleBarClick = useCallback((moduleId: string) => {
    const row = document.getElementById(`module-row-${moduleId}`);
    if (row) {
      const top = row.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    row?.click();
  }, []);

  const totalStudents = getTotalStudents(studentCounts);

  const BackButton = onBack ? (
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
  ) : null;

  // Empty state
  if (selectedModules.length === 0 || result === null) {
    return (
      <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-16">
        {BackButton}
        <h2 className="text-xl font-semibold mb-2">Geen modules geselecteerd</h2>
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
    <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-12">
      {BackButton}

      {/* Paginatitel + toggles */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-[1.2] text-cito-primary">
            Prijsvergelijking
          </h1>
          <p className="mt-2 text-base text-neutral-500">
            Vergelijk de kosten van Cito, DIA en JIJ per module op basis van publicatieprijzen
            {totalStudents > 0 && ` · ${totalStudents} leerlingen`}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <ModeToggle />
          <PeriodToggle />
        </div>
      </div>

      {/* Grafiek */}
      <div className="mb-10">
        <ComparisonChart result={result} onBarClick={handleBarClick} />
      </div>

      {/* Samenvatting: totalen + Cito-voordelen */}
      <ComparisonSummary result={result} />

      {/* Tabel met detail-panels */}
      <div className="mb-8">
        <ComparisonTable result={result} onBarHighlight={chartHighlight} />
      </div>

      {/* Gevoeligheidsanalyse (per D-15, D-16: only in internal mode) */}
      {isInternalMode && sensitivityResult && (
        <div className="mb-8">
          <SensitivitySection result={sensitivityResult} />
        </div>
      )}

      {/* Business case CTA */}
      <div className="mb-8">
        <BusinessCaseCTA />
      </div>

      {/* Tijdswinst */}
      <div className="mb-6">
        <TimeSavingsSection />
      </div>

      {/* Disclaimer */}
      <DisclaimerFooter showDisclaimer={true} />
    </div>
  );
}
