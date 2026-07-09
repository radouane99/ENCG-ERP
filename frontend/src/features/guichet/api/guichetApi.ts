import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { DocumentRequest, DocumentType } from '../model/types';

const api = axios.create({
  baseURL: '/api',
  // withCredentials: true, // Assuming Sanctum
});

export const guichetKeys = {
  all: ['guichet'] as const,
  studentRequests: () => [...guichetKeys.all, 'student-requests'] as const,
  adminRequests: () => [...guichetKeys.all, 'admin-requests'] as const,
  documentTypes: () => [...guichetKeys.all, 'document-types'] as const,
};

// --- API Calls ---
const fetchDocumentTypes = async (): Promise<DocumentType[]> => {
  // In a real app, you might have a public or specific endpoint for active types
  const { data } = await api.get('/document-types');
  return data.data || data;
};

const fetchStudentRequests = async (): Promise<DocumentRequest[]> => {
  const { data } = await api.get('/student/document-requests');
  return data.data;
};

const fetchAdminRequests = async (): Promise<DocumentRequest[]> => {
  const { data } = await api.get('/admin/document-requests');
  return data.data || data; // Pagination might return data.data
};

const createDocumentRequest = async (document_type_id: number) => {
  const { data } = await api.post('/student/document-requests', { document_type_id });
  return data.data;
};

const updateRequestStatus = async ({
  id,
  status,
  admin_notes,
}: {
  id: number;
  status: string;
  admin_notes?: string | null;
}) => {
  const { data } = await api.patch(`/admin/document-requests/${id}/status`, {
    status,
    admin_notes,
  });
  return data.data;
};

// --- Hooks ---
export const useDocumentTypes = () => {
  return useQuery({
    queryKey: guichetKeys.documentTypes(),
    queryFn: fetchDocumentTypes,
  });
};

export const useStudentRequests = () => {
  return useQuery({
    queryKey: guichetKeys.studentRequests(),
    queryFn: fetchStudentRequests,
  });
};

export const useAdminRequests = () => {
  return useQuery({
    queryKey: guichetKeys.adminRequests(),
    queryFn: fetchAdminRequests,
  });
};

export const useCreateDocumentRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDocumentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guichetKeys.studentRequests() });
    },
  });
};

export const useUpdateDocumentRequestStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRequestStatus,
    onMutate: async (newStatusUpdate) => {
      await queryClient.cancelQueries({ queryKey: guichetKeys.adminRequests() });
      const previousRequests = queryClient.getQueryData<DocumentRequest[]>(guichetKeys.adminRequests());

      // Optimistic update
      if (previousRequests) {
        queryClient.setQueryData<DocumentRequest[]>(
          guichetKeys.adminRequests(),
          previousRequests.map((req) =>
            req.id === newStatusUpdate.id
              ? { ...req, status: newStatusUpdate.status as any, admin_notes: newStatusUpdate.admin_notes }
              : req
          )
        );
      }
      return { previousRequests };
    },
    onError: (_err, _newUpdate, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(guichetKeys.adminRequests(), context.previousRequests);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: guichetKeys.adminRequests() });
    },
  });
};
