/**
 * Step 1 in the unified AI advice flow.
 * Shows schoolplan summary as read-only context card.
 * If no schoolplan available, shows a muted placeholder.
 */

import { useSchoolProfileStore } from '@/features/school-profile/store';
import { useSchoolplanAnalysis } from '@/hooks/useSchoolplanAnalysis';

export function SchoolplanContextCard() {
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const { data: analysis } = useSchoolplanAnalysis(activeSchoolId ?? '');

  const isComplete = analysis?.analysis_status === 'complete';
  const hasOpportunities = isComplete && analysis.opportunities.length > 0;

  // No schoolplan — muted placeholder
  if (!hasOpportunities) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <StepBadge step={1} muted />
          <h3 className="text-sm font-semibold text-neutral-400">Schoolplan context</h3>
        </div>
        <p className="text-xs text-neutral-400 pl-7">
          Geen schoolplan beschikbaar — deze stap kan worden overgeslagen.
          De AI-analyse werkt ook zonder schoolplan.
        </p>
      </div>
    );
  }

  // Schoolplan available — show summary
  const opportunityCount = analysis.opportunities.length;
  const themeList = analysis.themes.slice(0, 4).join(', ');

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <StepBadge step={1} />
        <h3 className="text-sm font-semibold text-purple-800">Schoolplan context</h3>
        <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
          {opportunityCount} {opportunityCount === 1 ? 'kans' : 'kansen'}
        </span>
      </div>
      <p className="text-sm text-purple-700 leading-relaxed pl-7">
        {analysis.summary.length > 200
          ? analysis.summary.slice(0, 200).trim() + '...'
          : analysis.summary}
      </p>
      {themeList && (
        <p className="text-xs text-purple-500 mt-2 pl-7">
          Thema's: {themeList}
          {analysis.themes.length > 4 && ` +${analysis.themes.length - 4}`}
        </p>
      )}
    </div>
  );
}

function StepBadge({ step, muted }: { step: number; muted?: boolean }) {
  return (
    <span
      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
        muted
          ? 'bg-neutral-200 text-neutral-400'
          : 'bg-purple-600 text-white'
      }`}
    >
      {step}
    </span>
  );
}
