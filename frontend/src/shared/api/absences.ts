import api from '@shared/lib/api';
import { PaginationParams } from '../../types/models';

export const absencesApi = {
  getJustifications: async (params?: PaginationParams) => {
    const response = await api.get('/admin/absences-justifications', { params });
    return response.data;
  },
  updateStatus: async (id: number, status: 'approved' | 'rejected', rejection_reason?: string) => {
    const response = await api.patch(`/admin/absences-justifications/${id}/status`, { status, rejection_reason });
    return response.data;
  },
  deleteJustification: async (id: number) => {
    const response = await api.delete(`/admin/absences-justifications/${id}`);
    return response.data;
  },
};
