import React,{ useState,useEffect,useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { GradeSaveQueue } from '../model/GradeSaveQueue';
import { toast } from 'sonner';
import { gradesApi } from '@shared/api/grades';
import { CheckCircle2,AlertCircle,Loader2,RefreshCw } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { decisionFromScore } from '@shared/lib/lmd';
import LmdLegend from '@shared/components/academic/LmdLegend';
import LmdBadge from '@shared/components/academic/LmdBadge';
import PageHeader from '@shared/components/layout/PageHeader';
export default function GradeEntry() {
  const params = useParams();
  return <GradeEntryGrid key={`${params.moduleId}:${params.groupId}`} />;
}

function GradeEntryGrid() {
  const versionsRef = React.useRef(new Map<number, {cc_version: number; exam_version: number}>());
  const saveRef = React.useRef<(rows: any[]) => Promise<void>>(async () => {});
  const queueRef = React.useRef<GradeSaveQueue<any> | null>(null);
  if (!queueRef.current) queueRef.current = new GradeSaveQueue(rows => saveRef.current(rows));
  const [students, setStudents] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Read module and group from route parameters; do NOT hardcode values
  const params = useParams();
  const moduleId = params.moduleId ? Number(params.moduleId) : null;
  const groupId = params.groupId ? Number(params.groupId) : null;

  const fetchGrid = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      if (!moduleId || !groupId) {
        console.error('ModuleId and groupId are required for GradeEntry');
        setStudents([]);
        setMeta(null);
        return;
      }
      const res = await gradesApi.getGradeGrid(moduleId, groupId);
      setStudents(res.data);
      versionsRef.current = new Map(res.data.map((row: any) => [row.id, {cc_version: row.cc_version, exam_version: row.exam_version}]));
      setMeta(res.meta);
    } catch (error: any) {
      console.error("Erreur chargement grille:", error);
      setLoadError(error.response?.data?.message || 'Impossible de charger cette grille.');
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, groupId]);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  const handleSave = async (updates: any[]) => {
    if (!moduleId || !groupId) {
      console.error('Module ID and Group ID are required to save grades');
      return;
    }
    try {
      setSaveStatus('saving');
      const res = await gradesApi.saveGrades(moduleId, groupId, updates.map(row => ({...row, ...versionsRef.current.get(row.student_id)})));
      for (const row of res.calculated_results) versionsRef.current.set(row.student_id, {cc_version: row.cc_version, exam_version: row.exam_version});
      
      // Update local state with computed averages and statuses
      setStudents(prev => prev.map(st => {
        const result = res.calculated_results.find((r: any) => r.student_id === st.id);
        if (result) {
          return { ...st, average: result.average, status: result.status };
        }
        return st;
      }));

      setSaveStatus('saved');
      // Keep the explicit saved state until the next edit.
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      setSaveStatus('error');
      toast.error('Modifications non enregistrées. Réessayez ou rechargez après un conflit.');
      throw error;
    }
  };

  saveRef.current = handleSave;
  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (queueRef.current?.dirty) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', preventLoss);
    const queue = queueRef.current;
    return () => { window.removeEventListener('beforeunload', preventLoss); void queue?.flush().catch(() => {}); };
  }, []);

  const handleCellChange = (id: number, field: 'cc' | 'exam', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    
    setStudents(prev => {
      const updated = prev.map(st => 
        st.id === id ? { ...st, [field]: numValue } : st
      );
      
      const changedStudent = updated.find(st => st.id === id);
      if (changedStudent) {
        queueRef.current?.enqueue({
          student_id: changedStudent.id,
          cc: changedStudent.cc,
          exam: changedStudent.exam,
          cc_absent: changedStudent.cc_absent, exam_absent: changedStudent.exam_absent
        });
      }
      
      return updated;
    });
  };

  return (
    <div className="space-y-6 animate-in max-w-7xl mx-auto">
      <PageHeader
        title="Saisie des Notes"
        subtitle={`${meta?.module_name || 'Module'} — ${meta?.group_name || 'Groupe'}`}
        actions={
          <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sauvegarde auto...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enregistré
            </span>
          )}
          {saveStatus === 'error' && (
            <button type="button" onClick={() => void queueRef.current?.flush().catch(() => {})} className="text-xs font-bold text-red-600 flex items-center gap-2" aria-live="polite">
              <AlertCircle className="w-3.5 h-3.5" /> Non enregistré — Réessayer
            </button>
          )}
          <button aria-label="Recharger les notes" disabled={queueRef.current.dirty} onClick={fetchGrid} className="p-2 text-slate-400 hover:text-muted-foreground bg-card rounded-lg border border-border">
            <RefreshCw className="w-4 h-4" />
          </button>
          </div>
        }
      />

      <LmdLegend />
      {loadError && <p role="alert" className="rounded-lg border border-destructive p-3 text-destructive">{loadError}</p>}
      {saveStatus === 'error' && <button type="button" className="min-h-11 rounded-lg border border-input px-3" onClick={() => {
        if (queueRef.current?.discard()) { setSaveStatus('idle'); void fetchGrid(); }
      }}>Abandonner les modifications locales et recharger</button>}
      <div className="bg-card dark:bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-bold">Étudiant</th>
              <th className="px-6 py-4 font-bold w-32">Note CC (50%)</th>
              <th className="px-6 py-4 font-bold w-32">Note Examen (50%)</th>
              <th className="px-6 py-4 font-bold text-center w-32">Moyenne</th>
              <th className="px-6 py-4 font-bold text-center">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
            ) : students.map((st) => (
              <tr key={st.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 font-bold text-foreground">
                  {st.first_name} {st.last_name}
                </td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    className="w-full min-h-11 bg-card border border-border px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 rounded-[var(--control-radius)]"
                    placeholder="—"
                    value={st.cc ?? ''}
                    onChange={(e) => handleCellChange(st.id, 'cc', e.target.value)}
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    className="w-full min-h-11 bg-card border border-border px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 rounded-[var(--control-radius)]"
                    placeholder="—"
                    value={st.exam ?? ''}
                    onChange={(e) => handleCellChange(st.id, 'exam', e.target.value)}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "text-lg font-bold",
                    st.average === null ? "text-slate-300" :
                    st.average >= 12 ? "text-emerald-600" :
                    st.average >= 10 ? "text-amber-500" : "text-red-500"
                  )}>
                    {st.average !== null ? st.average.toFixed(2) : '—'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {(() => {
                    const code = decisionFromScore(st.average)
                    return code ? <LmdBadge decision={code} score={st.average} /> : (
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                        {st.status || '—'}
                      </span>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
