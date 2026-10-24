import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'

export interface RenewalCalendar {
  academic_year_id: number; academic_year: string; version: number
  status: 'draft' | 'open' | 'closed'
  state: 'unconfigured' | 'year_locked' | 'draft' | 'closed' | 'scheduled' | 'expired' | 'open'
  is_open: boolean; opens_on: string | null; closes_on: string | null
  public_message: string | null; message: string; timezone: string
}
export function useRenewalCampaign() {
  return useQuery({ queryKey: ['renewal-campaign'], queryFn: async ({ signal }) =>
    (await api.get<{ data: RenewalCalendar; can_manage: boolean }>('/admin/reinscriptions/campaign', { signal })).data })
}
export async function saveRenewalCampaign(data: { version: number; status: string; opens_on: string; closes_on: string; public_message: string }) {
  return (await api.put<{ data: RenewalCalendar; can_manage: boolean }>('/admin/reinscriptions/campaign', data)).data
}
