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

export const aiApi = {
  getHistory: async () => {
    const response = await api.get('/chatbot/history');
    return response.data;
  },
  
  sendMessage: async (message: string, role?: string) => {
    const response = await api.post('/chatbot/message', { message, role });
    return response.data;
  },

  transcribeAudio: async (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    const response = await api.post('/chatbot/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  generateQuiz: async (data: { topic: string, difficulty: string, count?: number }) => {
    const response = await api.post('/professor/ai/generate-qcm', data);
    return response.data;
  }
};
