import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { AttendanceRecord } from '../model/types';

export const useStudentAbsences = () => {
  return useQuery({
    queryKey: ['myAbsences'],
    queryFn: async () => {
      const { data } = await api.get<{ absences: AttendanceRecord[] }>('/v1/student-portal/absences');
      return data.absences;
    },
  });
};
