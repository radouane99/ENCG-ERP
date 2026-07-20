import axios from 'axios';
import type { AcademicYearPayload } from '../../types/models';
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

export const academicApi = {
  // Academic Years
  getAcademicYears: async () => {
    const response = await api.get('/academic-years');
    return response.data.data;
  },
  createAcademicYear: async (data: AcademicYearPayload) => {
    const response = await api.post('/academic-years', data);
    return response.data;
  },
  updateAcademicYear: async (id: number, data: Partial<AcademicYearPayload>) => {
    const response = await api.put(`/academic-years/${id}`, data);
    return response.data;
  },
  deleteAcademicYear: async (id: number) => {
    const response = await api.delete(`/academic-years/${id}`);
    return response.data;
  },

  // Filieres
  getFilieres: async () => {
    const response = await api.get('/filieres');
    return response.data.data;
  },
  
  // Modules
  getModules: async () => {
    const response = await api.get('/modules');
    return response.data.data;
  },
  
  // Groups
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data.data;
  },

  // Rooms
  getRooms: async () => {
    const response = await api.get('/rooms');
    return response.data.data;
  },

  // Exam Sessions
  getExamSessions: async () => {
    const response = await api.get('/exam-sessions');
    return response.data.data;
  },
  updateExamSession: async (id: number, data: any) => {
    const response = await api.put(`/exam-sessions/${id}`, data);
    return response.data;
  }
};
