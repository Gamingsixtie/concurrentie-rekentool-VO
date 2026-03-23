import type { TimeSavingResult } from '@/engine/migration';
import { EditableField } from './EditableField';
import { formatCurrency } from '@/lib/format';

interface TimeSavingsSectionProps {
  timeSavings: TimeSavingResult[];
  totalHours: number;
  totalValue: number;
  hourlyRate: number;
  onHoursChange: (taskId: string, hours: number) => void;
  onHourlyRateChange: (rate: number) => void;
}

export function TimeSavingsSection({
  timeSavings,
  totalHours,
  totalValue,
  hourlyRate,
  onHoursChange,
  onHourlyRateChange,
}: TimeSavingsSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="text-lg font-semibold text-cito-primary">
          Tijdwinst nieuw platform
        </h3>
        <EditableField
          label="Uurtarief"
          value={hourlyRate}
          unit="EUR/uur"
          onChange={onHourlyRateChange}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Taak</th>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Oud</th>
              <th className="py-2 px-3 text-left text-sm font-semibold text-neutral-700">Nieuw</th>
              <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">Uren/jaar</th>
              <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-700">EUR/jaar</th>
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
                <td className="py-2 px-3 text-sm text-right">
                  {formatCurrency(task.valuePerYear)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t-2 border-neutral-300">
              <td colSpan={3} className="py-2 px-3 text-sm">Totaal</td>
              <td className="py-2 px-3 text-sm text-right">{totalHours} uur</td>
              <td className="py-2 px-3 text-sm text-right">{formatCurrency(totalValue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
