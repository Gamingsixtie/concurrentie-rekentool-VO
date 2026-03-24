import { useState } from 'react';
import type { MigrationResult } from '@/engine/migration';
import type { SchoolLevel } from '@/models/school';
import { generateValueNarrative } from '@/lib/ai-value';
import type { ValueNarrativeResult, ValueArgument } from '@/lib/ai-value';

interface ValueAIPanelProps {
  migrationResult: MigrationResult;
  levels: SchoolLevel[];
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
  selectedModules: string[];
  priceDifference: number | null;
  hourlyRateKnown: boolean;
}

const CATEGORY_STYLES: Record<ValueArgument['categorie'], { bg: string; text: string; label: string }> = {
  financieel: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Financieel' },
  tijdwinst: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Tijdwinst' },
  kwaliteit: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Kwaliteit' },
  risico: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Risico' },
};

export function ValueAIPanel({
  migrationResult,
  levels,
  studentCounts,
  selectedModules,
  priceDifference,
  hourlyRateKnown,
}: ValueAIPanelProps) {
  const [result, setResult] = useState<ValueNarrativeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const narrative = await generateValueNarrative(
        migrationResult,
        levels,
        studentCounts,
        selectedModules,
        priceDifference,
        hourlyRateKnown,
      );
      setResult(narrative);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="text-lg font-semibold text-cito-primary">
          AI Waardepropositie
        </h3>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Genereren...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
              </svg>
              {result ? 'Opnieuw genereren' : 'Genereer waardepropositie'}
            </>
          )}
        </button>
      </div>

      {!result && !loading && !error && (
        <p className="text-sm text-neutral-400 italic">
          Laat AI een overtuigende waardepropositie genereren op basis van de berekende
          cijfers. Bruikbaar als gespreksopener of in een businesscase-document.
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-3/4" />
          <div className="h-4 bg-neutral-200 rounded w-full" />
          <div className="h-4 bg-neutral-200 rounded w-5/6" />
          <div className="h-4 bg-neutral-200 rounded w-2/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="h-20 bg-neutral-200 rounded" />
            <div className="h-20 bg-neutral-200 rounded" />
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {/* Samenvatting / openingszin */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 mb-1">
              Openingszin
            </p>
            <p className="text-sm font-medium text-indigo-900">{result.samenvatting}</p>
          </div>

          {/* Narratief */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
              Waardverhaal
            </p>
            <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
              {result.narratief}
            </div>
          </div>

          {/* Kernargumenten */}
          {result.kernargumenten.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                Kernargumenten
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.kernargumenten.map((arg, i) => {
                  const style = CATEGORY_STYLES[arg.categorie] ?? CATEGORY_STYLES.kwaliteit;
                  return (
                    <div key={i} className={`rounded-md border p-3 ${style.bg}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${style.text}`}>{style.label}</span>
                      </div>
                      <p className="text-sm font-medium text-neutral-800">{arg.titel}</p>
                      <p className="text-sm text-neutral-600 mt-1">{arg.tekst}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bezwaar-weerleggingen */}
          {result.bezwaarWeerleggingen.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                Veelgehoorde bezwaren
              </p>
              <div className="space-y-3">
                {result.bezwaarWeerleggingen.map((bw, i) => (
                  <div key={i} className="border border-neutral-200 rounded-md overflow-hidden">
                    <div className="bg-neutral-50 px-4 py-2">
                      <p className="text-sm font-medium text-neutral-700">
                        <span className="text-neutral-400 mr-1.5">Q:</span>
                        {bw.bezwaar}
                      </p>
                    </div>
                    <div className="px-4 py-2">
                      <p className="text-sm text-neutral-600">
                        <span className="text-green-600 font-medium mr-1.5">A:</span>
                        {bw.weerlegging}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-neutral-400 italic">
            Deze waardepropositie is automatisch gegenereerd op basis van de berekende cijfers.
            Controleer de inhoud voordat u deze deelt met de school.
          </p>
        </div>
      )}
    </div>
  );
}
