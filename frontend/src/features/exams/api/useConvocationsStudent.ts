import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Convocation } from '../model/types';

export const useStudentConvocations = () => {
  return useQuery({
    queryKey: ['studentConvocations'],
    queryFn: async () => {
      const { data } = await api.get<{ convocations: Convocation[] }>('/v1/student-portal/convocations');
      return data.convocations;
    },
  });
};

export const useDownloadConvocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (convocationId: number) => {
      const { data } = await api.get<{ pdf_url: string }>(`/v1/student-portal/convocations/${convocationId}/download`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentConvocations'] });
    },
  });
};
