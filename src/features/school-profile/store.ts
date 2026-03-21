import { create } from 'zustand';
import type { SchoolLevel, Scenario, ModuleCurrentSetup } from '../../models/school';
import { SCHOOL_SIZE_PRESETS } from '../../data/school-profiles';
import type { SchoolRecord } from '@/db/types';

interface SchoolProfileState {
  // Multi-school identity
  activeSchoolId: number | null;
  schoolName: string;
  setSchoolName: (name: string) => void;

  // Step 1
  levels: SchoolLevel[];
  setLevels: (levels: SchoolLevel[]) => void;

  // Step 2
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
  setStudentCounts: (counts: Partial<Record<SchoolLevel, Record<number, number>>>) => void;

  // Step 3
  selectedModules: string[];
  setSelectedModules: (modules: string[]) => void;

  // Step 4 — Huidige situatie per module
  moduleSetups: ModuleCurrentSetup[];
  setModuleSetups: (setups: ModuleCurrentSetup[]) => void;

  // Step 5
  scenario: Scenario | null;
  setScenario: (scenario: Scenario) => void;

  // Navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Utilities
  applyPreset: (presetId: 'klein' | 'midden' | 'groot') => void;
  hydrate: (record: SchoolRecord) => void;
  clear: () => void;
  reset: () => void;
}

const initialState = {
  activeSchoolId: null as number | null,
  schoolName: '',
  levels: [] as SchoolLevel[],
  studentCounts: {} as Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: [] as string[],
  moduleSetups: [] as ModuleCurrentSetup[],
  scenario: null as Scenario | null,
  currentStep: 0,
};

export const useSchoolProfileStore = create<SchoolProfileState>()(
  (set) => ({
    ...initialState,

    setSchoolName: (schoolName) => set({ schoolName }),
    setLevels: (levels) => set({ levels }),
    setStudentCounts: (studentCounts) => set({ studentCounts }),

    setSelectedModules: (selectedModules) =>
      set((state) => {
        const existing = new Map(state.moduleSetups.map((s) => [s.moduleId, s]));
        const synced: ModuleCurrentSetup[] = selectedModules.map((moduleId) =>
          existing.get(moduleId) ?? {
            moduleId,
            currentProvider: 'geen',
            pricePerStudent: null,
          },
        );
        return { selectedModules, moduleSetups: synced };
      }),

    setModuleSetups: (moduleSetups) => set({ moduleSetups }),
    setScenario: (scenario) => set({ scenario }),
    setCurrentStep: (currentStep) => set({ currentStep }),

    applyPreset: (presetId) => {
      const preset = SCHOOL_SIZE_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      set((state) => {
        const newCounts = { ...state.studentCounts };
        for (const level of state.levels) {
          const presetData = preset.studentCounts[level];
          if (presetData) {
            newCounts[level] = presetData;
          }
        }
        return { studentCounts: newCounts };
      });
    },

    hydrate: (record: SchoolRecord) => set({
      activeSchoolId: record.id ?? null,
      schoolName: record.name,
      levels: record.levels,
      studentCounts: record.studentCounts,
      selectedModules: record.selectedModules,
      moduleSetups: record.moduleSetups,
      scenario: record.scenario,
      currentStep: record.completedSteps.length > 0
        ? Math.min(Math.max(...record.completedSteps) + 1, 4)
        : 0,
    }),

    clear: () => set(initialState),

    reset: () => set(initialState),
  }),
);
