import { api } from '@/api/axios';
import type { AttendanceSession, PaginatedResponse } from '@/types/models';

export const AttendancesService = {
  /**
   * Get paginated list of attendance sessions
   */
  async getSessions(params?: Record<string, any>): Promise<{ data: AttendanceSession[]; stats?: any }> {
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
