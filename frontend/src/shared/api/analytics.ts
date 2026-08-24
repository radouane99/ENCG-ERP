import api from '@shared/lib/api';
import type { PaginationParams } from '../../types/models';

export const analyticsApi = {
  getAtRiskStudents: async (params?: PaginationParams) => {
    const response = await api.get('/analytics/at-risk-students', { params });
    return response.data;
  },
};
