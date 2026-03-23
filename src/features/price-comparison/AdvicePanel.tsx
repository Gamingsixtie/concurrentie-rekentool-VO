import { useState, useCallback } from 'react';
import { useSchoolProfileStore } from '../school-profile/store';
import { usePriceComparisonStore } from './store';
import { getTotalStudents } from '../../engine/price-comparison';
import { generateAdvice, type AdviceResult, type AdviceItem } from '../../lib/ai-advice';

// ─── Type icon mapping ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AdviceItem['type'], { label: string; color: string; bgColor: string }> = {
  prijs: { label: 'Prijs', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  meerwaarde: { label: 'Meerwaarde', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  bezwaar: { label: 'Bezwaar', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  kans: { label: 'Kans', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
};

// ─── Component ──────────────────────────────────────────────────────────────

export function AdvicePanel() {
  const result = usePriceComparisonStore((s) => s.result);
  const levels = useSchoolProfileStore((s) => s.levels);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);

  const [advice, setAdvice] = useState<AdviceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalStudents = getTotalStudents(studentCounts);

  const handleGenerate = useCallback(async () => {
    if (!result) return;

    setLoading(true);
    setError(null);
    setAdvice(null);

    try {
      const adviceResult = await generateAdvice(
        result,
        levels,
        studentCounts,
        selectedModules,
        moduleSetups,
      );
      setAdvice(adviceResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis bij het genereren van advies.');
    } finally {
      setLoading(false);
    }
  }, [result, levels, studentCounts, selectedModules, moduleSetups]);

  if (!result || selectedModules.length === 0 || totalStudents === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 bg-cito-primary/10 rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-cito-primary"
              aria-hidden="true"
            >
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <line x1="10" y1="22" x2="14" y2="22" />
            </svg>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-cito-primary">
              AI Gespreksadvies
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Strategisch advies op basis van deze vergelijking
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-cito-primary text-white text-sm font-semibold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Genereren...
            </>
          ) : advice ? (
            'Opnieuw genereren'
          ) : (
            'Genereer advies'
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-10 bg-neutral-100 rounded-lg" />
          <div className="h-20 bg-neutral-50 rounded-lg" />
          <div className="h-20 bg-neutral-50 rounded-lg" />
          <div className="h-20 bg-neutral-50 rounded-lg" />
        </div>
      )}

      {/* Advice results */}
      {advice && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-lg bg-cito-primary/5 border border-cito-primary/20 p-4">
            <p className="text-sm font-medium text-cito-primary leading-relaxed">
              {advice.samenvatting}
            </p>
          </div>

          {/* Advice items */}
          <div className="space-y-3">
            {advice.adviezen.map((item, i) => {
              const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.meerwaarde;
              return (
                <div
                  key={i}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide border ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {item.titel}
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed pl-0.5">
                    {item.tekst}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <p className="text-[11px] text-neutral-400 mt-2">
            Dit advies is automatisch gegenereerd op basis van de vergelijkingsdata.
            Controleer de informatie altijd voor gebruik in een gesprek.
          </p>
        </div>
      )}

      {/* Empty state — before first generation */}
      {!advice && !loading && !error && (
        <p className="text-sm text-neutral-400">
          Klik op &ldquo;Genereer advies&rdquo; voor contextueel gespreksadvies op basis van de prijsvergelijking en het schoolprofiel.
        </p>
      )}
    </div>
  );
}
