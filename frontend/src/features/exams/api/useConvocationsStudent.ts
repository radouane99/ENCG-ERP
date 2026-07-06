import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Convocation } from '../model/types';

const api = axios.create({
  baseURL: '/api/v1/student-portal/convocations',
  withCredentials: true,
});

export const useStudentConvocations = () => {
  return useQuery({
    queryKey: ['studentConvocations'],
    queryFn: async () => {
      const { data } = await api.get<{ convocations: Convocation[] }>('/');
      return data.convocations;
    },
  });
};

export const useDownloadConvocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (convocationId: number) => {
      const { data } = await api.get<{ pdf_url: string }>(`/${convocationId}/download`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentConvocations'] });
    },
  });
};
