import { useState } from 'react';
import type { ComparisonResult, ProviderKey } from '../../engine/price-comparison';
import { PROVIDER_LABELS, getTotalStudents } from '../../engine/price-comparison';
import { MODULE_CATEGORIES } from '../../models/modules';
import type { ModuleCategory } from '../../models/modules';
import { formatCurrency } from '../../lib/format';
import { PriceBadge } from '../../components/ui/PriceBadge';
import { ModuleDetailPanel } from './ModuleDetailPanel';
import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { CitoBundleSelector } from './CitoBundleSelector';
import { getCitoBundle } from '../../data/providers/cito';

interface ComparisonTableProps {
  result: ComparisonResult;
  onBarHighlight?: string | null;
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
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
    className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export function ComparisonTable({ result, onBarHighlight }: ComparisonTableProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const scenario = useSchoolProfileStore((s) => s.scenario);

  const getProviderLabel = (provider: ProviderKey) => {
    if (provider === 'cito' && scenario === 'C') {
      return 'Huidig Cito';
    }
    return PROVIDER_LABELS[provider];
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModule((prev) => (prev === moduleId ? null : moduleId));
  };

  // Group modules by category
  const categoryOrder: ModuleCategory[] = ['leerlingvolgsysteem', 'overige-instrumenten'];
  const groupedModules = categoryOrder
    .map((category) => ({
      category,
      label: MODULE_CATEGORIES[category],
      modules: result.modules.filter((m) => m.moduleCategory === category),
    }))
    .filter((group) => group.modules.length > 0);

  // Use visibleProviders from store, filtered to only those with data
  const visibleProviders = usePriceComparisonStore((s) => s.visibleProviders);
  const activeProviders = visibleProviders.filter((provider) =>
    result.modules.some((m) => m.providers[provider] !== null),
  );
  const providerWidth = `${Math.floor(70 / activeProviders.length)}%`;

  const getDifference = (provider: ProviderKey): number | null => {
    if (provider === 'dia') return result.differences.citoVsDia;
    if (provider === 'jij') return result.differences.citoVsJij;
    if (provider === 'saqi') return result.differences.citoVsSaqi;
    return null;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="bg-cito-primary text-white text-sm font-semibold">
            <th className="w-[30%] text-left py-3 px-4">Module</th>
            {activeProviders.map((provider) => {
              // Find first module with data for this provider to get tier/package info
              const sampleCost = result.modules.find(m => m.providers[provider])?.providers[provider];
              const tierBadge = provider === 'jij' && sampleCost?.tierId
                ? `Licentie ${sampleCost.tierId}`
                : provider === 'dia' && sampleCost?.packageId
                ? sampleCost.packageId
                : null;

              return (
                <th key={provider} style={{ width: providerWidth }} className="text-left py-3 px-4">
                  <div>{getProviderLabel(provider)}</div>
                  {provider === 'cito' && <CitoBundleSelector compact />}
                  {tierBadge && provider !== 'cito' && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-white/20 rounded-full">
                      {tierBadge}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {groupedModules.map((group) => (
            <CategoryGroup
              key={group.category}
              label={group.label}
              modules={group.modules}
              expandedModule={expandedModule}
              onBarHighlight={onBarHighlight}
              onToggle={toggleModule}
              activeProviders={activeProviders}
            />
          ))}

          {/* Totaalrij */}
          <TotaalRow result={result} activeProviders={activeProviders} />

          {/* Verschil row */}
          <tr className="text-sm text-neutral-700">
            <td className="py-2 px-4"></td>
            {activeProviders.map((provider) => {
              if (provider === 'cito') return <td key={provider} className="py-2 px-4"></td>;
              const diff = getDifference(provider);
              return (
                <td key={provider} className="py-2 px-4">
                  {diff !== null
                    ? `Verschil: ${formatCurrency(Math.abs(diff))}`
                    : 'n.v.t.'}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Detect which modules are part of a Cito bundle (2+ modules with isPackagePrice). */
function getBundleModuleIds(modules: ComparisonResult['modules']): Set<string> {
  const bundled = modules.filter((m) => m.providers.cito?.isPackagePrice);
  if (bundled.length < 2) return new Set();
  return new Set(bundled.map((m) => m.moduleId));
}

function CategoryGroup({
  label,
  modules,
  expandedModule,
  onBarHighlight,
  onToggle,
  activeProviders,
}: {
  label: string;
  modules: ComparisonResult['modules'];
  expandedModule: string | null;
  onBarHighlight?: string | null;
  onToggle: (moduleId: string) => void;
  activeProviders: readonly ProviderKey[];
}) {
  const bundleModuleIds = getBundleModuleIds(modules);

  return (
    <>
      {/* Category subheader */}
      <tr className="bg-cito-bg">
        <td
          colSpan={1 + activeProviders.length}
          className="py-2 px-4 text-sm font-semibold text-neutral-700"
        >
          {label}
        </td>
      </tr>

      {modules.map((mod, idx) => {
        const isExpanded = expandedModule === mod.moduleId;
        const isHighlighted = onBarHighlight === mod.moduleId;
        const isBundled = bundleModuleIds.has(mod.moduleId);

        // Check if this is the last bundled module in the list
        const isLastBundled = isBundled && !modules.slice(idx + 1).some((m) => bundleModuleIds.has(m.moduleId));

        return (
          <BundleGroupWrapper key={mod.moduleId}>
            <ModuleRow
              mod={mod}
              isExpanded={isExpanded}
              isHighlighted={isHighlighted}
              onToggle={onToggle}
              activeProviders={activeProviders}
              isBundleGrouped={isBundled}
            />
            {isLastBundled && (
              <BundelSubtotaalRow
                bundleModules={modules.filter((m) => bundleModuleIds.has(m.moduleId))}
                activeProviders={activeProviders}
              />
            )}
          </BundleGroupWrapper>
        );
      })}
    </>
  );
}

/** Fragment wrapper — just passes children through. Needed for the key prop. */
function BundleGroupWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function BundelSubtotaalRow({
  bundleModules,
  activeProviders,
}: {
  bundleModules: ComparisonResult['modules'];
  activeProviders: readonly ProviderKey[];
}) {
  const citoBundleType = usePriceComparisonStore((s) => s.citoBundleType);
  const contractPeriod = usePriceComparisonStore((s) => s.contractPeriod);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const totalStudents = getTotalStudents(studentCounts);

  const bundle = getCitoBundle(citoBundleType);
  const bundleLabel = bundle.name;
  const bundlePricePerStudent = bundle.contractPrices?.[contractPeriod] ?? bundle.pricePerStudent;

  return (
    <tr className="bg-cito-primary/5 border-t border-cito-primary/10">
      <td className="py-2 px-4 pl-10 text-sm font-semibold text-cito-primary">
        Subtotaal {bundleLabel} bundel
      </td>
      {activeProviders.map((provider) => {
        // Sum the per-student prices for this provider across the bundle modules
        const perStudent = bundleModules.reduce((sum, m) => {
          const cost = m.providers[provider];
          return sum + (cost?.pricePerStudent ?? 0);
        }, 0);
        const total = perStudent * totalStudents;

        // For Cito: show the actual bundle price if available
        const isCito = provider === 'cito';
        const displayPerStudent = isCito && bundlePricePerStudent !== null
          ? bundlePricePerStudent
          : perStudent;
        const displayTotal = isCito && bundlePricePerStudent !== null
          ? bundlePricePerStudent * totalStudents
          : total;

        const hasAnyPrice = bundleModules.some((m) => m.providers[provider] !== null);
        if (!hasAnyPrice) {
          return <td key={provider} className="py-2 px-4 text-sm text-neutral-400">—</td>;
        }

        return (
          <td key={provider} className="py-2 px-4">
            <span className="text-sm font-semibold text-neutral-800">
              {formatCurrency(displayTotal)}
            </span>
            <span className="text-xs text-neutral-500 ml-1.5">
              ({formatCurrency(displayPerStudent)}/lln)
            </span>
          </td>
        );
      })}
    </tr>
  );
}

function ModuleRow({
  mod,
  isExpanded,
  isHighlighted,
  onToggle,
  activeProviders,
  isBundleGrouped = false,
}: {
  mod: ComparisonResult['modules'][number];
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: (moduleId: string) => void;
  activeProviders: readonly ProviderKey[];
  isBundleGrouped?: boolean;
}) {
  return (
    <>
      <tr
        id={`module-row-${mod.moduleId}`}
        className={`hover:bg-neutral-100 transition-colors duration-200 ${
          isHighlighted ? 'bg-neutral-100' : ''
        }`}
      >
        {/* Module name cell */}
        <td
          className={`py-3 px-4 cursor-pointer select-none ${
            isBundleGrouped ? 'border-l-2 border-l-cito-primary/30' : ''
          }`}
          onClick={() => onToggle(mod.moduleId)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle(mod.moduleId);
            }
          }}
          aria-expanded={isExpanded}
        >
          <span className="inline-flex items-center gap-2">
            <ChevronIcon expanded={isExpanded} />
            {mod.moduleName}
          </span>
        </td>

        {/* Provider cells */}
        {activeProviders.map((provider) => (
          <ProviderCell
            key={provider}
            cost={mod.providers[provider]}
          />
        ))}
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr>
          <td colSpan={1 + activeProviders.length} className="p-0">
            <div className="border-l-[3px] border-l-cito-primary bg-white p-6 overflow-hidden transition-all duration-200 ease-out">
              <ModuleDetailPanel moduleId={mod.moduleId} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TotaalRow({ result, activeProviders }: { result: ComparisonResult; activeProviders: readonly ProviderKey[] }) {
  const diaPackageResult = usePriceComparisonStore((s) => s.diaPackageResult);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const totalStudents = getTotalStudents(studentCounts);

  const hasPackageDiscount =
    diaPackageResult?.selectedPackage !== null && (diaPackageResult?.savings ?? 0) > 0;
  const savingsEuros = hasPackageDiscount
    ? diaPackageResult!.savings * totalStudents
    : 0;

  return (
    <tr className="bg-neutral-50 font-semibold text-base">
      <td className="py-3 px-4">Totaal</td>
      {activeProviders.map((provider) => (
        <td key={provider} className="py-3 px-4">
          <span>{formatCurrency(result.totals[provider])}</span>
          {provider === 'dia' && hasPackageDiscount && (
            <div className="text-xs font-normal text-green-700 mt-0.5">
              Pakketkorting ({diaPackageResult!.selectedPackage!.name}): besparing{' '}
              {formatCurrency(savingsEuros)}
            </div>
          )}
        </td>
      ))}
    </tr>
  );
}

function NoteIcon({ note }: { note: string }) {
  return (
    <span
      className="inline-flex items-center cursor-help"
      title={note}
      aria-label={note}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-500"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </span>
  );
}

function ProviderCell({
  cost,
}: {
  cost: ComparisonResult['modules'][number]['providers'][ProviderKey];
}) {
  if (cost === null) {
    return (
      <td className="py-3 px-4">
        <span className="inline-flex items-center bg-cito-accent/10 text-cito-accent rounded-full px-2 py-0.5 text-sm font-semibold">
          Niet beschikbaar
        </span>
      </td>
    );
  }

  return (
    <td className="py-3 px-4">
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold">
          {formatCurrency(cost.totalCost)}
        </span>
        {cost.isPackagePrice && (
          <span className="inline-flex items-center bg-cito-primary/10 text-cito-primary rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Bundel
          </span>
        )}
        <PriceBadge record={cost.priceRecord} />
        {cost.priceRecord.note && <NoteIcon note={cost.priceRecord.note} />}
      </div>
      <div className="text-sm text-neutral-500">
        per leerling: {formatCurrency(cost.pricePerStudent)}
      </div>
    </td>
  );
}
