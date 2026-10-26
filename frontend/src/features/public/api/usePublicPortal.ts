import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'

export type PortalAnnouncement = { id: string; title: string; body: string; status: 'draft' | 'published' | 'archived'; starts_on: string; ends_on: string; attachment_id?: string | null }
export type PortalContent = { revision: number; timezone: string; contact: { name: string; email: string | null; phone: string | null; address: string | null; hours: string }; guides: Record<'tafem' | 'cnaem', { instructions: string; documents: string[]; physical_checklist: string[] }>; announcements: PortalAnnouncement[]; attachments?: { id: string; name: string }[] }

export function usePublicPortal() {
  return useQuery({ queryKey: ['public-portal-content'], queryFn: async () => {
    const data = (await api.get('/public/admissions/portal', { suppressToast: true } as any)).data?.data as PortalContent
    if (!data?.contact || !data?.guides || !Array.isArray(data.announcements)) throw new Error('Informations publiques indisponibles')
    return data
  }, staleTime: 30000, refetchInterval: 60000, retry: 1 })
}
