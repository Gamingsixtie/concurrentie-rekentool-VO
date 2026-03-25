/**
 * Step 2: Variant-selectie — per-module selection of DIA package or JIJ tier.
 * Pre-fills from moduleSetups as base (D-07), overlays AI extraction results.
 * Shows smart suggestions via "Aanbevolen" badge.
 */

import { useEffect, useMemo } from 'react';
import { useWizardStore } from './wizard-store';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { MODULE_CATALOG } from '@/models/modules';
import { DIA_PACKAGES } from '@/data/providers/dia';
import { JIJ_LICENSE_TIERS } from '@/data/providers/jij';
import { suggestDiaPackage, suggestJijTier } from './variant-suggestions';
import { getTotalStudents } from '@/engine/price-comparison';
import { VariantCard } from './VariantCard';
import type { ModuleVariantSelection, VariantConfidence } from './types';

// ─── Confidence indicator ─────────────────────────────────────────────────────

const CONFIDENCE_CONFIG: Record<VariantConfidence, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  high: { label: 'Uit notities afgeleid', dotClass: 'bg-green-500', bgClass: 'bg-green-50', textClass: 'text-green-800' },
  low: { label: 'Onzeker -- controleer', dotClass: 'bg-orange-500', bgClass: 'bg-orange-50', textClass: 'text-orange-800' },
  unknown: { label: 'Niet bekend', dotClass: 'bg-neutral-400', bgClass: 'bg-neutral-50', textClass: 'text-neutral-500' },
};

