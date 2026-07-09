import { api } from '@/api/axios';
import type { AttendanceSession, PaginatedResponse } from '@/types/models';

// [FE-01] Typed query parameters and response — replaces any
export interface AttendanceQueryParams {
  search?: string;
  status?: 'active' | 'closed' | 'cancelled';
  page?: number;
  per_page?: number;
}

export interface AttendanceListResponse {
  data: AttendanceSession[];
  stats?: {
    total: number;
    active: number;
    closed: number;
  };
}

export const AttendancesService = {
  /**
   * Get paginated list of attendance sessions
   */
  async getSessions(params?: AttendanceQueryParams): Promise<AttendanceListResponse> {
    const response = await api.get('/attendances', { params });
    return response.data;
  },

  /**
   * Delete an attendance session
   */
  async deleteSession(id: number): Promise<void> {
    await api.delete(`/attendances/${id}`);
  },
};
