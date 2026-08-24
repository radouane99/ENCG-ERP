import api from '@shared/lib/api';
import { PaginationParams, Student, ApiResponse, PaginatedResponse } from '../../types/models';

export { api };

export const studentsApi = {
  getStudents: async (params?: PaginationParams) => {
    const response = await api.get('/students', { params });
    return response.data as PaginatedResponse<Student>;
  },
  getStudent: async (id: string | number) => {
    const response = await api.get(`/students/${id}`);
    return response.data.data;
  },
  createStudent: async (data: Student) => {
    const response = await api.post('/students', data);
    return response.data as ApiResponse<Student>;
  },
  updateStudent: async (id: string | number, data: Partial<Student>) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data as ApiResponse<Student>;
  },
  deleteStudent: async (id: string | number) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};
