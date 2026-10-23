import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { workflowBase, type AdmissionDossier } from '../model/workflow'

export function useAdmissionDossier(applicationId?: number, enabled = true) {
  return useQuery({ queryKey: ['admission-dossier', applicationId ?? 'mine'], enabled,
    queryFn: async ({ signal }) => (await api.get<{ candidate: AdmissionDossier }>(`${workflowBase}/dossier`, { params: { application_id: applicationId }, signal })).data.candidate,
    retry: false, staleTime: 15_000 })
}
export function useAdmissionCampaigns() {
  return useQuery({ queryKey: ['admission-campaigns'], queryFn: async ({ signal }) =>
    (await api.get<{ data: { id: number; name: string; status: string; target_capacity: number; entry_route: string; entry_semester: number; academic_year_id: number; filiere_id: number; open_date: string; close_date: string }[] }>(`${workflowBase}/campaigns`, { signal })).data.data })
}
export function errorMessage(error: unknown): string {
  const e = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
  const validation = e.response?.data?.errors
  return validation ? Object.values(validation).flat().join(' ') : e.response?.data?.message || e.message || 'Opération impossible. Réessayez.'
}
