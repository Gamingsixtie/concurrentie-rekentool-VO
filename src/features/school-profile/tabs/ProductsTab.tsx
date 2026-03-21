import { Link, useParams } from '@tanstack/react-router';
import { useSchoolProfileStore } from '../store';
import { usePriceComparisonStore } from '@/features/price-comparison/store';
import { MODULE_CATALOG } from '@/models/modules';
import { CURRENT_PROVIDER_LABELS } from '@/models/school';
import { DEFAULT_PRICES } from '@/data/default-prices';
import { formatCurrency } from '@/lib/format';

export default function ProductsTab() {
  const { slug } = useParams({ from: '/scholen/$slug' });
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const appliedOverrides = usePriceComparisonStore((s) => s.appliedOverrides);

  if (selectedModules.length === 0) {
    return (
      <div className="p-8 max-sm:p-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
          <p className="text-[16px] text-neutral-500">
            Geen modules geselecteerd. Selecteer modules via de wizard.
          </p>
          <Link
            to="/scholen/$slug/wizard/$step"
            params={{ slug, step: '3' }}
            className="inline-block mt-4 text-[14px] text-cito-primary hover:underline"
          >
            Naar module-selectie
          </Link>
        </div>
      </div>
    );
  }

  // Build module info map
  const moduleMap = new Map(MODULE_CATALOG.map((m) => [m.id, m]));

  // Build override map: moduleId+provider -> override amount
  const overrideMap = new Map(
    appliedOverrides.map((o) => [`${o.moduleId}:${o.provider}`, o.amount]),
  );

  // Find publication price for a module and provider
  const getPublicationPrice = (moduleId: string, provider: string) => {
    return DEFAULT_PRICES.find(
      (p) => p.moduleId === moduleId && p.provider === provider,
    )?.amountPerStudent ?? null;
  };

  return (
    <div className="p-8 max-sm:p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-semibold text-neutral-900">
          Productgebruik{' '}
          <span className="text-[14px] font-normal text-neutral-500">
            ({selectedModules.length})
          </span>
        </h2>
        <Link
          to="/scholen/$slug/wizard/$step"
          params={{ slug, step: '3' }}
          className="text-[14px] text-cito-primary hover:underline"
        >
          Modules aanpassen
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {selectedModules.map((moduleId) => {
          const moduleDef = moduleMap.get(moduleId);
          const moduleName = moduleDef?.name ?? moduleId;
          const setup = moduleSetups.find((s) => s.moduleId === moduleId);
          const provider = setup?.currentProvider ?? 'geen';
          const providerLabel = CURRENT_PROVIDER_LABELS[provider];

          // Check for school-specific override on cito prices
          const citoOverride = overrideMap.get(`${moduleId}:cito`);
          const citoPublicationPrice = getPublicationPrice(moduleId, 'cito');

          // Determine price display
          const hasSchoolSpecificPrice = setup?.pricePerStudent !== null && setup?.pricePerStudent !== undefined;
          const displayPrice = hasSchoolSpecificPrice
            ? setup!.pricePerStudent!
            : null;

          // Check if there's an applied override different from publication
          const hasOverride = citoOverride !== undefined && citoOverride !== citoPublicationPrice;

          return (
            <div
              key={moduleId}
              className="bg-white border border-neutral-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[16px] font-semibold text-neutral-900">
                    {moduleName}
                  </h3>
                  <p className="text-[14px] text-neutral-500 mt-1">
                    {providerLabel}
                    {setup?.customProviderName && ` (${setup.customProviderName})`}
                  </p>
                </div>

                <div className="text-right">
                  {displayPrice !== null ? (
                    <div>
                      <p className="text-[16px] font-semibold text-neutral-900">
                        {formatCurrency(displayPrice)}{' '}
                        <span className="text-[14px] font-normal text-neutral-500">
                          per leerling
                        </span>
                      </p>
                      <p className="text-[12px] text-cito-accent font-semibold mt-0.5">
                        Schoolspecifieke prijs
                      </p>
                    </div>
                  ) : hasOverride ? (
                    <div>
                      <p className="text-[16px] font-semibold text-neutral-900">
                        {formatCurrency(citoOverride!)}{' '}
                        <span className="text-[14px] font-normal text-neutral-500">
                          per leerling
                        </span>
                      </p>
                      <p className="text-[12px] text-cito-accent font-semibold mt-0.5">
                        Schoolspecifieke prijs
                      </p>
                    </div>
                  ) : citoPublicationPrice !== null ? (
                    <div>
                      <p className="text-[16px] font-semibold text-neutral-900">
                        {formatCurrency(citoPublicationPrice)}{' '}
                        <span className="text-[14px] font-normal text-neutral-500">
                          per leerling
                        </span>
                      </p>
                      <p className="text-[12px] text-neutral-400 mt-0.5">
                        Publicatieprijs
                      </p>
                    </div>
                  ) : (
                    <p className="text-[14px] text-neutral-400">
                      Publicatieprijs
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
