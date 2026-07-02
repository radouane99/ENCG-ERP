import axios from 'axios';
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
  getStudents: async (params?: any) => {
    const response = await api.get('/students', { params });
    return response.data;
  },
  getStudent: async (id: number) => {
    const response = await api.get(`/students/${id}`);
    return response.data.data;
  },
  createStudent: async (data: any) => {
    const response = await api.post('/students', data);
    return response.data;
  },
  updateStudent: async (id: number, data: any) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },
  deleteStudent: async (id: number) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};
