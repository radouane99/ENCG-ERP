import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { DocumentRequest, DocumentType } from '../model/types'

type UpdateRequestStatusInput = {
  id: number
  status: string
  admin_notes?: string | null
}

type UpdateRequestStatusContext = {
  previousRequests?: DocumentRequest[]
}

export const guichetKeys = {
  all: ['guichet'] as const,
  studentRequests: () => [...guichetKeys.all, 'student-requests'] as const,
  adminRequests: () => [...guichetKeys.all, 'admin-requests'] as const,
  documentTypes: () => [...guichetKeys.all, 'document-types'] as const,
}

const fetchDocumentTypes = async (): Promise<DocumentType[]> => {
  const { data } = await api.get('/dashboard/document-types')
  return data.data || data
}

const fetchStudentRequests = async (): Promise<DocumentRequest[]> => {
  const { data } = await api.get('/v1/student-portal/document-requests')
  return data.data || data
}

const fetchAdminRequests = async (): Promise<DocumentRequest[]> => {
  const { data } = await api.get('/admin/document-requests')
  return data.data || data
}

const createDocumentRequest = async (document_type_id: number) => {
  const { data } = await api.post('/v1/student-portal/document-requests', { document_type_id })
  return data.data || data
}

const updateRequestStatus = async ({
  id,
  status,
  admin_notes,
}: UpdateRequestStatusInput) => {
  const { data } = await api.patch(`/admin/document-requests/${id}/status`, {
    status,
    admin_notes,
  })
  return data.data || data
}

export const useDocumentTypes = () => {
  return useQuery({
    queryKey: guichetKeys.documentTypes(),
    queryFn: fetchDocumentTypes,
  })
}

export const useStudentRequests = () => {
  return useQuery({
    queryKey: guichetKeys.studentRequests(),
    queryFn: fetchStudentRequests,
  })
}

export const useAdminRequests = () => {
  return useQuery({
    queryKey: guichetKeys.adminRequests(),
    queryFn: fetchAdminRequests,
  })
}

export const useCreateDocumentRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDocumentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guichetKeys.studentRequests() })
    },
  })
}

export const useUpdateDocumentRequestStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateRequestStatus,
    onMutate: async (newStatusUpdate: UpdateRequestStatusInput): Promise<UpdateRequestStatusContext> => {
      await queryClient.cancelQueries({ queryKey: guichetKeys.adminRequests() })
      const previousRequests = queryClient.getQueryData<DocumentRequest[]>(guichetKeys.adminRequests())

      if (previousRequests) {
        queryClient.setQueryData<DocumentRequest[]>(
          guichetKeys.adminRequests(),
          previousRequests.map((request: DocumentRequest) =>
            request.id === newStatusUpdate.id
              ? {
                  ...request,
                  status: newStatusUpdate.status as any,
                  admin_notes: (newStatusUpdate.admin_notes ?? null) as any,
                }
              : request
          )
        )
      }

      return { previousRequests }
    },
    onError: (_error: unknown, _newUpdate: UpdateRequestStatusInput, context: UpdateRequestStatusContext | undefined) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(guichetKeys.adminRequests(), context.previousRequests)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: guichetKeys.adminRequests() })
    },
  })
}
