/**
 * Unified AI advice section that combines three progressive steps into one cohesive story:
 * 1. Schoolplan context (read-only summary)
 * 2. AI vergelijkingsadvies (wizard)
 * 3. AI concurrentieanalyse (enriched with wizard output)
 */

import { useWizardStore } from '../wizard/wizard-store';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { SchoolplanContextCard } from './SchoolplanContextCard';
import { ComparisonWizard } from '../wizard/ComparisonWizard';
import { AnalysisPanel } from '../AnalysisPanel';
import { NarrativeConnector } from './NarrativeConnector';

interface AiAdviesSectionProps {
  schoolId?: string;
}

export function AiAdviesSection({ schoolId }: AiAdviesSectionProps) {
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const hasCompletedWizard = useWizardStore((s) => s.hasCompletedOnce);
  const wizardNarrativeContext = useWizardStore((s) => s.wizardNarrativeContext);

  if (selectedModules.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-shrink-0 w-9 h-9 bg-cito-primary/10 rounded-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-cito-primary"
            aria-hidden="true"
          >
            <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-cito-primary">
            AI Advies — samenhangend verhaal
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Drie stappen die voortbouwen op elkaar: schoolplan → vergelijkingsadvies → diepgaande analyse
          </p>
        </div>
      </div>

      {/* Complete banner */}
      {hasCompletedWizard && wizardNarrativeContext && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Vergelijkingsadvies afgerond — de concurrentieanalyse hieronder bouwt hier automatisch op voort
            </span>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {/* Step 1: Schoolplan context */}
        <SchoolplanContextCard />

        <NarrativeConnector text="Schoolplan-inzichten verrijken het vergelijkingsadvies" />

        {/* Step 2: Comparison wizard */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-cito-primary text-white">
              2
            </span>
            <h3 className="text-sm font-semibold text-neutral-700">Vergelijkingsadvies</h3>
          </div>
          <ComparisonWizard />
        </div>

        <NarrativeConnector text="Het vergelijkingsadvies vormt de basis voor de diepgaande analyse" />

        {/* Step 3: Enriched analysis */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-indigo-600 text-white">
              3
            </span>
            <h3 className="text-sm font-semibold text-neutral-700">Diepgaande concurrentieanalyse</h3>
          </div>
          <AnalysisPanel mode="comparison" schoolId={schoolId} />
        </div>
      </div>
    </div>
  );
}
