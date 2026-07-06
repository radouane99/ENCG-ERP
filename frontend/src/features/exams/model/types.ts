export interface Exam {
  id: number;
  exam_session_id: number;
  module_id: number;
  group_id: number;
  room_id: number;
  exam_date: string;
  start_time: string;
  duration_minutes: number;
  type: string;
  module?: any;
}

export interface Convocation {
  id: number;
  exam_id: number;
  student_id: number;
  room_id: number;
  seat_number: number | null;
  reference: string;
  status: 'draft' | 'sent' | 'viewed' | 'printed';
  exam?: Exam;
  room?: any;
  student?: any;
}
