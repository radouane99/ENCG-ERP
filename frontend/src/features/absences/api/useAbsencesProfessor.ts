import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AttendanceSession, AttendanceRecord } from '../model/types';

const api = axios.create({
  baseURL: '/api/professor/attendance',
  withCredentials: true,
});

export const useStartSession = () => {
  return useMutation({
    mutationFn: async (data: { module_id: number; group_id: number; room_name: string }) => {
      const res = await api.post<{ session: AttendanceSession }>('/start', data);
      return res.data.session;
    },
  });
};

export const useManualCall = (sessionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { student_id: number; status: 'present' | 'absent' | 'late' | 'excused' }) => {
      const res = await api.post<{ record: AttendanceRecord }>(`/${sessionId}/manual-call`, data);
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
      const res = await api.post<{ session: AttendanceSession }>(`/${sessionId}/close`);
      return res.data.session;
    },
  });
};
