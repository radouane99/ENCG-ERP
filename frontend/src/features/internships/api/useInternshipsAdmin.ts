import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Internship, Soutenance } from '../model/types';

const api = axios.create({
  baseURL: '/api/admin/internships',
  withCredentials: true,
});

export const useAdminInternships = () => {
  return useQuery({
    queryKey: ['adminInternships'],
    queryFn: async () => {
      const { data } = await api.get<{ internships: Internship[] }>('/');
      return data.internships;
    },
  });
};

export const useValidateInternship = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, professor_supervisor_id }: { id: number; status: 'approved' | 'rejected'; professor_supervisor_id?: number }) => {
      const { data } = await api.post<{ internship: Internship }>(`/${id}/validate`, { status, professor_supervisor_id });
      return data.internship;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInternships'] });
    },
  });
};

export const useScheduleSoutenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { internship_id: number; date_time: string; room_id: number; president_id: number; examiner_id: number }) => {
      const res = await api.post<{ soutenance: Soutenance }>('/soutenances', data);
      return res.data.soutenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInternships'] });
    },
  });
};
