import api from '@shared/lib/api'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor?: string
  extendedProps?: {
    type: string
    session_type?: string
    room?: string
    professor_id?: number
    exam_type?: string
    seat_number?: number
    role?: string
  }
}

export const fetchCalendarEvents = async (start: string, end: string): Promise<CalendarEvent[]> => {
  const response = await api.get('/timetable/events', {
    params: { start, end },
  })

  return response.data
}

export const moveCalendarEvent = async (data: {
  event_id: string
  old_date: string
  new_date: string
  new_start_time: string
  new_end_time: string
}) => {
  const response = await api.patch('/timetable/events/move', data)
  return response.data
}
