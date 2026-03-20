import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { moduleSelectionSchema, type ModuleSelectionData } from '../schemas/step3-schema.ts';
import { MODULE_CATALOG, MODULE_CATEGORIES, type ModuleCategory } from '../../../models/modules.ts';
import { useSchoolProfileStore } from '../store.ts';
import StepContainer from '../../../components/wizard/StepContainer.tsx';
import { forwardRef, useImperativeHandle } from 'react';
import type { WizardStepRef } from './WizardStep1.tsx';

const CATEGORY_ORDER: ModuleCategory[] = ['leerlingvolgsysteem', 'overige-instrumenten'];

const WizardStep3 = forwardRef<WizardStepRef>(function WizardStep3(_props, ref) {
  const { selectedModules, setSelectedModules } = useSchoolProfileStore();

  const {
    watch,
    setValue,
    handleSubmit,
  } = useForm<ModuleSelectionData>({
    resolver: zodResolver(moduleSelectionSchema),
    defaultValues: {
      selectedModules: selectedModules,
    },
  });

  const currentModules = watch('selectedModules');

  const toggleModule = (moduleId: string) => {
    const updated = currentModules.includes(moduleId)
      ? currentModules.filter((id) => id !== moduleId)
      : [...currentModules, moduleId];
    setValue('selectedModules', updated);
  };

  useImperativeHandle(ref, () => ({
    submit: () =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          (data) => {
            setSelectedModules(data.selectedModules);
            resolve(true);
          },
          () => {
            resolve(false);
          },
        )();
      }),
  }));

  return (
    <StepContainer title="Welke toetsen en instrumenten gebruikt uw school?">
      {CATEGORY_ORDER.map((category, catIndex) => {
        const modules = MODULE_CATALOG.filter((m) => m.category === category);
        return (
          <div key={category} className={catIndex > 0 ? 'mt-6' : ''}>
            <h3 className="text-[16px] font-semibold text-cito-primary mb-4">
              {MODULE_CATEGORIES[category]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules.map((mod) => {
                const isSelected = currentModules.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className={`
                      text-left rounded-lg p-4 shadow-sm transition-colors
                      flex items-start justify-between gap-3
                      ${isSelected
                        ? 'border-2 border-cito-accent bg-[#fff7ed]'
                        : 'border border-neutral-200 bg-white'
                      }
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-semibold text-neutral-900">
                        {mod.name}
                      </div>
                      <div className="text-[14px] text-neutral-500 mt-1">
                        {mod.description}
                      </div>
                      {mod.separateLicense && (
                        <div className="text-[14px] italic text-neutral-500 mt-1">
                          Losse licentie
                        </div>
                      )}
                      {mod.differentiator && (
                        <div className="text-[14px] text-cito-primary mt-1">
                          &bull; {mod.differentiator}
                        </div>
                      )}
                    </div>

                    {/* Toggle pill */}
                    <div
                      className={`
                        relative flex-shrink-0 w-11 h-6 rounded-full transition-colors mt-1
                        ${isSelected ? 'bg-cito-primary' : 'bg-neutral-200'}
                      `}
                      aria-hidden="true"
                    >
                      <div
                        className={`
                          absolute top-[2px] w-5 h-5 rounded-full bg-white shadow transition-transform
                          ${isSelected ? 'translate-x-[22px]' : 'translate-x-[2px]'}
                        `}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {currentModules.length === 0 && (
        <p className="mt-4 text-[14px] text-neutral-500">
          U kunt altijd later modules toevoegen of verwijderen
        </p>
      )}
    </StepContainer>
  );
});

export default WizardStep3;
