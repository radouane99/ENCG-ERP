import axios from 'axios';
import type { PaginationParams } from '../../types/models';
import { useAuthStore } from '@stores/authStore';

const api = axios.create({
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

export const analyticsApi = {
  getAtRiskStudents: async (params?: PaginationParams) => {
    const response = await api.get('/analytics/at-risk-students', { params });
    return response.data;
  },
};
