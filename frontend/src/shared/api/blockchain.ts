import { api } from './students';

export const blockchainApi = {
  getLedger: async () => {
    const response = await api.get('/admin/blockchain/certificates');
    return response.data;
  },
  certifyPromo: async (year: string) => {
    const response = await api.post('/admin/blockchain/certify-promo', { year });
    return response.data;
  },
  verify: async (query: string) => {
    const response = await api.post('/admin/blockchain/verify', { query });
    return response.data;
  },
};
