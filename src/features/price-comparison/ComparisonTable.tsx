import { useState } from 'react';
import type { ComparisonResult, ProviderKey } from '../../engine/price-comparison';
import { PROVIDER_LABELS } from '../../engine/price-comparison';
import { MODULE_CATEGORIES } from '../../models/modules';
import type { ModuleCategory } from '../../models/modules';
import { formatCurrency } from '../../lib/format';
import { PriceBadge } from '../../components/ui/PriceBadge';
import { ModuleDetailPanel } from './ModuleDetailPanel';
import { SalesSignalBadge } from './SalesSignalBadge';
import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { determineSalesSignal } from '../../engine/sales-signals';
import { MODULE_DIFFERENTIATORS } from '../../data/differentiators';

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

export function ComparisonTable({ result, onBarHighlight }: ComparisonTableProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const isInternalMode = usePriceComparisonStore((s) => s.isInternalMode);
  const hybridResult = usePriceComparisonStore((s) => s.hybridResult);
  const diaPackageResult = usePriceComparisonStore((s) => s.diaPackageResult);
  const activeCompetitor = usePriceComparisonStore((s) => s.activeCompetitor);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);

  const toggleModule = (moduleId: string) => {
    setExpandedModule((prev) => (prev === moduleId ? null : moduleId));
  };

  // Dynamic column visibility (per D-04)
  const showJij = moduleSetups.some((s) => s.currentProvider === 'jij');
  const showNaOverstap = (hybridResult?.modules.length ?? 0) > 0;

  const visibleProviders: ProviderKey[] = showJij
    ? ['cito', 'dia', 'jij']
    : ['cito', 'dia'];

  const dynamicColSpan = 1 + visibleProviders.length + (showNaOverstap ? 1 : 0);

  // Group modules by category
  const categoryOrder: ModuleCategory[] = ['leerlingvolgsysteem', 'overige-instrumenten'];
  const groupedModules = categoryOrder
    .map((category) => ({
      category,
      label: MODULE_CATEGORIES[category],
      modules: result.modules.filter((m) => m.moduleCategory === category),
    }))
    .filter((group) => group.modules.length > 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="bg-cito-primary text-white text-sm font-semibold">
            <th className="text-left py-3 px-4">Module</th>
            {visibleProviders.map((provider) => (
              <th key={provider} className="text-left py-3 px-4">
                {PROVIDER_LABELS[provider]}
              </th>
            ))}
            {showNaOverstap && (
              <th className="text-left py-3 px-4">Na overstap</th>
            )}
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
              visibleProviders={visibleProviders}
              showNaOverstap={showNaOverstap}
              hybridResult={hybridResult}
              diaPackageResult={diaPackageResult}
              isInternalMode={isInternalMode}
              activeCompetitor={activeCompetitor}
              dynamicColSpan={dynamicColSpan}
            />
          ))}

          {/* Totaalrij */}
          <tr className="bg-neutral-50 font-semibold text-base">
            <td className="py-3 px-4">Totaal</td>
            {visibleProviders.map((provider) => (
              <td key={provider} className="py-3 px-4">
                {formatCurrency(result.totals[provider])}
              </td>
            ))}
            {showNaOverstap && hybridResult && (
              <td className="py-3 px-4">
                {formatCurrency(hybridResult.totalCitoCost)}
              </td>
            )}
          </tr>

          {/* Besparingsrij (per D-08, D-09) */}
          {showNaOverstap && hybridResult && (
            <tr className="text-sm font-semibold">
              <td className="py-2 px-4 text-neutral-700">Besparing</td>
              {visibleProviders.map((provider) => {
                if (provider === 'cito') {
                  return <td key={provider} className="py-2 px-4" />;
                }
                const diff = result.totals.cito - result.totals[provider];
                return (
                  <td key={provider} className="py-2 px-4 text-neutral-600">
                    {diff !== 0 ? formatCurrency(Math.abs(diff)) : '--'}
                  </td>
                );
              })}
              <td className="py-2 px-4">
                <span className={hybridResult.totalSavings >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {formatCurrency(hybridResult.totalSavings)}
                  {' '}
                  ({hybridResult.totalSavingsPercent}%)
                </span>
              </td>
            </tr>
          )}

          {/* Verschil row (when no hybrid, show classic differences) */}
          {!showNaOverstap && (
            <tr className="text-sm text-neutral-700">
              <td className="py-2 px-4" />
              <td className="py-2 px-4" />
              <td className="py-2 px-4">
                {result.differences.citoVsDia !== null
                  ? `Verschil: ${formatCurrency(Math.abs(result.differences.citoVsDia))}`
                  : 'n.v.t.'}
              </td>
              {showJij && (
                <td className="py-2 px-4">
                  {result.differences.citoVsJij !== null
                    ? `Verschil: ${formatCurrency(Math.abs(result.differences.citoVsJij))}`
                    : 'n.v.t.'}
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CategoryGroup({
  label,
  modules,
  expandedModule,
  onBarHighlight,
  onToggle,
  visibleProviders,
  showNaOverstap,
  hybridResult,
  diaPackageResult,
  isInternalMode,
  activeCompetitor,
  dynamicColSpan,
}: {
  label: string;
  modules: ComparisonResult['modules'];
  expandedModule: string | null;
  onBarHighlight?: string | null;
  onToggle: (moduleId: string) => void;
  visibleProviders: ProviderKey[];
  showNaOverstap: boolean;
  hybridResult: ReturnType<typeof usePriceComparisonStore.getState>['hybridResult'];
  diaPackageResult: ReturnType<typeof usePriceComparisonStore.getState>['diaPackageResult'];
  isInternalMode: boolean;
  activeCompetitor: ProviderKey | null;
  dynamicColSpan: number;
}) {
  return (
    <>
      {/* Category subheader */}
      <tr className="bg-cito-bg">
        <td
          colSpan={dynamicColSpan}
          className="py-2 px-4 text-sm font-semibold text-neutral-700"
        >
          {label}
        </td>
      </tr>

      {modules.map((mod) => {
        const isExpanded = expandedModule === mod.moduleId;
        const isHighlighted = onBarHighlight === mod.moduleId;

        return (
          <ModuleRow
            key={mod.moduleId}
            mod={mod}
            isExpanded={isExpanded}
            isHighlighted={isHighlighted}
            onToggle={onToggle}
            visibleProviders={visibleProviders}
            showNaOverstap={showNaOverstap}
            hybridResult={hybridResult}
            diaPackageResult={diaPackageResult}
            isInternalMode={isInternalMode}
            activeCompetitor={activeCompetitor}
            dynamicColSpan={dynamicColSpan}
          />
        );
      })}
    </>
  );
}

function ModuleRow({
  mod,
  isExpanded,
  isHighlighted,
  onToggle,
  visibleProviders,
  showNaOverstap,
  hybridResult,
  diaPackageResult,
  isInternalMode,
  activeCompetitor,
  dynamicColSpan,
}: {
  mod: ComparisonResult['modules'][number];
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: (moduleId: string) => void;
  visibleProviders: ProviderKey[];
  showNaOverstap: boolean;
  hybridResult: ReturnType<typeof usePriceComparisonStore.getState>['hybridResult'];
  diaPackageResult: ReturnType<typeof usePriceComparisonStore.getState>['diaPackageResult'];
  isInternalMode: boolean;
  activeCompetitor: ProviderKey | null;
  dynamicColSpan: number;
}) {
  // Compute sales signal for this module (per D-17, D-18)
  const salesSignal = (() => {
    if (!isInternalMode || !activeCompetitor) return null;
    const differentiators = MODULE_DIFFERENTIATORS.find(
      (d) => d.moduleId === mod.moduleId,
    );
    const citoCost = mod.providers.cito?.totalCost ?? null;
    const competitorCost = mod.providers[activeCompetitor]?.totalCost ?? null;
    return determineSalesSignal(
      citoCost,
      competitorCost,
      differentiators?.cito ?? [],
      differentiators?.[activeCompetitor] ?? [],
    );
  })();

  // Hybrid module result for Na overstap column
  const hybridMod = hybridResult?.modules.find(
    (m) => m.moduleId === mod.moduleId,
  );

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
          className="py-3 px-4 cursor-pointer select-none"
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
            {salesSignal && <SalesSignalBadge signal={salesSignal} />}
          </span>
        </td>

        {/* Provider cells */}
        {visibleProviders.map((provider) => (
          <ProviderCell
            key={provider}
            provider={provider}
            cost={mod.providers[provider]}
            moduleId={mod.moduleId}
            diaPackageResult={diaPackageResult}
          />
        ))}

        {/* Na overstap cell (per D-08) */}
        {showNaOverstap && (
          <td className="py-3 px-4">
            {hybridMod ? (
              <div>
                <span className="text-base font-semibold">
                  {formatCurrency(hybridMod.citoCost)}
                </span>
                {hybridMod.savings !== 0 && (
                  <div className={`text-sm ${hybridMod.savings > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {hybridMod.savings > 0 ? '-' : '+'}{formatCurrency(Math.abs(hybridMod.savings))}
                    {' '}({hybridMod.savingsPercent}%)
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-neutral-400">--</span>
            )}
          </td>
        )}
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr>
          <td colSpan={dynamicColSpan} className="p-0">
            <div className="border-l-[3px] border-l-cito-primary bg-white p-6 overflow-hidden transition-all duration-200 ease-out">
              <ModuleDetailPanel moduleId={mod.moduleId} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ProviderCell({
  provider,
  cost,
  moduleId,
  diaPackageResult,
}: {
  provider: ProviderKey;
  cost: ComparisonResult['modules'][number]['providers'][ProviderKey];
  moduleId: string;
  diaPackageResult: ReturnType<typeof usePriceComparisonStore.getState>['diaPackageResult'];
}) {
  // Check if this DIA module is covered by a package (per D-03)
  const isPackagePrice =
    provider === 'dia' &&
    diaPackageResult?.selectedPackage !== null &&
    diaPackageResult?.coveredModuleIds.includes(moduleId);

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
        <PriceBadge record={cost.priceRecord} />
        {cost.priceRecord.note && <NoteIcon note={cost.priceRecord.note} />}
        {isPackagePrice && (
          <span className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 text-xs font-medium">
            Pakketprijs
          </span>
        )}
      </div>
      <div className="text-sm text-neutral-500">
        per leerling: {formatCurrency(cost.pricePerStudent)}
      </div>
    </td>
  );
}
