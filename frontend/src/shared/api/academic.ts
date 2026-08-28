import api from '@shared/lib/api';
import type { AcademicYearPayload } from '../../types/models';

function unwrapList(payload: unknown): any[] {
  if (Array.isArray(payload)) {
    return payload
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: any[] }).data
  }
  return []
}

export const academicApi = {
  // Academic Years
  getAcademicYears: async () => {
    const response = await api.get('/academic-years');
    return unwrapList(response.data?.data ?? response.data);
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
  createExamSession: async (data: any) => {
    const response = await api.post('/exam-sessions', data);
    return response.data;
  },
  updateExamSession: async (id: number, data: any) => {
    const response = await api.put(`/exam-sessions/${id}`, data);
    return response.data;
  },
  deleteExamSession: async (id: number) => {
    const response = await api.delete(`/exam-sessions/${id}`);
    return response.data;
  }
};
