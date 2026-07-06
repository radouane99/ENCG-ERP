import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AttendanceRecord, AbsenceJustification } from '../model/types';

const api = axios.create({
  baseURL: '/api',
});

// Keys
export const absencesKeys = {
  all: ['absences'] as const,
  studentAbsences: () => [...absencesKeys.all, 'student'] as const,
  adminJustifications: () => [...absencesKeys.all, 'admin-justifications'] as const,
};

// --- Student API ---
export const fetchStudentAbsences = async () => {
  const { data } = await api.get('/student-portal/absences');
  return data.data; // assuming { data: [...] }
};

export const justifyAbsence = async ({ attendanceId, formData }: { attendanceId: number; formData: FormData }) => {
  const { data } = await api.post(`/student-portal/absences/${attendanceId}/justify`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data.data;
};

// --- Admin API ---
export const fetchAdminJustifications = async () => {
  const { data } = await api.get('/admin/absences');
  return data.data || data;
};

export const updateJustificationStatus = async ({ id, status, rejection_reason }: { id: number; status: string; rejection_reason?: string }) => {
  const { data } = await api.patch(`/admin/absences/${id}/status`, { status, rejection_reason });
  return data.data;
};

// --- Hooks ---
export const useStudentAbsences = () => {
  return useQuery({
    queryKey: absencesKeys.studentAbsences(),
    queryFn: fetchStudentAbsences,
  });
};

export const useJustifyAbsence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: justifyAbsence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: absencesKeys.studentAbsences() });
    },
  });
};

export const useAdminJustifications = () => {
  return useQuery({
    queryKey: absencesKeys.adminJustifications(),
    queryFn: fetchAdminJustifications,
  });
};

export const useUpdateJustificationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateJustificationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: absencesKeys.adminJustifications() });
    },
  });
};
