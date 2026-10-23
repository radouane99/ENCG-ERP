import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'

export interface TuitionInvoice {
  id: number; name: string; cne: string; type: string; amount: string; paid_amount: number
  remaining_amount: number; date: string; status: 'PAID' | 'LATE' | 'PENDING'; receipt_number: string
}
export interface FinanceStats {
  revenue_month: string; unpaid_amount: string; unpaid_count: number; payments: TuitionInvoice[]
  meta: { current_page: number; last_page: number; total: number }
}
export interface FinanceOptions {
  students: { id: number; name: string; cne: string }[]
  years: { id: number; label: string }[]; filieres: { id: number; name: string }[]
}
export function useTuitionLedger(page: number, search: string, status: string) {
  return useQuery({ queryKey: ['admin-finance-stats', page, search, status], queryFn: () => api.get('/finance/stats', { params: { page, search, status } }).then(r => r.data.data as FinanceStats) })
}
export function useFinanceOptions(search: string, enabled: boolean) {
  return useQuery({ queryKey: ['finance-options', search], enabled, queryFn: () => api.get('/admin/finance/options', { params: { search } }).then(r => r.data as FinanceOptions) })
}
export const createTuitionInvoice = (payload: Record<string, FormDataEntryValue>) => api.post('/admin/finance/invoices', payload)
export const verifyTuitionPayment = (id: number, payload: Record<string, unknown>) => api.post(`/admin/finance/payments/${id}/validate`, payload)
export const remindTuitionInvoice = (id?: number) => api.post(id ? `/admin/finance/invoices/${id}/reminder` : '/admin/finance/reminders')