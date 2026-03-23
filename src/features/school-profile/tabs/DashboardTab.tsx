import { useMemo, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useSchoolProfileStore } from '../store';
import { updateSchoolData } from '@/db/operations';
import { uniqueSlug } from '@/lib/slugify';
import { calculateComparison, getTotalStudents } from '@/engine/price-comparison';
import { calculateUpsell } from '@/engine/upsell';
import { DEFAULT_PRICES } from '@/data/default-prices';
import { useSchoolPrices } from '@/hooks/useSchoolPrices';
import {
  SCHOOL_LEVELS,
  SCHOOL_LEVEL_LABELS,
  SCENARIO_LABELS,
} from '@/models/school';
import type { PipelineStatus, SchoolLevel, Scenario } from '@/models/school';
import PipelineBadge from '@/components/ui/PipelineBadge';
import UpsellCard from '../components/UpsellCard';

// Context-smart actions per pipeline status
const SMART_ACTIONS: Record<
  PipelineStatus,
  { primary: { label: string; tab: string }; secondary: { label: string; tab: string }[] }
> = {
  prospect: {
    primary: { label: 'Vergelijking maken', tab: 'vergelijking' },
    secondary: [
      { label: 'Contact opnemen', tab: 'contacten' },
      { label: 'Gesprek vastleggen', tab: 'gesprekken' },
    ],
  },
  'contact-gelegd': {
    primary: { label: 'Demo inplannen', tab: 'gesprekken' },
    secondary: [
      { label: 'Gesprek vastleggen', tab: 'gesprekken' },
      { label: 'Vergelijking bekijken', tab: 'vergelijking' },
    ],
  },
  'demo-presentatie': {
    primary: { label: 'Offerte klaarmaken', tab: 'vergelijking' },
    secondary: [
      { label: 'Gesprek vastleggen', tab: 'gesprekken' },
      { label: 'Vergelijking bijwerken', tab: 'vergelijking' },
    ],
  },
  offerte: {
    primary: { label: 'Status bijwerken', tab: 'gesprekken' },
    secondary: [
      { label: 'Gesprek vastleggen', tab: 'gesprekken' },
      { label: 'Vergelijking bekijken', tab: 'vergelijking' },
    ],
  },
  gewonnen: {
    primary: { label: 'Producten bijwerken', tab: 'producten' },
    secondary: [
      { label: 'Migratie bekijken', tab: 'vergelijking' },
      { label: 'Gesprek vastleggen', tab: 'gesprekken' },
    ],
  },
  verloren: {
    primary: { label: 'Laatste gesprek bekijken', tab: 'gesprekken' },
    secondary: [
      { label: 'Vergelijking bekijken', tab: 'vergelijking' },
      { label: 'Opnieuw benaderen', tab: 'contacten' },
    ],
  },
};

