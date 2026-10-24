import api from '@shared/lib/api'
import { workflowBase } from '../model/workflow'
export interface EvaluationCounts { labeled: number; exact: number; missing: number; mismatched: number; critical_mismatches: number }
export interface EvaluationReport {
  dataset_kind: 'synthetic' | 'authorized_real'; samples: number; totals: EvaluationCounts
  exact_match_percent: number | null; by_document_type: Record<string, EvaluationCounts>
  by_field: Record<string, EvaluationCounts>; notice: string
}
export async function evaluateOcr(file: File) {
  const data = new FormData(); data.append('file', file); data.append('authorized_use', '1')
  return (await api.post<{ data: EvaluationReport }>(`${workflowBase}/ocr-evaluation`, data)).data.data
}
