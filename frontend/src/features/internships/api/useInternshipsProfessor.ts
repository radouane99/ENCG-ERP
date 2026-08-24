import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Internship, Soutenance } from '../model/types';

export const useProfessorInternships = () => {
  return useQuery({
    queryKey: ['professorInternships'],
    queryFn: async () => {
      const { data } = await api.get<{ internships: Internship[] }>('/professor/internships/supervised');
      return data.internships;
    },
  });
};

export const useEvaluateInternship = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grade, remarks }: { id: number; grade: number; remarks?: string }) => {
      const { data } = await api.post<{ soutenance: Soutenance }>(`/professor/internships/soutenances/${id}/evaluate`, { grade, remarks });
      return data.soutenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professorInternships'] });
    },
  });
};
