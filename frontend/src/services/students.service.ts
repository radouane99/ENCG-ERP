import { api } from '@/api/axios';
import type { Student, PaginatedResponse, ApiResponse } from '@/types/models';
import type { StoreStudentInput, UpdateStudentInput } from '@/schemas/student.schema';

export const StudentsService = {
  /**
   * Get paginated list of students
   */
  async getStudents(params?: Record<string, any>): Promise<PaginatedResponse<Student>> {
    const response = await api.get('/students', { params });
    return response.data;
  },

  /**
   * Get single student by ID
   */
  async getStudent(id: number): Promise<Student> {
    const response = await api.get<ApiResponse<Student>>(`/students/${id}`);
    return response.data.data;
  },

  /**
   * Create a new student
   */
  async createStudent(data: StoreStudentInput): Promise<Student> {
    const response = await api.post<ApiResponse<Student>>('/students', data);
    return response.data.data;
  },

  /**
   * Update an existing student
   */
  async updateStudent(id: number, data: UpdateStudentInput): Promise<Student> {
    const response = await api.put<ApiResponse<Student>>(`/students/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete a student
   */
  async deleteStudent(id: number): Promise<void> {
    await api.delete(`/students/${id}`);
  },
};
