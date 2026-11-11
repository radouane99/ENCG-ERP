import { useEffect, useState } from 'react';
import api from '@/shared/lib/api';

export function useAttendanceQrSession(enabled: boolean, moduleId: number | null, groupId: number | null, room: string, date: string) {
  const [session, setSession] = useState<{ id: number; qr_token: string; expires_at: string } | null>(null);
  const [presentIds, setPresentIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  useEffect(() => {
    setSession(null);
    setPresentIds([]);
    setError('');
    if (!enabled || !moduleId || !groupId) return;
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (date !== localDate) { setError('Le QR est disponible uniquement le jour de la séance.'); return; }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const start = async () => {
      try {
        const { data } = await api.post('/professor/attendance/start', { module_id: moduleId, group_id: groupId, room_name: room || 'Salle de cours', date }, { signal: controller.signal });
        if (cancelled) return;
        const current = data.session;
        if (!current?.id || !current?.qr_token || !current?.expires_at) throw new Error('Session QR indisponible');
        setSession(current);
        const poll = async () => {
          try {
            const result = await api.get(`/attendance/session/${current.id}/stats`, { signal: controller.signal });
            if (cancelled) return;
            setPresentIds((result.data.data.students || []).filter((s: { status: string }) => ['present', 'late'].includes(s.status)).map((s: { id: number }) => s.id));
            setError('');
          } catch {
            if (!cancelled) setError('Actualisation des présences indisponible.');
          }
          if (!cancelled && Date.now() < new Date(current.expires_at).getTime()) timer = setTimeout(poll, 4000);
        };
        void poll();
      } catch {
        if (!cancelled) setError('Impossible de démarrer la session QR.');
      }
    };
    void start();
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, [enabled, moduleId, groupId, room, date]);
  useEffect(() => {
    if (!session) { setExpiresIn(0); return; }
    const tick = () => setExpiresIn(Math.max(0, Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session]);
  return { sessionId: session?.id, token: enabled && !error && expiresIn > 0 ? session?.qr_token || '' : '', presentIds, expiresIn, error };
}
