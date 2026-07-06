import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from './documentsClient';

// Student Hooks
export const useStudentDocumentRequests = () => {
  return useQuery({
    queryKey: ['studentDocumentRequests'],
    queryFn: documentsApi.getStudentRequests,
  });
};

export const useCreateDocumentRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentDocumentRequests'] });
    },
  });
};

export const useDownloadDocumentRequest = () => {
  return useMutation({
    mutationFn: documentsApi.downloadRequest,
    onSuccess: (blob, id) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });
};

// Admin Hooks
export const useAdminDocumentRequests = (params?: any) => {
  return useQuery({
    queryKey: ['adminDocumentRequests', params],
    queryFn: () => documentsApi.getAdminRequests(params),
  });
};

export const useUpdateDocumentRequestStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.updateRequestStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDocumentRequests'] });
    },
  });
};

export const useGenerateDocumentRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.generateRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDocumentRequests'] });
    },
  });
};
