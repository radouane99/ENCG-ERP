import { api } from '@/api/axios';
import type { Internship, PaginatedResponse, ApiResponse } from '@/types/models';
import type { UpdateInternshipInput } from '@/schemas/internship.schema';

export const InternshipsService = {
  /**
   * Get paginated list of internships
   */
  async getInternships(params?: Record<string, any>): Promise<PaginatedResponse<Internship>> {
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
