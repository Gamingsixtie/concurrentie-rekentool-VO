import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { CITO_BUNDLES } from '../../data/cito-bundles';
import type { ContractPeriod } from '../../data/cito-bundles';
import { formatCurrency } from '../../lib/format';

export function CitoBundleSelector({ compact = false }: { compact?: boolean }) {
  const bundleType = usePriceComparisonStore((s) => s.citoBundleType);
  const setBundleType = usePriceComparisonStore((s) => s.setCitoBundleType);
  const contractPeriod = usePriceComparisonStore((s) => s.contractPeriod);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);

  // Show all bundles, but mark unavailable ones as disabled
  const bundlesWithAvailability = CITO_BUNDLES.map((bundle) => {
    if (bundle.id === 'individual') return { bundle, available: true, missingModules: [] as string[] };
    const missing = bundle.includedModuleIds.filter((id) => !selectedModules.includes(id));
    return { bundle, available: missing.length === 0, missingModules: missing };
  });

  // Always show if there are bundles defined (Individual is always there + Basis/Plus)
  const hasBundles = bundlesWithAvailability.length > 1;
  if (!hasBundles) return null;

  if (compact) {
    return (
      <div className="flex mt-1 bg-white/10 rounded-md overflow-hidden">
        {bundlesWithAvailability.map(({ bundle, available }) => (
          <button
            key={bundle.id}
            type="button"
            onClick={() => available && setBundleType(bundle.id)}
            disabled={!available}
            className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
              !available
                ? 'text-white/30 cursor-not-allowed'
                : bundleType === bundle.id
                  ? 'bg-white text-cito-primary'
                  : 'text-white/70 hover:text-white'
            }`}
            title={available ? bundle.description : `Selecteer eerst alle modules: ${bundle.includedModuleIds.join(', ')}`}
          >
            {bundle.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        Cito prijsmodel
      </label>
      <div className="flex flex-wrap gap-2">
        {bundlesWithAvailability.map(({ bundle, available, missingModules }) => (
          <BundleOption
            key={bundle.id}
            name={bundle.name}
            description={bundle.description}
            price={bundle.pricePerStudent}
            contractPrice={bundle.contractPrices?.[contractPeriod] ?? null}
            contractPeriod={contractPeriod}
            isActive={bundleType === bundle.id}
            available={available}
            missingModules={missingModules}
            onClick={() => available && setBundleType(bundle.id)}
          />
        ))}
      </div>
    </div>
  );
}

function BundleOption({
  name,
  description,
  price,
  contractPrice,
  contractPeriod,
  isActive,
  available,
  missingModules,
  onClick,
}: {
  name: string;
  description: string;
  price: number | null;
  contractPrice: number | null;
  contractPeriod: ContractPeriod;
  isActive: boolean;
  available: boolean;
  missingModules: string[];
  onClick: () => void;
}) {
  const showContractPrice = contractPeriod !== 'annual' && contractPrice !== null && price !== null && contractPrice !== price;
  const periodLabel = contractPeriod === 'three-year' ? '3-jarig' : '3-jarig + DUO';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available}
      className={`flex flex-col items-start text-left rounded-lg border px-4 py-3 transition-colors min-w-[160px] ${
        !available
          ? 'border-neutral-100 bg-neutral-50 opacity-60 cursor-not-allowed'
          : isActive
            ? 'border-cito-primary bg-cito-primary/5 ring-1 ring-cito-primary'
            : 'border-neutral-200 bg-white hover:bg-neutral-50'
      }`}
      aria-pressed={isActive}
    >
      <span className={`text-sm font-semibold ${!available ? 'text-neutral-400' : isActive ? 'text-cito-primary' : 'text-neutral-900'}`}>
        {name}
      </span>
      <span className="text-xs text-neutral-500 mt-0.5">{description}</span>
      {price !== null && (
        <div className="mt-1">
          <span className={`text-xs font-medium ${showContractPrice ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>
            {formatCurrency(price)}/leerling/jr
          </span>
          {showContractPrice && (
            <span className="text-xs font-semibold text-green-700 ml-1.5">
              {formatCurrency(contractPrice!)}/lln/jr ({periodLabel})
            </span>
          )}
        </div>
      )}
      {!available && missingModules.length > 0 && (
        <span className="text-[10px] text-neutral-400 mt-1">
          Selecteer nog: {missingModules.join(', ')}
        </span>
      )}
    </button>
  );
}
