import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { GlobalAbsenceStats, AbsenceJustification } from '../model/types';

export const useAdminAbsenceStats = () => {
  return useQuery({
    queryKey: ['adminAbsenceStats'],
    queryFn: async () => {
      const { data } = await api.get<{ stats: GlobalAbsenceStats }>('/admin/absences/stats');
      return data.stats;
    },
  });
};

export const useReviewJustification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: number, status: 'approved' | 'rejected', rejection_reason?: string }) => {
      const { data } = await api.post<{ message: string, justification: AbsenceJustification }>(`/admin/absences/justifications/${id}/review`, { status, rejection_reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAbsenceStats'] });
      queryClient.invalidateQueries({ queryKey: ['justifications'] });
    },
  });
};
