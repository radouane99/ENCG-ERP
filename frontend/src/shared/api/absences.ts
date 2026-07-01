import axios from 'axios';
import { useAuthStore } from '@stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

export const absencesApi = {
  getJustifications: async (params?: any) => {
    const response = await api.get('/admin/absences-justifications', { params });
    return response.data;
  },
  updateStatus: async (id: number, status: 'approved' | 'rejected', rejection_reason?: string) => {
    const response = await api.patch(`/admin/absences-justifications/${id}/status`, { status, rejection_reason });
    return response.data;
  },
  deleteJustification: async (id: number) => {
    const response = await api.delete(`/admin/absences-justifications/${id}`);
    return response.data;
  },
};
