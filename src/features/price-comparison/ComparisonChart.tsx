import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ComparisonResult, ProviderKey } from '../../engine/price-comparison';
import { PROVIDER_LABELS } from '../../engine/price-comparison';
import { formatCurrency, formatCurrencyCompact } from '../../lib/format';
import { useSchoolProfileStore } from '../school-profile/store';
import { usePriceComparisonStore } from './store';

interface ChartDataPoint {
  module: string;
  moduleId: string;
  cito: number | null;
  dia: number | null;
  jij: number | null;
  saqi: number | null;
  naOverstap: number | null;
  citoPerStudent: number | null;
  diaPerStudent: number | null;
  jijPerStudent: number | null;
  saqiPerStudent: number | null;
}

interface ComparisonChartProps {
  result: ComparisonResult;
  onBarClick?: (moduleId: string) => void;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | null;
    dataKey: string;
    payload: ChartDataPoint;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="bg-white border border-neutral-200 rounded-lg p-3"
      style={{ minWidth: 160 }}
    >
      <p className="text-sm font-semibold text-neutral-700 mb-1">{label}</p>
      {payload.map((entry) => {
        if (entry.value == null) return null;
        const perStudentKey =
          `${entry.dataKey}PerStudent` as keyof ChartDataPoint;
        const perStudent = entry.payload[perStudentKey] as number | null;

        return (
          <div key={entry.dataKey} className="flex flex-col mb-1 last:mb-0">
            <span className="text-sm text-neutral-600">{entry.name}</span>
            <span className="text-sm font-semibold">
              {formatCurrency(entry.value)}
            </span>
            {perStudent != null && (
              <span className="text-xs text-neutral-400">
                {formatCurrency(perStudent)} per leerling
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ComparisonChart({ result, onBarClick }: ComparisonChartProps) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );

  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const hybridResult = usePriceComparisonStore((s) => s.hybridResult);

  // Dynamic visibility: only show providers that have data
  const showJij = moduleSetups.some((s) => s.currentProvider === 'jij');
  const showNaOverstap = (hybridResult?.modules.length ?? 0) > 0;
  const showSaqi = result.modules.some((m) => m.providers.saqi !== null);

  const visibleProviders: ProviderKey[] = ['cito', 'dia'];
  if (showJij) visibleProviders.push('jij');
  if (showSaqi) visibleProviders.push('saqi');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const data: ChartDataPoint[] = useMemo(
    () =>
      result.modules.map((mod) => {
        const hybridMod = hybridResult?.modules.find(
          (m) => m.moduleId === mod.moduleId,
        );
        return {
          module: mod.moduleName,
          moduleId: mod.moduleId,
          cito: mod.providers.cito?.totalCost ?? null,
          dia: mod.providers.dia?.totalCost ?? null,
          jij: mod.providers.jij?.totalCost ?? null,
          saqi: mod.providers.saqi?.totalCost ?? null,
          naOverstap: hybridMod?.citoCost ?? null,
          citoPerStudent: mod.providers.cito?.pricePerStudent ?? null,
          diaPerStudent: mod.providers.dia?.pricePerStudent ?? null,
          jijPerStudent: mod.providers.jij?.pricePerStudent ?? null,
          saqiPerStudent: mod.providers.saqi?.pricePerStudent ?? null,
        };
      }),
    [result.modules, hybridResult],
  );

  const barSize = windowWidth < 640 ? 20 : 32;
  const xAxisAngle = windowWidth < 480 ? -45 : 0;
  const xAxisTextAnchor = windowWidth < 480 ? 'end' : 'middle';

  const handleBarClick = useCallback(
    (data: ChartDataPoint) => {
      onBarClick?.(data.moduleId);
    },
    [onBarClick],
  );

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} barSize={barSize} barGap={4} barCategoryGap="20%">
        <XAxis
          dataKey="module"
          tick={{ fontSize: 14 }}
          angle={xAxisAngle}
          textAnchor={xAxisTextAnchor}
        />
        <YAxis tickFormatter={(value: number) => formatCurrencyCompact(value)} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="cito"
          name={PROVIDER_LABELS.cito}
          fill="#003082"
          onClick={(_data: unknown, index: number) =>
            handleBarClick(data[index])
          }
          style={{ cursor: onBarClick ? 'pointer' : undefined }}
        />
        <Bar dataKey="dia" name={PROVIDER_LABELS.dia} fill="#9CA3AF" />
        {visibleProviders.includes('jij') && (
          <Bar dataKey="jij" name={PROVIDER_LABELS.jij} fill="#6B7280" />
        )}
        {visibleProviders.includes('saqi') && (
          <Bar dataKey="saqi" name={PROVIDER_LABELS.saqi} fill="#8B5CF6" />
        )}
        {showNaOverstap && (
          <Bar
            dataKey="naOverstap"
            name="Na overstap"
            fill="#003082"
            fillOpacity={0.5}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
