export interface DashboardMetrics {
  kpis: {
    total_requests: number;
    pending_requests: number;
    active_students: number;
  };
  document_trends: Array<{
    month: string;
    total: number;
    ready: number;
  }>;
  project_distribution: Array<{
    type: string;
    count: number;
  }>;
  student_activity: Array<{
    year: string;
    total: number;
  }>;
}
