import { useState } from 'react';
import type { MigrationModuleResult } from '@/engine/migration';
import { MIGRATION_MODULE_BENEFITS } from '@/models/migration';
import { formatCurrency } from '@/lib/format';

interface MigrationSectionProps {
  modules: MigrationModuleResult[];
  totalOldCost: number;
  totalNewCost: number;
  financialDifference: number;
  hasPlaceholderPrices: boolean;
}

export function MigrationSection({
  modules,
  totalOldCost,
  totalNewCost,
  financialDifference,
  hasPlaceholderPrices,
}: MigrationSectionProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const isPlaceholder = (mod: MigrationModuleResult) =>
    mod.oldPricePerStudent === mod.newPricePerStudent;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getBenefits = (moduleId: string) =>
    MIGRATION_MODULE_BENEFITS.find((b) => b.moduleId === moduleId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-cito-primary mb-4">
        Migratie huidig naar nieuw Cito-platform
      </h3>

      {hasPlaceholderPrices && (
        <div
          role="alert"
          className="bg-amber-50 border border-amber-400 rounded-md p-4 mb-4 flex items-start gap-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-600 shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm text-amber-800">
            Migratieprijzen zijn indicatief -- vul werkelijke tarieven in voor
            een betrouwbare businesscase.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Module</th>
              <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">Huidig</th>
              <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">Nieuw</th>
              <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">Verschil</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, index) => {
              const placeholder = isPlaceholder(mod);
              const benefits = getBenefits(mod.moduleId);
              const isExpanded = expandedModules.has(mod.moduleId);
              const diffColor =
                mod.annualDifference > 0
                  ? 'text-green-700'
                  : mod.annualDifference < 0
                    ? 'text-red-600'
                    : 'text-neutral-500';
              const diffPrefix =
                mod.annualDifference > 0
                  ? '+'
                  : mod.annualDifference < 0
                    ? '-'
                    : '';
              return (
                <>
                  <tr
                    key={mod.moduleId}
                    className={`${index % 2 === 1 ? 'bg-neutral-50' : ''} ${benefits ? 'cursor-pointer hover:bg-neutral-100/50' : ''}`}
                    onClick={benefits ? () => toggleModule(mod.moduleId) : undefined}
                  >
                    <td className="py-2 px-3 text-sm">
                      <span className="flex items-center gap-1.5">
                        {benefits && (
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
                            className={`text-neutral-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        )}
                        {mod.moduleName}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sm text-right">
                      {formatCurrency(mod.oldTotalCost)}
                      {placeholder && '*'}
                    </td>
                    <td className="py-2 px-3 text-sm text-right">
                      {formatCurrency(mod.newTotalCost)}
                      {placeholder && '*'}
                    </td>
                    <td className={`py-2 px-3 text-sm text-right font-semibold ${diffColor}`}>
                      {diffPrefix}
                      {formatCurrency(Math.abs(mod.annualDifference))}
                    </td>
                  </tr>
                  {isExpanded && benefits && (
                    <tr key={`${mod.moduleId}-details`}>
                      <td colSpan={4} className="px-3 pb-3 pt-1">
                        <div className="ml-6 bg-blue-50/60 border border-blue-100 rounded-md p-3">
                          <p className="text-sm text-neutral-600 mb-2">{benefits.toelichting}</p>
                          <ul className="space-y-1">
                            {benefits.voordelen.map((voordeel) => (
                              <li key={voordeel} className="flex items-start gap-2 text-sm text-neutral-700">
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
                                  className="text-green-600 shrink-0 mt-0.5"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {voordeel}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t-2 border-neutral-300">
              <td className="py-2 px-3 text-sm">Totaal</td>
              <td className="py-2 px-3 text-sm text-right">{formatCurrency(totalOldCost)}</td>
              <td className="py-2 px-3 text-sm text-right">{formatCurrency(totalNewCost)}</td>
              <td
                className={`py-2 px-3 text-sm text-right ${
                  financialDifference > 0
                    ? 'text-green-700'
                    : financialDifference < 0
                      ? 'text-red-600'
                      : 'text-neutral-500'
                }`}
              >
                {financialDifference > 0 ? '+' : financialDifference < 0 ? '-' : ''}
                {formatCurrency(Math.abs(financialDifference))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {hasPlaceholderPrices && (
        <p className="text-xs text-neutral-400 mt-2">* Indicatieve prijs</p>
      )}

      <p className="text-xs text-neutral-400 mt-2 italic">
        Klik op een module om de voordelen van het nieuwe platform te bekijken
      </p>
    </div>
  );
}
