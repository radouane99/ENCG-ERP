import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
export interface ActionItem { id: string; title: string; description: string | null; href: string; deadline: string | null }
export function useActionCenter(actor: 'student' | 'professor') {
  return useQuery({ queryKey: ['user-action-center', actor], staleTime: 30000,
    queryFn: async ({ signal }) => {
      const data = (await api.get<{ items: ActionItem[]; academic_year: string | null; has_student?: boolean; limited?: boolean; message?: string }>(actor === 'student' ? '/student-portal/actions' : '/professor-portal/actions', { signal })).data
      if (!Array.isArray(data.items)) throw new Error('Liste des actions indisponible.')
      return data
    } })
}
