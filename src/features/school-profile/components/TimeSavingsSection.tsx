import type { TimeSavingResult } from '@/engine/migration';
import { EditableField } from './EditableField';
import { formatCurrency } from '@/lib/format';

interface TimeSavingsSectionProps {
  timeSavings: TimeSavingResult[];
  totalHours: number;
  totalValue: number;
  hourlyRate: number | null;
  onHoursChange: (taskId: string, hours: number) => void;
  onHourlyRateChange: (rate: number | null) => void;
}

export function TimeSavingsSection({
  timeSavings,
  totalHours,
  totalValue,
  hourlyRate,
  onHoursChange,
  onHourlyRateChange,
}: TimeSavingsSectionProps) {
  const hasRate = hourlyRate !== null && hourlyRate > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="text-lg font-semibold text-cito-primary">
          Tijdwinst nieuw platform
        </h3>
        <div className="flex items-center gap-3">
          {hasRate ? (
            <EditableField
              label="Uurtarief"
              value={hourlyRate}
              unit="EUR/uur"
              onChange={(v) => onHourlyRateChange(v)}
            />
          ) : (
            <button
              type="button"
              onClick={() => onHourlyRateChange(50)}
              className="text-sm text-cito-primary underline decoration-dashed underline-offset-2 hover:text-cito-accent"
            >
              Uurtarief invullen
            </button>
          )}
          {hasRate && (
            <button
              type="button"
              onClick={() => onHourlyRateChange(null)}
              className="text-xs text-neutral-400 hover:text-neutral-600"
              title="Uurtarief verwijderen"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Taak</th>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Oud</th>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Nieuw</th>
              <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">Uren/jaar</th>
              {hasRate && (
                <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">EUR/jaar</th>
              )}
            </tr>
          </thead>
          <tbody>
            {timeSavings.map((task, index) => (
              <tr key={task.taskId} className={index % 2 === 1 ? 'bg-neutral-50' : ''}>
                <td className="py-2 px-3 text-sm">{task.taskLabel}</td>
                <td className="py-2 px-3 text-sm text-neutral-500">{task.oldMethodLabel}</td>
                <td className="py-2 px-3 text-sm text-neutral-500">{task.newMethodLabel}</td>
                <td className="py-2 px-3 text-right">
                  <EditableField
                    label=""
                    value={task.hoursPerYear}
                    unit="uur"
                    onChange={(h) => onHoursChange(task.taskId, h)}
                  />
                </td>
                {hasRate && (
                  <td className="py-2 px-3 text-sm text-right">
                    {formatCurrency(task.valuePerYear)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t-2 border-neutral-300">
              <td colSpan={3} className="py-2 px-3 text-sm">Totaal</td>
              <td className="py-2 px-3 text-sm text-right">{totalHours} uur</td>
              {hasRate && (
                <td className="py-2 px-3 text-sm text-right">{formatCurrency(totalValue)}</td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {!hasRate && (
        <p className="mt-3 text-xs text-neutral-400 italic">
          Vul een uurtarief in om de tijdwinst ook in euro's te zien
        </p>
      )}
    </div>
  );
}
