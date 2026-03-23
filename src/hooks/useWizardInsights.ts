import { useSchoolProfileStore } from '@/features/school-profile/store';
import { getTotalStudents } from '@/engine/price-comparison';

export function useWizardInsights() {
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const totalStudents = getTotalStudents(studentCounts);

  // TODO: implement schijnvoordeel detection
  return {
    schijnvoordelen: [] as string[],
    totalStudents,
  };
}
