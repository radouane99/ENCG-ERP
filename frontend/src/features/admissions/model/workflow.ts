export const workflowBase = '/admissions/workflow'
export const documentTypes = ['bac', 'cnie', 'releve_notes', 'photo'] as const
export type DocumentType = typeof documentTypes[number] | 'attestation_admission' | 'releve_parcours'
export const documentLabels: Record<DocumentType, string> = { bac: 'Baccalauréat', cnie: 'CNIE · recto et verso', releve_notes: 'Relevé de notes', photo: 'Photo d’identité', attestation_admission: 'Attestation officielle d’admission', releve_parcours: 'Relevés du parcours antérieur' }
export const statusLabels: Record<string, string> = { draft: 'Brouillon', submitted: 'Soumis', under_review: 'En cours de revue', needs_correction: 'À corriger', approved: 'Inscription validée', rejected: 'Refusé', main: 'Liste principale', waiting: 'Liste d’attente', unconfirmed: 'Admissibilité à confirmer', not_admitted: 'Non admis', invitation_expired: 'Invitation expirée' }
export interface AdmissionDocument { id: number; type: DocumentType; mime_type: string; file_size: number; version: number; status: string; signed_url: string; original_filename: string }
export interface AdmissionDossier {
  id: number; application_id: number; version: number; reference_number: string; cne: string; cin: string; first_name: string; last_name: string; email: string; phone?: string;
  dossier_status: string; eligibility: string; profile: Record<string, string | number | boolean | null>; cloud_available: boolean;
  required_documents?: DocumentType[]; physical_requirements?: Record<string, string>; documents: Partial<Record<DocumentType, AdmissionDocument>>; campaign: { id: number; name: string; open_date: string; close_date: string; entry_route?: string; entry_semester?: number };
  reviews: { id: number; document_id: number | null; decision: string; reason: string | null; created_at: string; reviewer_name?: string; physical_checklist?: Record<string, boolean> | null }[];
  events: { type: string; created_at: string }[]; submitted_at?: string;
  appointment?: { starts_at: string; ends_at: string; desk: string; entry_token: string; checked_in_at: string | null };
  notifications: { id: number; type: string; status: string }[];
  ocr_runs?: OcrRun[];
  document_history?: { id: number; type: DocumentType; version: number; is_current: boolean; url: string }[];
  invitation_expires_at?: string | null;
}
export interface OcrRun { id: string; status: string; engine?: string; error_code?: string; document_id: number; fields: Record<string, { value: string | number; conflict: boolean; requires_confirmation: boolean }>; warnings: string[] }
export const dateText = (value: string) => new Date(/^\d{4}-\d\d-\d\d \d/.test(value) ? value.replace(' ', 'T') + 'Z' : value).toLocaleString('fr-MA', { timeZone: 'Africa/Casablanca', dateStyle: 'medium', timeStyle: 'short' })
export const dayText = (value: string) => new Date(value.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('fr-MA', { timeZone: 'Africa/Casablanca', dateStyle: 'long' })

export const profileLabels: Record<string, string> = {
  cin: 'CIN', cne: 'CNE', first_name: 'Prénom', last_name: 'Nom', first_name_fr: 'Prénom', last_name_fr: 'Nom',
  first_name_ar: 'الاسم الشخصي', last_name_ar: 'النسب', phone: 'Téléphone personnel', email: 'Email personnel',
  birth_date: 'Date de naissance', birth_city: 'Lieu de naissance', gender: 'Genre', nationality: 'Nationalité',
  address: 'Adresse', city: 'Ville', bac_average: 'Moyenne du bac /20', bac_year: 'Année du bac',
  bac_type: 'Série du bac', bac_series: 'Série du bac', high_school: 'Lycée', academy: 'Académie', province: 'Province',
  emergency_contact_name: 'Contact d’urgence', emergency_contact_phone: 'Téléphone d’urgence',
}
