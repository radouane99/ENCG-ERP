export const workflowBase = '/admissions/workflow'

export const documentTypes = ['bac', 'cnie', 'releve_notes', 'photo'] as const
export const extendedDocumentTypes = [
  'bac',
  'cnie',
  'releve_notes',
  'photo',
  'engagement_legalise',
  'assurance_etudiant',
  'attestation_admission',
  'releve_parcours',
  'diplome_bac2'
] as const

export type DocumentType = typeof extendedDocumentTypes[number]

export const documentLabels: Record<DocumentType, string> = {
  bac: 'Baccalauréat',
  cnie: 'CNIE · recto et verso',
  releve_notes: 'Relevé de notes officiel',
  photo: 'Photo d’identité récente',
  engagement_legalise: 'Engagement sur l’honneur légalisé (Règlement ENCG)',
  assurance_etudiant: 'Attestation d’Assurance / AMO Étudiants',
  attestation_admission: 'Attestation officielle d’admission',
  releve_parcours: 'Relevés du parcours antérieur',
  diplome_bac2: 'Diplôme Bac+2 / DEUG / DUT / BTS (Passerelle)'
}

export const documentLabelsAr: Record<DocumentType, string> = {
  bac: 'شهادة البكالوريا الأصلية',
  cnie: 'البطاقة الوطنية للتعريف الإلكترونية',
  releve_notes: 'بيان النقط الرسمي',
  photo: 'صورة فوتوغرافية حديثة',
  engagement_legalise: 'التزام مصادق عليه باحترام النظام الداخلي للمدرسة',
  assurance_etudiant: 'شهادة التأمين الصحي الطلابي (AMO)',
  attestation_admission: 'شهادة القبول الرسمية في مباراة طافيم',
  releve_parcours: 'بيانات نقط المسار الجامعي السابق',
  diplome_bac2: 'دبلوم باك+2 (مسالك الولوج المباشر)'
}

export const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  under_review: 'En cours de revue',
  needs_correction: 'À corriger',
  approved: 'Inscription validée',
  rejected: 'Refusé',
  main: 'Liste principale',
  waiting: 'Liste d’attente',
  unconfirmed: 'Admissibilité à confirmer',
  not_admitted: 'Non admis',
  invitation_expired: 'Invitation expirée',
  // Statuts administratifs conformité ENCG Fès
  guichet_checked_in: 'Présent au guichet (Émargé QR)',
  bac_physique_depose: 'Baccalauréat original consigné (Coffre-fort)',
  apogee_assigned: 'Numéro Apogée officiel attribué',
  enrolled: 'Inscrit définitivement'
}

export const statusLabelsAr: Record<string, string> = {
  draft: 'مسودة أولية',
  submitted: 'تم إيداع الملف الرقمي',
  under_review: 'قيد المراجعة والتدقيق الإداري',
  needs_correction: 'يتطلب تصحيح الوثائق',
  approved: 'تم تثبيت التسجيل الإداري',
  rejected: 'طلب مرفوض',
  main: 'اللوائح الرسمية للمقبولين',
  waiting: 'لوائح الانتظار',
  unconfirmed: 'أهلية في انتظار التأكيد',
  not_admitted: 'غير مقبول',
  invitation_expired: 'انتهت صلاحية الدعوة',
  guichet_checked_in: 'حاضر بالشباك (تم تسجيل الحضور)',
  bac_physique_depose: 'إيداع شهادة البكالوريا الأصلية بالخزينة',
  apogee_assigned: 'تم تخصيص رقم أبوجي الرسمي',
  enrolled: 'مسجل نهائياً بالمؤسسة'
}

export interface StatusBadge {
  label: string;
  labelAr: string;
  badgeClass: string;
}

