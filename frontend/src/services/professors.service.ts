import { api } from '@/api/axios';
import type { Professor, PaginatedResponse, ApiResponse } from '@/types/models';
import type { StoreProfessorInput, UpdateProfessorInput } from '@/schemas/professor.schema';

export const ProfessorsService = {
  /**
   * Get paginated list of professors
   */
  async getProfessors(params?: Record<string, any>): Promise<PaginatedResponse<Professor>> {
    const response = await api.get('/professors', { params });
    return response.data;
  },

  /**
   * Get single professor by ID
   */
  async getProfessor(id: number): Promise<Professor> {
    const response = await api.get<ApiResponse<Professor>>(`/professors/${id}`);
    return response.data.data;
  },

  /**
   * Create a new professor
   */
  async createProfessor(data: StoreProfessorInput): Promise<Professor> {
    const response = await api.post<ApiResponse<Professor>>('/professors', data);
    return response.data.data;
  },

  /**
   * Update an existing professor
   */
  async updateProfessor(id: number, data: UpdateProfessorInput): Promise<Professor> {
    const response = await api.put<ApiResponse<Professor>>(`/professors/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete a professor
   */
  async deleteProfessor(id: number): Promise<void> {
    await api.delete(`/professors/${id}`);
  },
};
