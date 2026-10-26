import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'

export type PublicCampaign = { id: number; name: string; entry_route: string; entry_semester: number; open_date: string; close_date: string; state: 'open' | 'upcoming' }
export type AdmissionCalendar = { state: 'open' | 'upcoming' | 'closed'; timezone: string; server_now: string; next_change_at?: string | null; campaigns: PublicCampaign[] }

export function useAdmissionCalendar() {
  return useQuery({ queryKey: ['public-admission-calendar'], queryFn: async () => {
    const value = (await api.get('/public/admissions/calendar', { suppressToast: true } as any)).data?.data as AdmissionCalendar
    if (!value || !['open', 'upcoming', 'closed'].includes(value.state) || !Array.isArray(value.campaigns)) throw new Error('Calendrier indisponible')
    return value
  }, staleTime: 0, refetchInterval: query => {
    const data = query.state.data
    return data?.next_change_at ? Math.min(60000, Math.max(1000, Date.parse(data.next_change_at) - Date.parse(data.server_now))) : 60000
  }, refetchOnWindowFocus: 'always', retry: 1 })
}
