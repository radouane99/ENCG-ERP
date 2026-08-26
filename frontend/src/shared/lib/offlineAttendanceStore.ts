import api from '@/shared/lib/api';
import { toast } from 'sonner';

export interface OfflineAttendanceRecord {
  id: string;
  sessionId?: number | null;
  session_id?: number | null;
  moduleId?: string | number;
  module_id?: string | number;
  groupId?: string | number;
  group_id?: string | number;
  date: string;
  records: Array<{
    student_id: number;
    status: 'present' | 'absent' | 'late' | 'excused';
  }>;
  createdAt: string;
}

const STORAGE_KEY = 'encg_offline_attendance_queue';

export const offlineAttendanceStore = {
  getQueue(): OfflineAttendanceRecord[] {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveOffline(record: Omit<OfflineAttendanceRecord, 'id' | 'createdAt'>): void {
    const queue = this.getQueue();
    const newEntry: OfflineAttendanceRecord = {
      ...record,
      id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    queue.push(newEntry);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    toast.warning('📡 Mode hors-ligne', {
      description: `${newEntry.records.length} présences enregistrées. Synchronisation automatique au retour du réseau.`,
      duration: 6000,
    });
  },

  async syncPendingRecords(): Promise<{ success: number; failed: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { success: 0, failed: 0 };

    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: OfflineAttendanceRecord[] = [];
    const toastId = toast.loading(`Synchronisation de ${queue.length} feuille(s) d'émargement…`);

    for (const record of queue) {
      try {
        await api.post('/professor/attendance/save', {
          session_id: record.session_id ?? record.sessionId,
          module_id: record.module_id ?? record.moduleId,
          group_id: record.group_id ?? record.groupId,
          date: record.date,
          records: record.records,
        });
        successCount++;
      } catch {
        failedCount++;
        remainingQueue.push(record);
      }
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue));

    if (successCount > 0) {
      toast.success(`${successCount} émargement(s) synchronisé(s).`, { id: toastId });
    } else if (failedCount > 0) {
      toast.error(`Échec de la synchronisation (${failedCount}).`, { id: toastId });
    }

    return { success: successCount, failed: failedCount };
  },

  initNetworkListener() {
    window.addEventListener('online', () => {
      void this.syncPendingRecords();
    });
  },
};

if (typeof window !== 'undefined') {
  offlineAttendanceStore.initNetworkListener();
}
