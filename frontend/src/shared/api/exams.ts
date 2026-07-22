import axios from 'axios';
import type { ExamPayload, RoomConflictPayload } from '../../types/models';
import { useAuthStore } from '@stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
  // Exams
  getExams: async () => {
    const response = await api.get('/exams');
    return response.data.data;
  },

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
  getExamLiveStats: async (examId: number) => {
    const response = await api.get(`/exam-planning/${examId}/live-stats`); // Temp reuse
    return response.data;
  },
  // Convocations Dashboard
  getConvocationSessionStats: async (sessionId: number) => {
    const response = await api.get(`/convocations/session/${sessionId}/stats`);
    return response.data.data;
  },
  getConvocationSessionList: async (sessionId: number, filiere?: string) => {
    const params = filiere && filiere !== 'Toutes les filières' ? { filiere } : {};
    const response = await api.get(`/convocations/session/${sessionId}/list`, { params });
    return response.data.data;
  },
  generateSessionConvocations: async (sessionId: number) => {
    const response = await api.post('/convocations/generate-session', { session_id: sessionId });
    return response.data;
  },
  sendSessionEmails: async (sessionId: number) => {
    const response = await api.post('/convocations/send-session', { session_id: sessionId });
    return response.data;
  },
  generateSession: async (sessionId: number, filiereId: number, semesterNumber?: number) => {
    const data: any = { session_id: sessionId, filiere_id: filiereId };
    if (semesterNumber) data.semester_number = semesterNumber;
    const response = await api.post('/exam-planning/auto-generate-batch', data);
    return response.data;
  },
  resetSession: async (sessionId: number, filiereId?: number, semesterNumber?: number) => {
    const data: any = { session_id: sessionId };
    if (filiereId) data.filiere_id = filiereId;
    if (semesterNumber) data.semester_number = semesterNumber;
    const response = await api.delete('/exam-planning/reset', { data });
    return response.data;
  },
  createExam: async (data: ExamPayload) => {
    const response = await api.post('/exam-planning/store', data);
    return response.data;
  },
  checkRoomConflict: async (data: RoomConflictPayload) => {
    const response = await api.post('/exam-planning/check-conflict', data);
    return response.data;
  },
  getStudentConvocations: async (studentId: number) => {
    const response = await api.get(`/exam-planning/student/${studentId}`);
    return response.data;
  },
  downloadConvocationPdf: async (convocationId: number) => {
    const response = await api.get(`/exam-planning/student/${convocationId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },
  downloadAttendanceSheetPdf: async (examId: number) => {
    const response = await api.get(`/admin/exams/${examId}/attendance-sheet`, {
      responseType: 'blob'
    });
    return response.data;
  },
  generateConvocations: async (examId: number) => {
    const response = await api.post(`/exam-planning/${examId}/generate-convocations`);
    return response.data;
  },
  sendConvocations: async (examId: number) => {
    const response = await api.post(`/exam-planning/${examId}/send-emails`);
    return response.data;
  },
  batchDownloadPdf: async (sessionId: number, seatingIds: number[]) => {
    const response = await api.post(`/exam-planning/session/${sessionId}/batch-pdf`, { seating_ids: seatingIds }, {
      responseType: 'blob'
    });
    return response.data;
  },
  sendBatchEmails: async (sessionId: number, seatingIds: number[]) => {
    const response = await api.post(`/exam-planning/session/${sessionId}/send-batch-emails`, { seating_ids: seatingIds });
    return response.data;
  },
  batchDownloadSurveillantsPdf: async (sessionId: number, surveillanceIds: number[]) => {
    const response = await api.post(`/exam-planning/session/${sessionId}/surveillants-batch-pdf`, { seating_ids: surveillanceIds }, {
      responseType: 'blob'
    });
    return response.data;
  },
  sendBatchSurveillantsEmails: async (sessionId: number, surveillanceIds: number[]) => {
    const response = await api.post(`/exam-planning/session/${sessionId}/send-batch-surveillants-emails`, { surveillance_ids: surveillanceIds });
    return response.data;
  },
  notifyAbsents: async (examId: number) => {
    const response = await api.post(`/exam-planning/${examId}/notify-absents`);
    return response.data;
  },
  getExamDetails: async (examId: number) => {
    const response = await api.get(`/exam-planning/${examId}/details`);
    return response.data.data;
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
