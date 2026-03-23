import type { MultiYearProjectionEntry } from '@/engine/migration';
import { EditableField } from './EditableField';
import { formatCurrency } from '@/lib/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MultiYearSectionProps {
  projection: MultiYearProjectionEntry[];
  totalAnnualValue: number;
  switchingCosts: number;
  breakEvenMonth: number | null;
  onSwitchingCostsChange: (costs: number) => void;
}

export function MultiYearSection({
  projection,
  totalAnnualValue,
  switchingCosts,
  breakEvenMonth,
  onSwitchingCostsChange,
}: MultiYearSectionProps) {
  const data = projection.map((p) => ({
    name: `${p.year} jaar`,
    waarde: Math.round(p.cumulativeSavings),
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-cito-primary mb-4">
        Meerjarenprojectie
      </h3>

      <div className="h-48" aria-label="Meerjarenprojectie staafdiagram">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={48}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v)), 'Cumulatieve waarde']}
            />
            <Bar dataKey="waarde" fill="#003082" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Jaar</th>
              <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">Jaarlijks</th>
              <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">Cumulatief</th>
            </tr>
          </thead>
          <tbody>
            {projection.map((entry, index) => (
              <tr key={entry.year} className={index % 2 === 1 ? 'bg-neutral-50' : ''}>
                <td className="py-2 px-3 text-sm">{entry.year}</td>
                <td className="py-2 px-3 text-sm text-right">
                  {formatCurrency(totalAnnualValue)}
                </td>
                <td className="py-2 px-3 text-sm text-right">
                  {formatCurrency(entry.cumulativeSavings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
        <EditableField
          label="Overstapkosten"
          value={switchingCosts}
          unit="EUR"
          onChange={onSwitchingCostsChange}
        />
        <div className="text-sm">
          {breakEvenMonth === 0 && (
            <span className="text-green-700 font-semibold">Direct terugverdiend</span>
          )}
          {breakEvenMonth === null && (
            <span className="text-red-600">Geen terugverdientijd</span>
          )}
          {breakEvenMonth !== null && breakEvenMonth > 0 && (
            <span className="text-neutral-700">
              Terugverdiend in <strong>{breakEvenMonth} maanden</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
