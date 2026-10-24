import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import type { RenewalCalendar } from './renewalCampaign'

export interface FailedModule {
  id: number;
  code: string;
  name: string;
  semester: string;
  grade: number | null;
  status: string;
  status_label: string;
}

export interface RenewalStatus {
  campaign?: RenewalCalendar;
  student_name: string;
  cne: string;
  cin: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  academic_year: string;
  current_semester: number | null;
  current_level: string;
  previous_level?: string;
  target_semester: number | null;
  target_level: string;
  target_year_label?: string;
  current_filiere: string;
  is_admis: boolean;
  is_graduated?: boolean;
  is_confirmed: boolean;
  can_confirm: boolean;
  receipt_reference: string | null;
  confirmed_at: string | null;
  payment_required: boolean;
  payment_status: string;
  invoice_reference: string | null;
  invoice_remaining: number | null;
  blocking_reason: string | null;
  annual_average?: number | null;
  decision_code?: string;
  decision_label?: string;
  was_compensated?: boolean;
  has_reserve_modules?: boolean;
  reserve_modules_count?: number;
  failed_modules?: FailedModule[];
}

export function useRenewalStatus() {
  return useQuery({
    queryKey: ['student-reinscription-status'],
    queryFn: () => api.get('/student-portal/reinscription/status').then(r => r.data.data as RenewalStatus),
  })
}

export const confirmStudentRenewal = (data: { phone: string; address: string; city: string; has_insurance?: boolean }) =>
  api.post('/student-portal/reinscription/confirm', data)
