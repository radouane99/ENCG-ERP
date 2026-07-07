import { axiosInstance } from '@shared/api/axiosInstance';

export interface AnalyticsData {
  document_requests: {
    total: number;
    pending_count: number;
    status_breakdown: Array<{ name: string; value: number }>;
    monthly_trend: Array<{ month: string; count: number }>;
  };
  academic_projects: {
    total: number;
    active_count: number;
    completion_rate: number;
    type_distribution: Array<{ name: string; value: number }>;
  };
  student_activity: {
    total_active: number;
    filiere_breakdown: Array<{ name: string; value: number }>;
  };
}

export const analyticsApi = {
  getAdminAnalytics: async (): Promise<AnalyticsData> => {
    const response = await axiosInstance.get('/api/admin/analytics');
    return response.data.data;
  },
};
