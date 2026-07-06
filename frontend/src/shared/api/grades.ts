import axios from 'axios';
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

export const gradesApi = {
  getGradeGrid: async (moduleId: number, groupId: number) => {
    const response = await api.get(`/v1/professor/grades/grid`, {
      params: { module_id: moduleId, group_id: groupId }
    });
    return response.data;
  },
  
  saveGrades: async (moduleId: number, groupId: number, updates: any[]) => {
    const response = await api.post(`/v1/professor/grades/save`, {
      module_id: moduleId,
      group_id: groupId,
      updates
    });
    return response.data;
  }
};
