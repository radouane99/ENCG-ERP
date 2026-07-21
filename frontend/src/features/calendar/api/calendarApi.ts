import axios from 'axios';

// Add the calendar endpoints to an API service
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  extendedProps?: {
    type: string; // 'class', 'makeup', 'exam', 'surveillance'
    session_type?: string; // 'cm', 'td', 'tp'
    room?: string;
    professor_id?: number;
    exam_type?: string;
    seat_number?: number;
    role?: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchCalendarEvents = async (start: string, end: string): Promise<CalendarEvent[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/timetable/events`, {
    params: { start, end },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const moveCalendarEvent = async (data: { event_id: string; old_date: string; new_date: string; new_start_time: string; new_end_time: string }) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(`${API_BASE_URL}/timetable/events/move`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