function ConfidenceBadge({ confidence }: { confidence: VariantConfidence }) {
  const config = CONFIDENCE_CONFIG[confidence];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${config.bgClass} ${config.textClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

// ─── Provider radio group ─────────────────────────────────────────────────────

function ProviderRadio({
  moduleId,
  selected,
  onChange,
}: {
  moduleId: string;
  selected: 'dia' | 'jij' | 'geen';
  onChange: (provider: 'dia' | 'jij' | 'geen') => void;
}) {
  const options: Array<{ value: 'dia' | 'jij' | 'geen'; label: string }> = [
    { value: 'dia', label: 'DIA' },
    { value: 'jij', label: 'JIJ' },
    { value: 'geen', label: 'Geen' },
  ];

  return (
    <div className="flex gap-2" role="radiogroup" aria-label={`Provider selectie voor ${moduleId}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={selected === opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors min-h-[44px]
            ${selected === opt.value
              ? 'bg-cito-primary text-white border-cito-primary'
              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WizardStep2Variants() {
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);

  const variantSelections = useWizardStore((s) => s.variantSelections);
  const extractionResult = useWizardStore((s) => s.extractionResult);
  const setVariantSelections = useWizardStore((s) => s.setVariantSelections);
  const updateVariantSelection = useWizardStore((s) => s.updateVariantSelection);

  const totalStudents = useMemo(() => getTotalStudents(studentCounts), [studentCounts]);

  // Pre-fill logic on mount: moduleSetups as base (D-07), AI extraction overlay
  useEffect(() => {
    // Only pre-fill if variantSelections is empty or doesn't match current modules
    const existingIds = new Set(variantSelections.map((v) => v.moduleId));
    const needsInit = selectedModules.some((id) => !existingIds.has(id));
    if (!needsInit && variantSelections.length > 0) return;

    const selections: ModuleVariantSelection[] = selectedModules.map((moduleId) => {
      // Layer 1: Base from moduleSetups (D-07 -- startpunt)
      const setup = moduleSetups.find((s) => s.moduleId === moduleId);
      let provider: 'dia' | 'jij' | 'geen' = 'geen';
      let variantId: string | null = null;
      let confidence: VariantConfidence = 'unknown';

      if (setup && (setup.currentProvider === 'dia' || setup.currentProvider === 'jij')) {
        provider = setup.currentProvider;
      }

      // Layer 2: AI extraction overlay (higher priority when available)
      const extraction = extractionResult?.selections.find((s) => s.moduleId === moduleId);
      if (extraction && (extraction.confidence === 'high' || extraction.confidence === 'low')) {
        provider = extraction.provider;
        variantId = extraction.variantId;
        confidence = extraction.confidence;
      }

      return { moduleId, provider, variantId, confidence };
    });

    setVariantSelections(selections);
  }, [selectedModules, moduleSetups, extractionResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smart suggestions
  const suggestedDia = useMemo(() => suggestDiaPackage(selectedModules), [selectedModules]);
  const suggestedJij = useMemo(() => suggestJijTier(totalStudents), [totalStudents]);

  const handleProviderChange = (moduleId: string, provider: 'dia' | 'jij' | 'geen') => {
    const existing = variantSelections.find((v) => v.moduleId === moduleId);
    updateVariantSelection(moduleId, {
      provider,
      variantId: null,
      confidence: existing?.confidence ?? 'unknown',
    });
  };

  const handleVariantClick = (moduleId: string, variantId: string) => {
    updateVariantSelection(moduleId, { variantId });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-[15px] font-semibold text-neutral-900">
        Bevestig de variant per module
      </h3>

      {selectedModules.map((moduleId) => {
        const moduleDef = MODULE_CATALOG.find((m) => m.id === moduleId);
        const selection = variantSelections.find((v) => v.moduleId === moduleId);
        const provider = selection?.provider ?? 'geen';
        const confidence = selection?.confidence ?? 'unknown';

        // Filter DIA packages that include this module
        const applicablePackages = DIA_PACKAGES.filter((pkg) =>
          pkg.includedModuleIds.includes(moduleId),
        );

        return (
          <div key={moduleId} className="border border-neutral-200 rounded-lg p-4">
            {/* Module header with confidence badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-semibold text-neutral-900">
                {moduleDef?.name ?? moduleId}
              </span>
              <ConfidenceBadge confidence={confidence} />
            </div>

            {/* Provider radio */}
            <div className="mb-4">
              <ProviderRadio
                moduleId={moduleId}
                selected={provider}
                onChange={(p) => handleProviderChange(moduleId, p)}
              />
            </div>

            {/* DIA variant cards */}
            {provider === 'dia' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {applicablePackages.map((pkg) => {
                  const moduleNames = pkg.includedModuleIds.map((id) => {
                    const mod = MODULE_CATALOG.find((m) => m.id === id);
                    return mod?.name ?? id;
                  });

                  return (
                    <VariantCard
                      key={pkg.id}
                      type="dia-package"
                      id={pkg.id}
                      name={pkg.name}
                      priceLabel={`\u20AC${pkg.pricePerStudent.toFixed(2)}/leerling/jaar`}
                      description={pkg.description ?? `Bevat ${pkg.includedModuleIds.length} module(s)`}
                      includedModules={moduleNames}
                      isSelected={selection?.variantId === pkg.id}
                      isRecommended={suggestedDia?.id === pkg.id}
                      onClick={() => handleVariantClick(moduleId, pkg.id)}
                    />
                  );
                })}
              </div>
            )}

            {/* JIJ variant cards */}
            {provider === 'jij' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {JIJ_LICENSE_TIERS.map((tier) => (
                  <VariantCard
                    key={String(tier.tier)}
                    type="jij-tier"
                    id={String(tier.tier)}
                    name={tier.label}
                    priceLabel={`\u20AC${tier.annualFee.toLocaleString('nl-NL')}/jaar + \u20AC${tier.pricePerTest.toFixed(2)}/afname`}
                    description={`${tier.minAdministrations.toLocaleString('nl-NL')}\u2013${tier.maxAdministrations.toLocaleString('nl-NL')} afnames per jaar`}
                    isSelected={selection?.variantId === String(tier.tier)}
                    isRecommended={suggestedJij.tier === tier.tier}
                    onClick={() => handleVariantClick(moduleId, String(tier.tier))}
                  />
                ))}
              </div>
            )}

            {/* Geen provider selected */}
            {provider === 'geen' && (
              <p className="text-sm text-neutral-500 italic">
                Selecteer welk aanbod de concurrent gebruikt voor deze module.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
