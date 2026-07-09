// ─────────────────────────────────────────────────────────────────────────────
// src/types/models.ts
// Mirrors Laravel Eloquent models as strict TypeScript interfaces.
// Keep in sync with backend/app/Models/ and backend/app/Enums/
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums (mirroring app/Enums/) ─────────────────────────────────────────────

export type StudentStatus = 'active' | 'suspended' | 'graduated' | 'withdrawn';

export type Gender = 'male' | 'female';

export type ContractType = 'permanent' | 'contractual' | 'visiting';

export type InternshipStatus = 'pending' | 'validated' | 'rejected' | 'completed';

export type InternshipType = 'initiation' | 'application' | 'fin_etudes';

export type AttendanceSessionStatus = 'active' | 'closed' | 'cancelled';

export type AttendanceSessionType = 'cm' | 'td' | 'tp';

// ── Role ─────────────────────────────────────────────────────────────────────

export interface Role {
  id: number;
  name: string;
  guard_name?: string;
}

// ── Core Identity ─────────────────────────────────────────────────────────────

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  cin: string | null;
  is_active: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  roles?: Role[];
}

// ── Student ───────────────────────────────────────────────────────────────────

export interface Student {
  id: number;
  user_id: number;
  user?: User;
  student_number: string;
  cne: string;
  massar_code: string | null;
  gender: Gender;
  birth_date: string | null;
  status: StudentStatus;
  scholarship_type: string | null;
  institution_id: number;
  // Computed/delegated (via User)
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Professor ─────────────────────────────────────────────────────────────────

export interface Professor {
  id: number;
  user_id: number;
  user?: User;
  employee_number: string;
  grade: string | null;
  specialty: string | null;
  contract_type: ContractType;
  hire_date: string | null;
  is_active: boolean;
  department_id: number | null;
  department?: Department;
  institution_id: number;
  // Computed/delegated (via User)
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Department ────────────────────────────────────────────────────────────────

export interface Department {
  id: number;
  name: string;
  code: string | null;
  institution_id: number;
}

// ── Filiere & Pathway ─────────────────────────────────────────────────────────

export interface Filiere {
  id: number;
  name: string;
  code: string;
  level: string | null;
  duration_semesters: number;
}

export interface StudentPathway {
  id: number;
  student_id: number;
  filiere_id: number;
  filiere?: Filiere;
  academic_year_id: number;
  current_semester: number;
  is_current: boolean;
}

// ── Internship ────────────────────────────────────────────────────────────────

export interface Internship {
  id: number;
  student_id: number;
  student?: Pick<Student, 'id' | 'student_number' | 'first_name' | 'last_name'>;
  company_name: string;
  company_address: string | null;
  start_date: string;
  end_date: string;
  status: InternshipStatus;
  type: InternshipType;
  supervisor_id: number | null;
  supervisor?: Pick<Professor, 'id' | 'employee_number' | 'first_name' | 'last_name'>;
  created_at: string;
  updated_at: string;
}

// ── Attendance ────────────────────────────────────────────────────────────────

export interface AttendanceSession {
  id: number;
  professor_id: number;
  professor?: Pick<Professor, 'id' | 'employee_number' | 'first_name' | 'last_name'>;
  module_name: string;
  group_name: string;
  room_name: string | null;
  status: AttendanceSessionStatus;
  session_type: AttendanceSessionType;
  started_at: string;
  created_at: string;
  updated_at: string;
  // aggregates
  records_count?: number;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  student?: Pick<Student, 'id' | 'student_number' | 'first_name' | 'last_name'>;
  is_present: boolean;
  scanned_at: string | null;
}

// ── API pagination wrapper ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ImportResult {
  success: boolean;
  count?: number;
  errors?: Array<{ row?: number; message?: string; [key: string]: unknown }>;
}

// ── Additional API payload types ───────────────────────────────────────────────

export interface AcademicYearPayload {
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface ExamPayload {
  module_id: number;
  group_id: number;
  room_id: number;
  date: string;
  start_time: string;
  duration_minutes: number;
  type?: string;
  surveillant_ids?: number[];
}

export interface RoomConflictPayload {
  room_id: number;
  date: string;
  start_time: string;
  duration_minutes: number;
  exclude_exam_id?: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}
