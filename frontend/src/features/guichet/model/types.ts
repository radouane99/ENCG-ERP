export interface DocumentType {
  id: number;
  name: string;
  code: string;
  fee_amount: number;
  is_active: boolean;
}

export type DocumentRequestStatus = 'pending' | 'processing' | 'ready' | 'rejected';

export interface AdminNotes {
  reason?: string;
  [key: string]: any;
}

export interface DocumentRequest {
  id: number;
  student_id: number;
  document_type_id: number;
  status: DocumentRequestStatus;
  requested_at: string;
  processed_at: string | null;
  admin_notes: AdminNotes | null;
  document_type?: DocumentType;
  student?: {
    id: number;
    user?: {
      id: number;
      first_name: string;
      last_name: string;
      cin: string;
    };
  };
  media?: Array<{
    id: number;
    file_name: string;
    original_url: string;
  }>;
}
