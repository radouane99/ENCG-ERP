import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
export interface PvContext { filiere_id: number; academic_year_id: number; semester_number: number; type: 'semestriel' | 'annuel'; group_id: number | null }
interface Workflow { deliberation: { id: number; is_sealed: boolean; seal_hash: string | null; sealed_at: string | null; status: string } | null; meeting: { version: number; starts_at: string; ends_at: string; room_id: number } | null; rooms: { id: number; name: string }[]; agents: { id: number; name: string }[]; members: { user_id: number; role: string }[] }
export function usePvWorkflow(context: PvContext, enabled: boolean) {
  return useQuery({ queryKey: ['pv-workflow', context], enabled: enabled && !!context.filiere_id && !!context.academic_year_id && !!context.semester_number,
    queryFn: async ({ signal }) => { const data = (await api.get<Workflow>('/academic/pv-workflow/context', { params: context, signal })).data; if (!Array.isArray(data.agents) || !Array.isArray(data.rooms)) throw new Error('État officiel du PV indisponible.'); return data }, retry: false })
}
