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
  module?: { name: string };
}

export interface AttendanceRecord {
  id: number;
  attendance_session_id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  is_justified: boolean;
  scanned_at?: string;
  is_valid: boolean;
  attendanceSession?: AttendanceSession;
  absenceJustification?: AbsenceJustification;
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
  // Relations (from API eager loading)
  student?: {
    id: number;
    student_number: string;
    first_name?: string;
    last_name?: string;
    user?: { first_name: string; last_name: string; email: string; cin?: string };
  };
  attendance?: AttendanceRecord;
  media?: Array<{ id: number; url: string; file_name: string; mime_type: string; original_url?: string }>;
  created_at?: string;
}

export interface GlobalAbsenceStats {
  absent: number;
  excused: number;
  late: number;
  present: number;
}

// [Phase 8] Attendance is an alias for AttendanceRecord — used in StudentAbsencesPage
export type Attendance = AttendanceRecord;
