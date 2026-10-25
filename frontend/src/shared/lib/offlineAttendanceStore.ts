import api from '@/shared/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export interface OfflineAttendanceRecord {
  id: string;
  sessionId?: number | null;
  session_id?: number | null;
  close_session?: boolean;
  moduleId?: string | number | null;
  module_id?: string | number | null;
  groupId?: string | number | null;
  group_id?: string | number | null;
  date: string;
  records: Array<{
    student_id: number;
    status: 'present' | 'absent' | 'late' | 'excused';
  }>;
  createdAt: string;
}

const STORAGE_KEY = 'encg_offline_attendance_queue';
const accountKey = () => { const user = useAuthStore.getState().user; return user ? `${STORAGE_KEY}:${user.institution_id}:${user.id}` : null; };
let syncing = false;

export const offlineAttendanceStore = {
  getQueue(): OfflineAttendanceRecord[] {
    try {
      const key = accountKey();
      const data = key ? sessionStorage.getItem(key) : null;
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveOffline(record: Omit<OfflineAttendanceRecord, 'id' | 'createdAt'>): void {
    const key = accountKey();
    if (!key) { toast.error('Reconnectez-vous avant de conserver une feuille.'); return; }
    const queue = this.getQueue();
    const newEntry: OfflineAttendanceRecord = {
      ...record,
      id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    queue.push(newEntry);
    sessionStorage.setItem(key, JSON.stringify(queue));
    toast.warning('📡 Mode hors-ligne', {
      description: `${newEntry.records.length} présences conservées dans ce navigateur, en attente d’enregistrement sur le serveur. Gardez la session ouverte pour la synchronisation.`,
      duration: 6000,
    });
  },

  async syncPendingRecords(): Promise<{ success: number; failed: number }> {
    const key = accountKey();
    if (!key || syncing) return { success: 0, failed: 0 };
    const queue = this.getQueue();
    if (queue.length === 0) return { success: 0, failed: 0 };
    syncing = true;

    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: OfflineAttendanceRecord[] = [];
    const toastId = toast.loading(`Synchronisation de ${queue.length} feuille(s) d'émargement…`);

    for (const record of queue) {
      if (accountKey() !== key) { remainingQueue.push(record); failedCount++; continue; }
      try {
        await api.post('/professor/attendance/save', {
          session_id: record.session_id ?? record.sessionId,
          module_id: record.module_id ?? record.moduleId,
          group_id: record.group_id ?? record.groupId,
          date: record.date,
          close_session: record.close_session ?? false,
          records: record.records,
        });
        successCount++;
      } catch {
        failedCount++;
        remainingQueue.push(record);
      }
    }

    const processed = new Set(queue.map(record => record.id));
    const current: OfflineAttendanceRecord[] = JSON.parse(sessionStorage.getItem(key) || '[]');
    sessionStorage.setItem(key, JSON.stringify([...remainingQueue, ...current.filter(record => !processed.has(record.id))]));
    syncing = false;

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
