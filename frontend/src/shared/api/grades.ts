import api from '@shared/lib/api';

export interface GradeUpdate {
  student_id: number;
  value: number | null;
  absent: boolean;
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
