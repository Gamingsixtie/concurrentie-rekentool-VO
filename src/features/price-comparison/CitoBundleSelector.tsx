import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { CITO_BUNDLES } from '../../data/cito-bundles';
import { formatCurrency } from '../../lib/format';

export function CitoBundleSelector({ compact = false }: { compact?: boolean }) {
  const bundleType = usePriceComparisonStore((s) => s.citoBundleType);
  const setBundleType = usePriceComparisonStore((s) => s.setCitoBundleType);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);

  // Only show bundles that the school's selected modules can use
  const availableBundles = CITO_BUNDLES.filter((bundle) => {
    if (bundle.id === 'individual') return true;
    // Bundle requires ALL its modules to be selected
    return bundle.includedModuleIds.every((id) => selectedModules.includes(id));
  });

  // Don't render if only "individual" is available
  if (availableBundles.length <= 1) return null;

  if (compact) {
    return (
      <div className="flex mt-1 bg-white/10 rounded-md overflow-hidden">
        {availableBundles.map(bundle => (
          <button
            key={bundle.id}
            type="button"
            onClick={() => setBundleType(bundle.id)}
            className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
              bundleType === bundle.id
                ? 'bg-white text-cito-primary'
                : 'text-white/70 hover:text-white'
            }`}
            title={bundle.description}
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
        {availableBundles.map((bundle) => (
          <BundleOption
            key={bundle.id}
            name={bundle.name}
            description={bundle.description}
            price={bundle.pricePerStudent}
            isActive={bundleType === bundle.id}
            onClick={() => setBundleType(bundle.id)}
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
  isActive,
  onClick,
}: {
  name: string;
  description: string;
  price: number | null;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start text-left rounded-lg border px-4 py-3 transition-colors min-w-[160px] ${
        isActive
          ? 'border-cito-primary bg-cito-primary/5 ring-1 ring-cito-primary'
          : 'border-neutral-200 bg-white hover:bg-neutral-50'
      }`}
      aria-pressed={isActive}
    >
      <span className={`text-sm font-semibold ${isActive ? 'text-cito-primary' : 'text-neutral-900'}`}>
        {name}
      </span>
      <span className="text-xs text-neutral-500 mt-0.5">{description}</span>
      {price !== null && (
        <span className="text-xs font-medium text-neutral-700 mt-1">
          {formatCurrency(price)}/leerling
        </span>
      )}
    </button>
  );
}
