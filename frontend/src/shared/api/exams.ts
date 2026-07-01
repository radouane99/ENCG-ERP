import axios from 'axios';
import { useAuthStore } from '@stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor to add the auth token
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

export const examsApi = {
  // Retakes
  getRetakes: async () => {
    const response = await api.get('/retakes');
    return response.data.data;
  },
  updateRetakeStatus: async (id: number, status: 'Accordé' | 'Refusé') => {
    const response = await api.patch(`/retakes/${id}/status`, { status });
    return response.data;
  },

  // Convocations
  getStudentConvocations: async (examId: number) => {
    const response = await api.get(`/exam-planning/${examId}/live-stats`); // Temp reuse
    return response.data;
  },
  generateConvocations: async (examId: number) => {
    const response = await api.post(`/exam-planning/${examId}/generate-convocations`);
    return response.data;
  },
  autoAssignProctors: async (sessionId: number) => {
    const response = await api.post(`/exam-planning/${sessionId}/auto-assign-proctors`);
    return response.data;
  },

  // Professor Availability
  getProfessorAvailabilities: async () => {
    const response = await api.get('/professor-availability');
    return response.data.data;
  },
  alertProfessors: async (professorIds: number[]) => {
    const response = await api.post('/professor-availability/alert', { professor_ids: professorIds });
    return response.data;
  },

  // Schedule Change Requests
  getScheduleChangeRequests: async () => {
    const response = await api.get('/schedule-change-requests');
    return response.data.data;
  },
  updateScheduleChangeStatus: async (id: number, status: 'approved' | 'rejected') => {
    const response = await api.patch(`/schedule-change-requests/${id}/status`, { status });
    return response.data;
  }
};
