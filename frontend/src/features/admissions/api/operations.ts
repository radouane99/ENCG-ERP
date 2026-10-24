import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { workflowBase } from '../model/workflow'
export interface ConsistencyAlert { field: string; severity: string; sources: { source: string; value: string | number; document_id: number | null }[] }
export interface OriginalEvent { id: number; document_type: string; event: string; storage_location?: string; note?: string; created_at: string; agent: string }
export interface OperationsContext { desk_ticket?: { id: number; number: number; desk: string; status: string; service_day: string } | null; alerts: ConsistencyAlert[]; originals: OriginalEvent[]; work: { assigned_to: number | null; next_action: string | null; due_on: string | null; version: number } | null; agents: { id: number; name: string }[] }
export function useAdmissionOperations(applicationId?: number) {
  return useQuery({ queryKey: ['admission-operations', applicationId], enabled: !!applicationId, refetchInterval: 20000,
    queryFn: async ({ signal }) => {
      const data = (await api.get<OperationsContext>(`${workflowBase}/operations/context`, { params: { application_id: applicationId }, signal })).data
      if (!Array.isArray(data.alerts) || !Array.isArray(data.originals) || !Array.isArray(data.agents)) throw new Error('Réponse de suivi indisponible. Actualisez le dossier.')
      return data
    } })
}
export interface WorkRow { id: number; name: string; cne: string; status: string; missing: string[]; corrections: string[]; assigned_to: number | null; assigned_name: string | null; next_action: string | null; due_on: string | null; updated_at: string; alerts_count: number }
export function useAdmissionWorkQueue(campaignId: number | undefined, filter: string, page: number) {
  return useQuery({ queryKey: ['admission-work-queue', campaignId, filter, page], enabled: !!campaignId,
    queryFn: async ({ signal }) => (await api.get<{ data: WorkRow[]; total: number; last_page: number }>(`${workflowBase}/operations/queue`, { params: { campaign_id: campaignId, filter, page }, signal })).data })
}
export interface MonitorData { ocr: { id: string; application_id: number; document_id: number; status: string; created_at: string; can_retry?: boolean; blocker?: string | null }[]; notifications: { id: number; application_id: number; type: string; attempts: number; status: string }[]; limit: number; checked_at: string }
export function useAdmissionMonitor(campaignId?: number) {
  return useQuery({ queryKey: ['admission-monitor', campaignId], enabled: !!campaignId, refetchInterval: 30000,
    queryFn: async ({ signal }) => (await api.get<MonitorData>(`${workflowBase}/operations/monitor`, { params: { campaign_id: campaignId }, signal })).data })
}
