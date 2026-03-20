import { create } from 'zustand';
import type { SchoolLevel, Scenario } from '../../models/school';
import { SCHOOL_SIZE_PRESETS } from '../../data/school-profiles';

interface SchoolProfileState {
  // Step 1
  levels: SchoolLevel[];
  setLevels: (levels: SchoolLevel[]) => void;

  // Step 2
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
  setStudentCounts: (counts: Partial<Record<SchoolLevel, Record<number, number>>>) => void;

  // Step 3
  selectedModules: string[];
  setSelectedModules: (modules: string[]) => void;

  // Step 4
  scenario: Scenario | null;
  setScenario: (scenario: Scenario) => void;

  // Navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Utilities
  applyPreset: (presetId: 'klein' | 'midden' | 'groot') => void;
  reset: () => void;
}

const initialState = {
  levels: [] as SchoolLevel[],
  studentCounts: {} as Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: [] as string[],
  scenario: null as Scenario | null,
  currentStep: 0,
};

export const useSchoolProfileStore = create<SchoolProfileState>((set) => ({
  ...initialState,

  setLevels: (levels) => set({ levels }),
  setStudentCounts: (studentCounts) => set({ studentCounts }),
  setSelectedModules: (selectedModules) => set({ selectedModules }),
  setScenario: (scenario) => set({ scenario }),
  setCurrentStep: (currentStep) => set({ currentStep }),

  applyPreset: (presetId) => {
    const preset = SCHOOL_SIZE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const levels = Object.keys(preset.studentCounts) as SchoolLevel[];
    set({
      studentCounts: preset.studentCounts,
      levels,
    });
  },

  reset: () => set(initialState),
}));
