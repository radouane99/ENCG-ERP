import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
export interface RenewalStatus {
  student_name: string; cne: string; cin: string; email: string; phone: string; address: string; city: string
  academic_year: string; current_semester: number | null; current_level: string; target_semester: number | null
  target_level: string; current_filiere: string; is_admis: boolean; is_confirmed: boolean; can_confirm: boolean
  receipt_reference: string | null; confirmed_at: string | null; payment_required: boolean
  payment_status: string; invoice_reference: string | null; invoice_remaining: number | null; blocking_reason: string | null
}
export function useRenewalStatus() {
  return useQuery({ queryKey: ['student-reinscription-status'], queryFn: () => api.get('/student-portal/reinscription/status').then(r => r.data.data as RenewalStatus) })
}
export const confirmStudentRenewal = (data: { phone: string; address: string; city: string }) => api.post('/student-portal/reinscription/confirm', data)