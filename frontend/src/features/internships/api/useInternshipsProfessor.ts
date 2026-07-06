import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Internship, Soutenance } from '../model/types';

const api = axios.create({
  baseURL: '/api/professor/internships',
  withCredentials: true,
});

export const useProfessorInternships = () => {
  return useQuery({
    queryKey: ['professorInternships'],
    queryFn: async () => {
      const { data } = await api.get<{ internships: Internship[] }>('/supervised');
      return data.internships;
    },
  });
};

export const useEvaluateInternship = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grade, remarks }: { id: number; grade: number; remarks?: string }) => {
      const { data } = await api.post<{ soutenance: Soutenance }>(`/soutenances/${id}/evaluate`, { grade, remarks });
      return data.soutenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professorInternships'] });
    },
  });
};
