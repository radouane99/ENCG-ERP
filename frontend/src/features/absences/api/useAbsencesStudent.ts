import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AttendanceRecord } from '../model/types';

const api = axios.create({
  baseURL: '/api/v1/student-portal/absences', // This should match student.php or we can adjust to match the backend path.
  withCredentials: true,
});

export const useStudentAbsences = () => {
  return useQuery({
    queryKey: ['myAbsences'],
    queryFn: async () => {
      const { data } = await api.get<{ absences: AttendanceRecord[] }>('/');
      return data.absences;
    },
  });
};
