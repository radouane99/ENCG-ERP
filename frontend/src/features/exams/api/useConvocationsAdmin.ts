import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Convocation } from '../model/types';

export const useAdminConvocations = (examId: number) => {
  return useQuery({
    queryKey: ['adminConvocations', examId],
    queryFn: async () => {
      const { data } = await api.get<{ convocations: Convocation[] }>(`/admin/exams/${examId}/convocations`);
      return data.convocations;
    },
    enabled: !!examId,
  });
};

export const useGenerateConvocations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ examId, roomId }: { examId: number; roomId: number }) => {
      const { data } = await api.post<{ message: string }>(`/admin/exams/${examId}/convocations/generate`, { room_id: roomId });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminConvocations', variables.examId] });
    },
  });
};

export const usePublishConvocations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (examId: number) => {
      const { data } = await api.post<{ message: string }>(`/admin/exams/${examId}/convocations/publish`);
      return data;
    },
    onSuccess: (_, examId) => {
      queryClient.invalidateQueries({ queryKey: ['adminConvocations', examId] });
    },
  });
};
