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
      <div className="flex flex-col md:flex-row gap-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200 mt-4">
        <div className="text-sm text-neutral-500 pt-2 md:pt-0">
          {priceDifference !== null ? (
            <>Prijsverschil: {formatCurrency(priceDifference)}</>
          ) : (
            <span className="italic text-neutral-400">
              Vul eerst de vergelijking in op het tabblad Vergelijking
            </span>
          )}
        </div>
        <div className="text-sm text-neutral-500 pt-2 md:pt-0 md:pl-4">
          {hourlyRateKnown ? (
            <>Tijdwinst: {formatCurrency(timeSavingsValue)}</>
          ) : (
            <>Tijdwinst: {timeSavingsHours} uur/jaar</>
          )}
        </div>
        <div className="text-sm text-neutral-500 pt-2 md:pt-0 md:pl-4">
          Migratie-effect: {formatCurrency(migrationDifference)}
        </div>
      </div>
    </div>
  );
}
