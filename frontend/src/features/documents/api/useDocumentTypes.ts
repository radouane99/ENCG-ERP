import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from './documentsClient';

export const useDocumentTypes = () => {
  return useQuery({
    queryKey: ['documentTypes'],
    queryFn: documentsApi.getDocumentTypes,
  });
};

export const useCreateDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.createDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    },
  });
};
