import { api } from '@/api/axios';
import type { Internship, PaginatedResponse, ApiResponse } from '@/types/models';
import type { UpdateInternshipInput } from '@/schemas/internship.schema';

// [FE-01] Typed query parameters — replaces Record<string, any>
export interface InternshipQueryParams {
  status?: 'pending' | 'validated' | 'rejected' | 'completed';
  type?: 'initiation' | 'application' | 'fin_etudes';
  page?: number;
  per_page?: number;
}

export const InternshipsService = {
  /**
   * Get paginated list of internships
   */
  async getInternships(params?: InternshipQueryParams): Promise<PaginatedResponse<Internship>> {
    const response = await api.get('/internships', { params });
    // Adjust based on the actual JSON structure (the test asserts 'success' and 'data')
    return response.data;
  },

  /**
   * Action: Validate, Reject, Assign Supervisor
   */
  async updateInternship(id: number, data: UpdateInternshipInput): Promise<void> {
    await api.put(`/internships/${id}`, data);
  },
};
