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

export const documentsApi = {
  // Student endpoints
  getStudentRequests: async () => {
    const response = await api.get('/document-requests');
    return response.data;
  },
  createRequest: async (data: any) => {
    const response = await api.post('/document-requests', data);
    return response.data;
  },
  downloadRequest: async (id: number) => {
    const response = await api.get(`/document-requests/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Admin endpoints
  getAdminRequests: async (params?: any) => {
    const response = await api.get('/admin/document-requests', { params });
    // Laravel paginated response usually has data in response.data.data
    return response.data.data || response.data;
  },
  updateRequestStatus: async ({ id, status, rejection_reason }: any) => {
    const response = await api.patch(`/admin/document-requests/${id}/status`, { status, rejection_reason });
    return response.data;
  },
  generateRequest: async (id: number) => {
    const response = await api.post(`/admin/document-requests/${id}/generate`);
    return response.data;
  },
  getDocumentTypes: async () => {
    const response = await api.get('/admin/document-types');
    return response.data;
  },
  createDocumentType: async (data: any) => {
    const response = await api.post('/admin/document-types', data);
    return response.data;
  },
  updateDocumentType: async (id: number, data: any) => {
    const response = await api.put(`/admin/document-types/${id}`, data);
    return response.data;
  },
  deleteDocumentType: async (id: number) => {
    const response = await api.delete(`/admin/document-types/${id}`);
    return response.data;
  }
};
