export interface Internship {
  id: number;
  institution_id: number;
  student_id: number;
  academic_year_id: number;
  type: string;
  company_name: string;
  company_address: string;
  company_city: string;
  supervisor_name: string;
  supervisor_email: string;
  supervisor_phone: string;
  position_title: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  professor_supervisor_id?: number;
  documents?: InternshipDocument[];
  soutenance?: Soutenance;
}

export interface InternshipDocument {
  id: number;
  internship_id: number;
  document_type: 'convention' | 'rapport_etape' | 'rapport_final' | 'attestation' | 'fiche_evaluation';
  file_path: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

export interface Soutenance {
  id: number;
  internship_id: number;
  date_time: string;
  room_id: number;
  president_id: number;
  examiner_id: number;
  grade?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  remarks?: string;
}