export const statusBadgeConfig: Record<string, StatusBadge> = {
  approved: {
    label: 'Inscription validée',
    labelAr: 'تم تثبيت التسجيل',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  enrolled: {
    label: 'Inscrit définitivement',
    labelAr: 'مسجل نهائياً',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200',
  },
  submitted: {
    label: 'Soumis',
    labelAr: 'تم الإيداع',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  },
  under_review: {
    label: 'En cours de revue',
    labelAr: 'قيد التدقيق',
    badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
  needs_correction: {
    label: 'À corriger',
    labelAr: 'بحاجة لتصحيح',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  rejected: {
    label: 'Refusé',
    labelAr: 'مرفوض',
    badgeClass: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300',
  },
  draft: {
    label: 'Brouillon',
    labelAr: 'مسودة',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300',
  },
  main: {
    label: 'Liste principale',
    labelAr: 'اللائحة الرئيسية',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  waiting: {
    label: 'Liste d’attente',
    labelAr: 'لائحة الانتظار',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  bac_physique_depose: {
    label: 'Bac consigné',
    labelAr: 'إيداع البكالوريا',
    badgeClass: 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300',
  },
  guichet_checked_in: {
    label: 'Présent au guichet',
    labelAr: 'حاضر بالشباك',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
  },
};

export const getStatusBadge = (status: string): StatusBadge => {
  return statusBadgeConfig[status] || {
    label: statusLabels[status] || status,
    labelAr: statusLabelsAr[status] || status,
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300',
  };
};

export interface AdmissionDocument {
  id: number;
  type: DocumentType;
  mime_type: string;
  file_size: number;
  version: number;
  status: string;
  signed_url: string;
  original_filename: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdmissionDossier {
  id: number;
  application_id: number;
  version: number;
  reference_number: string;
  cne: string;
  cin: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  dossier_status: string;
  eligibility: string;
  profile: Record<string, string | number | boolean | null>;
  cloud_available: boolean;
  required_documents?: DocumentType[];
  physical_requirements?: Record<string, string>;
  documents: Partial<Record<DocumentType, AdmissionDocument>>;
  campaign: {
    id: number;
    name: string;
    open_date: string;
    close_date: string;
    entry_route?: string;
    entry_semester?: number;
  };
  reviews: {
    id: number;
    document_id: number | null;
    document_type?: DocumentType | null;
    document_version?: number | null;
    decision: string;
    reason: string | null;
    created_at: string;
    reviewer_name?: string;
    physical_checklist?: Record<string, boolean> | null;
  }[];
  events: { type: string; created_at: string }[];
  submitted_at?: string;
  appointment?: {
    starts_at: string;
    ends_at: string;
    desk: string;
    entry_token: string;
    checked_in_at: string | null;
  };
  notifications: { id: number; type: string; status: string }[];
  ocr_runs?: OcrRun[];
  document_history?: {
    id: number;
    type: DocumentType;
    version: number;
    is_current: boolean;
    url: string;
  }[];
  invitation_expires_at?: string | null;
  // Traçabilité physique & Apogée
  official_apogee_number?: string;
  physical_archive?: {
    bac_original_box_number?: string;
    consigned_at?: string;
    consigned_by?: string;
    receipt_reference?: string;
  };
}

export interface OcrRun {
  id: string;
  status: string;
  engine?: string;
  error_code?: string;
  document_id: number;
  confidence_score?: number;
  anomalies?: {
    cne_mismatch?: boolean;
    cin_expired?: boolean;
    low_scan_quality?: boolean;
    spelling_divergence?: boolean;
  };
  fields: Record<string, { value: string | number; conflict: boolean; requires_confirmation: boolean }>;
  warnings: string[];
}

export const dateText = (value?: string | null) => {
  if (!value) return ''
  return new Date(/^\d{4}-\d\d-\d\d \d/.test(value) ? value.replace(' ', 'T') + 'Z' : value).toLocaleString('fr-MA', {
    timeZone: 'Africa/Casablanca',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export const dayText = (value: string) =>
  new Date(value.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('fr-MA', {
    timeZone: 'Africa/Casablanca',
    dateStyle: 'long',
  })

export const profileLabels: Record<string, string> = {
  cin: 'CNIE officielle',
  cne: 'CNE / Code Massar',
  first_name: 'Prénom',
  last_name: 'Nom',
  first_name_fr: 'Prénom (Français)',
  last_name_fr: 'Nom (Français)',
  first_name_ar: 'الاسم الشخصي',
  last_name_ar: 'النسب العائلي',
  phone: 'Téléphone personnel',
  email: 'Email personnel',
  birth_date: 'Date de naissance',
  birth_city: 'Lieu de naissance',
  birth_city_ar: 'مكان الازدياد بالعربية',
  gender: 'Genre',
  nationality: 'Nationalité',
  address: 'Adresse de résidence',
  city: 'Ville',
  bac_average: 'Moyenne générale du Bac /20',
  bac_year: 'Année d’obtention du Bac',
  bac_type: 'Série du Baccalauréat',
  bac_series: 'Série du Baccalauréat',
  bac_mention: 'Mention du Bac',
  high_school: 'Lycée d’origine',
  academy: 'Académie régionale (AREF)',
  province: 'Direction provinciale',
  emergency_contact_name: 'Contact d’urgence (Parent/Tuteur)',
  emergency_contact_phone: 'Téléphone d’urgence',
  father_name: 'Nom complet du Père',
  father_cin: 'CIN du Père',
  father_profession: 'Profession du Père',
  mother_name: 'Nom complet de la Mère',
  mother_cin: 'CIN de la Mère',
  mother_profession: 'Profession de la Mère',
}