export default function DashboardTab() {
  const { slug } = useParams({ from: '/scholen/$slug' });
  const navigate = useNavigate();

  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const schoolName = useSchoolProfileStore((s) => s.schoolName);
  const pipelineStatus = useSchoolProfileStore((s) => s.pipelineStatus);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const contacts = useSchoolProfileStore((s) => s.contacts);
  const levels = useSchoolProfileStore((s) => s.levels);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const scenario = useSchoolProfileStore((s) => s.scenario);
  const region = useSchoolProfileStore((s) => s.region);

  // School-specific prices for upsell calculation
  const { data: schoolPrices } = useSchoolPrices(activeSchoolId ?? '');

  // Compute upsell opportunities
  const hasModuleSetups = moduleSetups.some((m) => m.currentProvider !== 'geen');

  const upsellOpportunities = useMemo(() => {
    if (selectedModules.length === 0 || moduleSetups.length === 0) return [];

    // Build prices array: active school prices override defaults
    const activePrices = (schoolPrices ?? []).filter((p) => p.isActive);
    const prices = DEFAULT_PRICES.map((dp) => {
      const schoolPrice = activePrices.find(
        (sp) => sp.moduleId === dp.moduleId && sp.provider === dp.provider,
      );
      if (schoolPrice) {
        return { ...dp, amountPerStudent: schoolPrice.amount };
      }
      return dp;
    });

    try {
      const comparisonResult = calculateComparison(selectedModules, studentCounts, prices);
      return calculateUpsell(moduleSetups, comparisonResult);
    } catch {
      return [];
    }
  }, [selectedModules, studentCounts, moduleSetups, schoolPrices]);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(schoolName);
  const [editRegion, setEditRegion] = useState(region);
  const [editLevels, setEditLevels] = useState<SchoolLevel[]>(levels);
  const [editScenario, setEditScenario] = useState<Scenario | null>(scenario);

  const totalStudents = getTotalStudents(studentCounts);
  const lastContactDate = contacts
    .filter((c) => c.lastContactDate)
    .sort((a, b) => (b.lastContactDate! > a.lastContactDate! ? 1 : -1))[0]?.lastContactDate;

  const navigateToTab = (tab: string) => {
    const basePath = `/scholen/${slug}`;
    const paths: Record<string, string> = {
      vergelijking: `${basePath}/vergelijking`,
      producten: `${basePath}/producten`,
      contacten: `${basePath}/contacten`,
      gesprekken: `${basePath}/gesprekken`,
    };
    navigate({ to: paths[tab] ?? basePath });
  };

  const handleStartEdit = () => {
    setEditName(schoolName);
    setEditRegion(region);
    setEditLevels([...levels]);
    setEditScenario(scenario);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!activeSchoolId) return;

    const updates: Record<string, unknown> = {};
    if (editName !== schoolName) {
      updates.name = editName;
      updates.slug = await uniqueSlug(editName, activeSchoolId);
    }
    if (editRegion !== region) updates.region = editRegion;
    if (JSON.stringify(editLevels) !== JSON.stringify(levels)) updates.levels = editLevels;
    if (editScenario !== scenario) updates.scenario = editScenario;

    if (Object.keys(updates).length > 0) {
      await updateSchoolData(activeSchoolId, updates);
      // If slug changed, navigate to new URL
      if (updates.slug) {
        navigate({ to: `/scholen/${updates.slug}` });
      }
    }
    setIsEditing(false);
  };

  const handleLevelToggle = (level: SchoolLevel) => {
    setEditLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  const actions = SMART_ACTIONS[pipelineStatus];

  return (
    <div className="p-8 max-sm:p-4">
      {/* Summary block */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-[14px] text-neutral-500">Pipeline</p>
            <div className="mt-1">
              <PipelineBadge status={pipelineStatus} />
            </div>
          </div>
          <div>
            <p className="text-[14px] text-neutral-500">Modules</p>
            <p className="text-[20px] font-semibold text-neutral-900 mt-1">
              {selectedModules.length}
            </p>
          </div>
          <div>
            <p className="text-[14px] text-neutral-500">Contacten</p>
            <p className="text-[20px] font-semibold text-neutral-900 mt-1">
              {contacts.length}
            </p>
          </div>
          <div>
            <p className="text-[14px] text-neutral-500">Laatst contact</p>
            <p className="text-[20px] font-semibold text-neutral-900 mt-1">
              {lastContactDate
                ? new Intl.DateTimeFormat('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                  }).format(new Date(lastContactDate))
                : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Snelle acties */}
      <div className="mt-6">
        <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">Snelle acties</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigateToTab(actions.primary.tab)}
            className="h-11 px-6 bg-cito-accent text-white text-[14px] font-semibold rounded-lg hover:opacity-90"
          >
            {actions.primary.label}
          </button>
          {actions.secondary.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => navigateToTab(action.tab)}
              className="h-11 px-6 text-cito-primary text-[14px] font-semibold rounded-lg hover:bg-neutral-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schoolgegevens */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-neutral-900">Schoolgegevens</h2>
          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-[14px] text-cito-primary hover:underline"
            >
              Bewerken
            </button>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          {isEditing ? (
            /* Edit mode */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] text-neutral-500 mb-1">Schoolnaam</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-11 px-4 border border-neutral-200 rounded-lg text-[16px] text-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-[14px] text-neutral-500 mb-1">Regio</label>
                  <input
                    type="text"
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    className="w-full h-11 px-4 border border-neutral-200 rounded-lg text-[16px] text-neutral-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] text-neutral-500 mb-2">Type</label>
                <div className="flex flex-wrap gap-3">
                  {SCHOOL_LEVELS.map((level) => (
                    <label key={level} className="inline-flex items-center gap-2 text-[14px]">
                      <input
                        type="checkbox"
                        checked={editLevels.includes(level)}
                        onChange={() => handleLevelToggle(level)}
                        className="rounded border-neutral-300"
                      />
                      {SCHOOL_LEVEL_LABELS[level]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[14px] text-neutral-500 mb-2">Scenario</label>
                <div className="flex gap-4">
                  {(['A', 'B'] as const).map((s) => (
                    <label key={s} className="inline-flex items-center gap-2 text-[14px]">
                      <input
                        type="radio"
                        name="scenario"
                        checked={editScenario === s}
                        onChange={() => setEditScenario(s)}
                        className="border-neutral-300"
                      />
                      {SCENARIO_LABELS[s].title}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="h-11 px-6 bg-cito-accent text-white text-[14px] font-semibold rounded-lg hover:opacity-90"
                >
                  Opslaan
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="h-11 px-6 text-cito-primary text-[14px] font-semibold rounded-lg hover:bg-neutral-50"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            /* Display mode */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-[14px] text-neutral-500">Schoolnaam</p>
                <p className="text-[16px] text-neutral-700">{schoolName}</p>
              </div>
              <div>
                <p className="text-[14px] text-neutral-500">Regio</p>
                <p className="text-[16px] text-neutral-700">{region || '--'}</p>
              </div>
              <div>
                <p className="text-[14px] text-neutral-500">Type</p>
                <p className="text-[16px] text-neutral-700">
                  {levels.map((l) => SCHOOL_LEVEL_LABELS[l]).join(' / ') || '--'}
                </p>
              </div>
              <div>
                <p className="text-[14px] text-neutral-500">Leerlingen</p>
                <p className="text-[16px] text-neutral-700">
                  {totalStudents > 0 ? totalStudents.toLocaleString('nl-NL') : '--'}
                </p>
              </div>
              <div>
                <p className="text-[14px] text-neutral-500">Scenario</p>
                <p className="text-[16px] text-neutral-700">
                  {scenario ? SCENARIO_LABELS[scenario].title : '--'}
                </p>
              </div>
              <div>
                <p className="text-[14px] text-neutral-500">Modules</p>
                <p className="text-[16px] text-neutral-700">
                  {selectedModules.length > 0
                    ? `${selectedModules.length} geselecteerd`
                    : '--'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upsell-kansen */}
      <div className="mt-6">
        <UpsellCard
          opportunities={upsellOpportunities}
          schoolSlug={slug}
          hasModuleSetups={hasModuleSetups}
        />
      </div>
    </div>
  );
}
