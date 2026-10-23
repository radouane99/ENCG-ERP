import api from '@shared/lib/api';

export interface GradeUpdate {
  student_id: number;
  cc: number | null;
  exam: number | null;
  cc_version: number;
  exam_version: number;
  cc_absent?: boolean;
  exam_absent?: boolean;
}

export const gradesApi = {
  getGradeGrid: async (moduleId: number, groupId: number) => {
    const response = await api.get(`/v1/professor/grades/grid`, {
      params: { module_id: moduleId, group_id: groupId }
    });
    return response.data;
  },
  
  saveGrades: async (moduleId: number, groupId: number, updates: GradeUpdate[]) => {
    const response = await api.post(`/v1/professor/grades/save`, {
      module_id: moduleId,
      group_id: groupId,
      updates
    });
    return response.data;
  }
};
