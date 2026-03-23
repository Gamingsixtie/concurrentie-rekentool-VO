import type { MigrationModuleResult } from '@/engine/migration';
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
  const isPlaceholder = (mod: MigrationModuleResult) =>
    mod.oldPricePerStudent === mod.newPricePerStudent;

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
                <tr key={mod.moduleId} className={index % 2 === 1 ? 'bg-neutral-50' : ''}>
                  <td className="py-2 px-3 text-sm">{mod.moduleName}</td>
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
    </div>
  );
}
