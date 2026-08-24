import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { AttendanceSession, AttendanceRecord } from '../model/types';

export const useStartSession = () => {
  return useMutation({
    mutationFn: async (data: { module_id: number; group_id: number; room_name: string }) => {
      const res = await api.post<{ session: AttendanceSession }>('/professor/attendance/start', data);
      return res.data.session;
    },
  });
};

export const useManualCall = (sessionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { student_id: number; status: 'present' | 'absent' | 'late' | 'excused' }) => {
      const res = await api.post<{ record: AttendanceRecord }>(`/professor/attendance/${sessionId}/manual-call`, data);
      return res.data.record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords', sessionId] });
    },
  });
};

export const useCloseSession = () => {
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await api.post<{ session: AttendanceSession }>(`/professor/attendance/${sessionId}/close`);
      return res.data.session;
    },
  });
};
