import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllSchools, createSchool, updateSchoolData, deleteSchool, getSchoolBySlug } from '@/db/operations';
import type { SchoolRecord } from '@/db/types';

export function useSchools() {
  return useQuery({
    queryKey: ['schools'],
    queryFn: getAllSchools,
  });
}

export function useSchool(slug: string) {
  return useQuery({
    queryKey: ['school', slug],
    queryFn: () => getSchoolBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createSchool(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SchoolRecord> }) =>
      updateSchoolData(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schools'] });
      qc.invalidateQueries({ queryKey: ['school'] });
    },
  });
}

export function useDeleteSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchool(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}
