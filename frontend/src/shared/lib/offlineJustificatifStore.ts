import api from '@/shared/lib/api';
import { toast } from 'sonner';

export interface OfflineJustificatifRecord {
  id: string;
  attendanceId: number;
  reason: string;
  description: string;
  fileName: string;
  createdAt: string;
}

const STORAGE_KEY = 'encg_offline_justificatif_queue';
const IDB_NAME = 'encg-justificatifs';
const IDB_STORE = 'files';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putFile(id: string, file: File): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getFile(id: string): Promise<File | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFile(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export const offlineJustificatifStore = {
  getQueue(): OfflineJustificatifRecord[] {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveOffline(record: Omit<OfflineJustificatifRecord, 'id' | 'createdAt'> & { file: File }): Promise<void> {
    const id = 'justif-' + Date.now();
    await putFile(id, record.file);
    const queue = this.getQueue();
    queue.push({
      id,
      attendanceId: record.attendanceId,
      reason: record.reason,
      description: record.description,
      fileName: record.fileName,
      createdAt: new Date().toISOString(),
    });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    toast.warning('Justificatif enregistré hors-ligne', {
      description: 'La photo sera renvoyée dès le retour du réseau.',
    });
  },

  async syncPending(): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;
    const remaining: OfflineJustificatifRecord[] = [];
    for (const item of queue) {
      try {
        const form = new FormData();
        form.append('attendance_id', String(item.attendanceId));
        form.append('reason', item.reason);
        form.append('description', item.description);
        const blob = await getFile(item.id);
        if (blob) {
          form.append('document', blob, item.fileName);
        }
        await api.post('/student-portal/absences/justify', form);
        await deleteFile(item.id);
      } catch {
        remaining.push(item);
      }
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void offlineJustificatifStore.syncPending();
  });
}
