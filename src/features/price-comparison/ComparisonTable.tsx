import { useState } from 'react';
import type { ComparisonResult, ProviderKey } from '../../engine/price-comparison';
import { PROVIDERS, getTotalStudents } from '../../engine/price-comparison';
import { MODULE_CATEGORIES } from '../../models/modules';
import type { ModuleCategory } from '../../models/modules';
import { formatCurrency } from '../../lib/format';
import { PriceBadge } from '../../components/ui/PriceBadge';
import { ModuleDetailPanel } from './ModuleDetailPanel';
import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';

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

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="bg-cito-primary text-white text-sm font-semibold">
            <th className="w-[30%] text-left py-3 px-4">Module</th>
            <th className="w-[23.3%] text-left py-3 px-4">Cito</th>
            <th className="w-[23.3%] text-left py-3 px-4">DIA</th>
            <th className="w-[23.3%] text-left py-3 px-4">JIJ</th>
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
            />
          ))}

          {/* Totaalrij */}
          <TotaalRow result={result} />

          {/* Verschil row */}
          <tr className="text-sm text-neutral-700">
            <td className="py-2 px-4"></td>
            <td className="py-2 px-4"></td>
            <td className="py-2 px-4">
              {result.differences.citoVsDia !== null
                ? `Verschil: ${formatCurrency(Math.abs(result.differences.citoVsDia))}`
                : 'n.v.t.'}
            </td>
            <td className="py-2 px-4">
              {result.differences.citoVsJij !== null
                ? `Verschil: ${formatCurrency(Math.abs(result.differences.citoVsJij))}`
                : 'n.v.t.'}
            </td>
          </tr>
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
}: {
  label: string;
  modules: ComparisonResult['modules'];
  expandedModule: string | null;
  onBarHighlight?: string | null;
  onToggle: (moduleId: string) => void;
}) {
  return (
    <>
      {/* Category subheader */}
      <tr className="bg-cito-bg">
        <td
          colSpan={4}
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
}: {
  mod: ComparisonResult['modules'][number];
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: (moduleId: string) => void;
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
          </span>
        </td>

        {/* Provider cells */}
        {PROVIDERS.map((provider) => (
          <ProviderCell
            key={provider}
            cost={mod.providers[provider]}
          />
        ))}
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr>
          <td colSpan={4} className="p-0">
            <div className="border-l-[3px] border-l-cito-primary bg-white p-6 overflow-hidden transition-all duration-200 ease-out">
              <ModuleDetailPanel moduleId={mod.moduleId} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TotaalRow({ result }: { result: ComparisonResult }) {
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
      {PROVIDERS.map((provider) => (
        <td key={provider} className="py-3 px-4">
          <span>{formatCurrency(result.totals[provider])}</span>
          {provider === 'dia' && hasPackageDiscount && (
            <div className="text-xs font-normal text-green-700 mt-0.5">
              Incl. pakketkorting ({diaPackageResult!.selectedPackage!.name}) — besparing{' '}
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
        <PriceBadge record={cost.priceRecord} />
        {cost.priceRecord.note && <NoteIcon note={cost.priceRecord.note} />}
      </div>
      <div className="text-sm text-neutral-500">
        per leerling: {formatCurrency(cost.pricePerStudent)}
      </div>
    </td>
  );
}
