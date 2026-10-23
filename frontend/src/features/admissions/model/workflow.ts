export const workflowBase = '/admissions/workflow'
export const documentTypes = ['bac', 'cnie', 'releve_notes', 'photo'] as const
export type DocumentType = typeof documentTypes[number]
export const documentLabels: Record<DocumentType, string> = { bac: 'Baccalauréat', cnie: 'CNIE · recto et verso', releve_notes: 'Relevé de notes', photo: 'Photo d’identité' }
export const statusLabels: Record<string, string> = { draft: 'Brouillon', submitted: 'Soumis', under_review: 'En cours de revue', needs_correction: 'À corriger', approved: 'Inscription validée', rejected: 'Refusé', main: 'Liste principale', waiting: 'Liste d’attente', unconfirmed: 'Admissibilité à confirmer', not_admitted: 'Non admis', invitation_expired: 'Invitation expirée' }
export interface AdmissionDocument { id: number; type: DocumentType; mime_type: string; file_size: number; version: number; status: string; signed_url: string; original_filename: string }
export interface AdmissionDossier {
  id: number; application_id: number; version: number; reference_number: string; cne: string; cin: string; first_name: string; last_name: string; email: string; phone?: string;
  dossier_status: string; eligibility: string; profile: Record<string, string | number | boolean | null>; cloud_available: boolean;
  documents: Partial<Record<DocumentType, AdmissionDocument>>; campaign: { id: number; name: string; open_date: string; close_date: string };
  reviews: { id: number; document_id: number | null; decision: string; reason: string | null; created_at: string }[];
  events: { type: string; created_at: string }[]; submitted_at?: string;
  appointment?: { starts_at: string; ends_at: string; desk: string; entry_token: string; checked_in_at: string | null };
  notifications: { id: number; type: string; status: string }[];
  ocr_runs?: OcrRun[];
  document_history?: { id: number; type: DocumentType; version: number; is_current: boolean; url: string }[];
  invitation_expires_at?: string | null;
}
export interface OcrRun { id: string; status: string; engine?: string; error_code?: string; document_id: number; fields: Record<string, { value: string | number; conflict: boolean; requires_confirmation: boolean }>; warnings: string[] }
export const dateText = (value: string) => new Date(value).toLocaleString('fr-MA', { dateStyle: 'medium', timeStyle: 'short' })
