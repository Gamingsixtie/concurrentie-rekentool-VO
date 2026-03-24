import { formatCurrency } from '@/lib/format';

interface ValueHeroCardProps {
  priceDifference: number | null;
  timeSavingsValue: number;
  timeSavingsHours: number;
  migrationDifference: number;
  hourlyRateKnown: boolean;
}

export function ValueHeroCard({
  priceDifference,
  timeSavingsValue,
  timeSavingsHours,
  migrationDifference,
  hourlyRateKnown,
}: ValueHeroCardProps) {
  const totalAnnualValue =
    (priceDifference ?? 0) + timeSavingsValue + migrationDifference;

  const showTotalInEuros = hourlyRateKnown || priceDifference !== null || migrationDifference !== 0;

  // Count how many value components are known
  const components: string[] = [];
  if (priceDifference !== null) components.push('prijsvergelijking');
  if (hourlyRateKnown && timeSavingsValue > 0) components.push('tijdwinst');
  if (migrationDifference !== 0) components.push('migratie-effect');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h2 className="text-lg font-semibold text-cito-primary">
        Totale jaarlijkse waarde van de overstap
      </h2>
      {showTotalInEuros ? (
        <div className="text-2xl font-semibold text-cito-accent mt-2">
          {formatCurrency(totalAnnualValue)}
          {!hourlyRateKnown && timeSavingsHours > 0 && (
            <span className="text-base font-normal text-neutral-500 ml-2">
              + {timeSavingsHours} uur tijdwinst
            </span>
          )}
        </div>
      ) : (
        <div className="text-2xl font-semibold text-cito-accent mt-2">
          {timeSavingsHours} uur tijdwinst per jaar
        </div>
      )}

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="border-l-2 border-neutral-200 pl-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-0.5">
            Prijsvergelijking
          </p>
          {priceDifference !== null ? (
            <p className={`text-sm font-medium ${priceDifference >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatCurrency(priceDifference)}
              <span className="font-normal text-neutral-500 ml-1">
                {priceDifference >= 0 ? 'goedkoper' : 'duurder'} dan concurrent
              </span>
            </p>
          ) : (
            <p className="text-sm italic text-neutral-400">
              Vul de vergelijking in op het tabblad Vergelijking
            </p>
          )}
        </div>

        <div className="border-l-2 border-neutral-200 pl-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-0.5">
            Tijdwinst
          </p>
          {hourlyRateKnown ? (
            <p className="text-sm font-medium text-green-700">
              {formatCurrency(timeSavingsValue)}
              <span className="font-normal text-neutral-500 ml-1">
                ({timeSavingsHours} uur/jaar)
              </span>
            </p>
          ) : (
            <p className="text-sm text-neutral-600">
              {timeSavingsHours} uur/jaar
              <span className="text-neutral-400 ml-1">(geen uurtarief)</span>
            </p>
          )}
        </div>

        <div className="border-l-2 border-neutral-200 pl-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-0.5">
            Migratie-effect
          </p>
          <p className={`text-sm font-medium ${
            migrationDifference > 0
              ? 'text-green-700'
              : migrationDifference < 0
                ? 'text-red-600'
                : 'text-neutral-500'
          }`}>
            {formatCurrency(migrationDifference)}
            {migrationDifference !== 0 && (
              <span className="font-normal text-neutral-500 ml-1">
                {migrationDifference > 0 ? 'besparing' : 'meerkosten'}
              </span>
            )}
          </p>
        </div>
      </div>

      {components.length === 0 && (
        <p className="text-xs text-neutral-400 mt-3 italic">
          Vul tijdwinst en/of prijsvergelijking in om de totale waarde te berekenen
        </p>
      )}
    </div>
  );
}
