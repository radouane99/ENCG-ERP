export type DocumentRequestStatus = 'pending' | 'processing' | 'ready' | 'rejected' | 'withdrawn';

export interface DocumentType {
    id: number;
    name: string;
    code: string;
    type: string;
    category?: string;
    is_active: boolean;
}

export interface DocumentRequest {
    id: number;
    user_id: number;
    document_template_id: number;
    reference_number: string;
    status: DocumentRequestStatus;
    language: string;
    additional_data?: any;
    rejection_reason?: string;
    processed_by?: number;
    processed_at?: string;
    created_at: string;
    updated_at: string;
    template?: DocumentType;
    user?: {
        id: number;
        first_name: string;
        last_name: string;
        name: string;
        apogee_number?: string;
    };
}
