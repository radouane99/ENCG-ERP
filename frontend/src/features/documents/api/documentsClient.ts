import api from '@shared/lib/api'

export const documentsApi = {
  getStudentRequests: async () => {
    const response = await api.get('/v1/student-portal/document-requests')
    return response.data.data || response.data
  },
  createRequest: async (data: any) => {
    const response = await api.post('/v1/student-portal/document-requests', data)
    return response.data.data || response.data
  },
  downloadRequest: async (id: number) => {
    const response = await api.get(`/v1/student-portal/document-requests/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  getAdminRequests: async (params?: any) => {
    const response = await api.get('/admin/document-requests', { params })
    return response.data.data || response.data
  },
  updateRequestStatus: async ({ id, status, rejection_reason }: any) => {
    const response = await api.patch(`/admin/document-requests/${id}/status`, {
      status,
      admin_notes: rejection_reason ? { rejection_reason } : undefined,
    })
    return response.data
  },
  generateRequest: async ({ id, signatoryTitle }: { id: number; signatoryTitle?: string }) => {
    const response = await api.post(`/admin/document-requests/${id}/generate`, { signatory_title: signatoryTitle })
    return response.data
  },
  getDocumentTypes: async () => {
    const response = await api.get('/admin/document-types')
    return response.data.data || response.data
  },
  createDocumentType: async (data: any) => {
    const response = await api.post('/admin/document-types', data)
    return response.data
  },
  updateDocumentType: async (id: number, data: any) => {
    const response = await api.put(`/admin/document-types/${id}`, data)
    return response.data
  },
  deleteDocumentType: async (id: number) => {
    const response = await api.delete(`/admin/document-types/${id}`)
    return response.data
  },
}
