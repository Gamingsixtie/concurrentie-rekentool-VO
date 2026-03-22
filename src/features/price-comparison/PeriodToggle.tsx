import { usePriceComparisonStore } from './store';

export function PeriodToggle() {
  const period = usePriceComparisonStore((s) => s.contractPeriod);
  const setPeriod = usePriceComparisonStore((s) => s.setContractPeriod);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setPeriod('annual')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            period === 'annual'
              ? 'bg-cito-primary text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
          aria-pressed={period === 'annual'}
        >
          Per jaar
        </button>
        <button
          type="button"
          onClick={() => setPeriod('three-year')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            period === 'three-year'
              ? 'bg-cito-primary text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
          aria-pressed={period === 'three-year'}
        >
          3-jarig contract
        </button>
      </div>
      {period === 'three-year' && (
        <div className="bg-amber-100 text-amber-800 text-xs rounded-md px-3 py-2 max-w-sm mt-1">
          Let op: de 3-jarige Cito-prijs is een indicatie (factor 2,85x). Exacte
          tarieven worden nog aangeleverd.
        </div>
      )}
    </div>
  );
}
