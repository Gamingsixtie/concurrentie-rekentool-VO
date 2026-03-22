import { Link, useParams } from '@tanstack/react-router';
import { useSchoolProfileStore } from '../store';
import { useSchoolPrices } from '@/hooks/useSchoolPrices';
import { MODULE_CATALOG } from '@/models/modules';
import { CURRENT_PROVIDER_LABELS } from '@/models/school';
import { DEFAULT_PRICES } from '@/data/default-prices';
import { formatCurrency } from '@/lib/format';
import { PriceManager } from '../components/PriceManager';

export default function ProductsTab() {
  const { slug } = useParams({ from: '/scholen/$slug' });
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);

  // Fetch school-specific prices from school_prices table
  const { data: schoolPrices = [] } = useSchoolPrices(activeSchoolId ?? '');

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

  // Find publication price for a module and provider
  const getPublicationPrice = (moduleId: string, provider: string) => {
    return DEFAULT_PRICES.find(
      (p) => p.moduleId === moduleId && p.provider === provider,
    )?.amountPerStudent ?? null;
  };

  // Find active school price for a module and provider
  const getActiveSchoolPrice = (moduleId: string, provider: string) => {
    return schoolPrices.find(
      (p) => p.moduleId === moduleId && p.provider === provider && p.isActive,
    ) ?? null;
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

      <h3 className="text-[20px] font-semibold text-neutral-900 mb-4">
        Prijsbeheer
      </h3>

      <div className="flex flex-col gap-4">
        {selectedModules.map((moduleId) => {
          const moduleDef = moduleMap.get(moduleId);
          const moduleName = moduleDef?.name ?? moduleId;
          const setup = moduleSetups.find((s) => s.moduleId === moduleId);
          const currentProvider = setup?.currentProvider ?? 'geen';
          const providerLabel = CURRENT_PROVIDER_LABELS[currentProvider];

          // Determine display price: active school price > publication price
          const activeSchoolPrice = getActiveSchoolPrice(moduleId, currentProvider);
          const citoPublicationPrice = getPublicationPrice(moduleId, currentProvider);

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
                  {activeSchoolPrice ? (
                    <div>
                      <p className="text-[16px] font-semibold text-neutral-900">
                        {formatCurrency(activeSchoolPrice.amount)}{' '}
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
                      Geen prijs bekend
                    </p>
                  )}
                </div>
              </div>

              {/* PriceManager collapsible section */}
              {activeSchoolId && (
                <PriceManager
                  schoolId={activeSchoolId}
                  moduleId={moduleId}
                  provider={currentProvider}
                  moduleName={moduleName}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
