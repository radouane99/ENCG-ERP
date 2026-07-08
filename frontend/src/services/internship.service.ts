import { api } from '@/api/axios';
import type { Internship, PaginatedResponse, ApiResponse } from '@/types/models';
import type { StoreInternshipInput } from '@/schemas/internship.schema';

export const InternshipService = {
  getStudentInternships: async (page = 1) => {
    const response = await api.get<PaginatedResponse<Internship>>('/api/internships', {
      params: { page },
    });
    return response.data;
  },

  createInternship: async (data: StoreInternshipInput) => {
    const response = await api.post<ApiResponse<Internship>>('/api/internships', data);
    return response.data;
  },
};
