import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function ProfessorScanner() {
  const [exam, setExam] = useState('');
  const [room, setRoom] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const [result, setResult] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: exams = [] } = useQuery({ queryKey: ['scanner-exams'], queryFn: () => api.get('/academic/exams').then(r => r.data.data || []) });
  const { data: rooms = [] } = useQuery({ queryKey: ['scanner-rooms'], queryFn: () => api.get('/academic/rooms').then(r => r.data.data || []) });
  const submit = async (raw: string) => {
    if (busy || !raw.trim()) return;
    if (!exam || !room) { toast.error('Sélectionnez un examen et une salle.'); return; }
    setBusy(true);
    try {
      const response = await api.post('/professor/exam-attendance/scan', { exam_id: Number(exam), room_id: Number(room), qr_token: raw.trim() });
      setResult(`Présence enregistrée : ${response.data.student.name}`);
      setToken('');
    } catch (error: any) { setResult(error.response?.data?.message || 'Pointage impossible.'); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!camera) return;
    let stream: MediaStream | undefined; let timer: ReturnType<typeof setTimeout>; let stopped = false;
    const start = async () => {
      try {
        const Detector = (window as any).BarcodeDetector;
        if (!Detector) throw new Error('Lecture caméra indisponible. Utilisez le lecteur QR ou la saisie du jeton.');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new Detector({ formats: ['qr_code'] });
        const scan = async () => {
          if (stopped || !videoRef.current) return;
          const codes = await detector.detect(videoRef.current);
          if (codes[0]) { setToken(codes[0].rawValue); setCamera(false); return; }
          timer = setTimeout(() => { void scan().catch(() => setCamera(false)); }, 300);
        };
        await scan();
      } catch (error: any) { toast.error(error.message || 'Caméra inaccessible.'); setCamera(false); }
    };
    void start();
    return () => { stopped = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, [camera]);
  return <section className="mx-auto max-w-2xl space-y-5 text-foreground">
    <h1 className="erp-page-title">Pointage des convocations</h1>
    <p className="text-muted-foreground">Scannez le jeton QR puis confirmez le pointage dans la salle affectée.</p>
    <label className="block" htmlFor="scan-exam">Examen</label>
    <select id="scan-exam" value={exam} onChange={e => setExam(e.target.value)} className="w-full border border-input bg-background p-3 rounded-[var(--control-radius)]">
      <option value="">Sélectionner</option>{exams.map((e: any) => <option key={e.id} value={e.id}>{e.name || e.module?.name || `Examen ${e.id}`}</option>)}
    </select>
    <label className="block" htmlFor="scan-room">Salle</label>
    <select id="scan-room" value={room} onChange={e => setRoom(e.target.value)} className="w-full border border-input bg-background p-3 rounded-[var(--control-radius)]">
      <option value="">Sélectionner</option>{rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
    </select>
    <button type="button" disabled={!exam || !room} onClick={() => setCamera(v => !v)} className="min-h-11 rounded-lg border border-input p-3">{camera ? 'Arrêter la caméra' : 'Lire avec la caméra'}</button>
    {camera && <video ref={videoRef} muted playsInline className="w-full rounded-xl" aria-label="Aperçu caméra QR" />}
    <form onSubmit={e => { e.preventDefault(); void submit(token); }} className="space-y-3">
      <label htmlFor="scan-token" className="block">Jeton QR (lecteur ou saisie)</label>
      <input id="scan-token" value={token} onChange={e => setToken(e.target.value)} required autoComplete="off" className="w-full border border-input bg-background p-3 rounded-[var(--control-radius)]" />
      <button disabled={busy || !exam || !room} className="min-h-11 rounded-lg bg-primary px-5 text-primary-foreground disabled:opacity-50">{busy ? 'Enregistrement…' : 'Confirmer la présence'}</button>
    </form>
    <p role="status" aria-live="polite">{result}</p>
  </section>;
}
