export interface AttendanceSession {
  id: number;
  module_id: number;
  group_id: number;
  professor_id: number;
  room_name: string;
  session_date: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'cancelled';
  qr_token?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  attendance_session_id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  is_justified: boolean;
  scanned_at?: string;
  is_valid: boolean;
}

export interface AbsenceJustification {
  id: number;
  attendance_id: number;
  student_id: number;
  reason: string;
  description?: string;
  document_path?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  rejection_reason?: string;
}

export interface GlobalAbsenceStats {
  absent: number;
  excused: number;
  late: number;
  present: number;
}
