import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Internship, InternshipDocument } from '../model/types';

export const useStudentInternships = () => {
  return useQuery({
    queryKey: ['studentInternships'],
    queryFn: async () => {
      const { data } = await api.get('/v1/student-portal/internships');
      return data.internships ?? data.data ?? [];
    },
  });
};

export const useApplyInternship = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Internship>) => {
      const { data } = await api.post<{ internship: Internship }>('/v1/student-portal/internships', payload);
      return data.internship;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentInternships'] });
    },
  });
};

export const useUploadInternshipDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ internshipId, file, documentType }: { internshipId: number; file: File; documentType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);

      const { data } = await api.post<{ document: InternshipDocument }>(`/v1/student-portal/internships/${internshipId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentInternships'] });
    },
  });
};
