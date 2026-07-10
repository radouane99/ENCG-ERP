import axios from 'axios';
import { PaginationParams, Student } from '../../types/models';
import { useAuthStore } from '@stores/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const studentsApi = {
  getStudents: async (params?: PaginationParams) => {
    const response = await api.get('/students', { params });
    return response.data as ApiResponse<Student[]>;
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
