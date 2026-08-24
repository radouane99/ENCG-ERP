import api from '@shared/lib/api';

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
