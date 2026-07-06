import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { DashboardMetrics } from '../model/types';

const api = axios.create({
  baseURL: '/api',
});

const fetchAnalytics = async (): Promise<DashboardMetrics> => {
  const { data } = await api.get('/admin/analytics');
  return data.data;
};

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: fetchAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  });
};
