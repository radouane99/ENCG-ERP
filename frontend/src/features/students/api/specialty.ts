import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
export interface Specialty { id: number; name: string; code?: string; capacity?: number; min_score_required?: number }
export interface Wish { id: number; filiere_id: number; preference_rank: number; allocation_status: string; filiere: Specialty }
export interface Campaign { source_year_id: number | null; target_year_id: number | null; target_semester: number | null; is_open: boolean; opens_at?: string; closes_at?: string; revision: number; finalized_at?: string }
export interface Quota { filiere_id: number; capacity: number; min_score_required: number; is_open: boolean; allocated_count?: number }
export interface Candidate { student_id: number; student_name: string; cne: string; merit_score: number | null; wishes: Wish[]; allocated_filiere?: string }
export interface Assignment { student_id: number; filiere_id: number | null; score: number | null; status: string; waiting_rank: number | null }
export interface AllocationPlan { id: string; assignments: Assignment[] }
export interface AllocationData { campaign: Campaign; quotas: Quota[]; candidates: Candidate[]; filieres: Specialty[]; years: { id: number; label: string }[] }
export function useAllocation() { return useQuery({ queryKey: ['specialty-allocation-simulation'], queryFn: () => api.get('/admin/specialty-allocation/simulation').then(r => r.data.data as AllocationData) }) }
export function useSpecialtyChoices() { return useQuery({ queryKey: ['student-specialty-wishes'], queryFn: () => api.get('/student-portal/specialty-wishes').then(r => r.data.data as { filieres: Specialty[]; existing_wishes: Wish[]; student_merit_score: number | null; score_complete: boolean; is_campaign_open: boolean; deadline: string | null; academic_year: string; target_semester: number | null }) }) }
export const submitSpecialtyChoices = (ids: number[]) => api.post('/student-portal/specialty-wishes', { wishes: ids.map((id, index) => ({ filiere_id: id, preference_rank: index + 1 })) })
export const configureSpecialtyCampaign = (payload: Record<string, unknown>) => api.put('/admin/specialty-allocation/campaign', payload)
export const saveSpecialtyQuotas = (quotas: Quota[]) => api.put('/admin/specialty-allocation/quotas', { quotas })
export const previewSpecialtyAllocation = () => api.post('/admin/specialty-allocation/preview').then(r => r.data.plan as AllocationPlan)
export const commitSpecialtyAllocation = (plan_id: string) => api.post('/admin/specialty-allocation/run', { plan_id })