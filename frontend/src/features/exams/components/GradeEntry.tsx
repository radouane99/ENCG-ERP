import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@stores/authStore';
import { gradesApi } from '@shared/api/grades';
import { Save, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@utils/cn';
import debounce from 'lodash/debounce';

export default function GradeEntry() {
  const { user } = useAuthStore();
  
  const [students, setStudents] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Hardcode module and group for demo purposes
  const moduleId = 1;
  const groupId = 1;

  useEffect(() => {
    fetchGrid();
  }, []);

  const fetchGrid = async () => {
    try {
      setIsLoading(true);
      const res = await gradesApi.getGradeGrid(moduleId, groupId);
      setStudents(res.data);
      setMeta(res.meta);
    } catch (error) {
      console.error("Erreur chargement grille:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updates: any[]) => {
    try {
      setSaveStatus('saving');
      setIsSaving(true);
      const res = await gradesApi.saveGrades(moduleId, groupId, updates);
      
      // Update local state with computed averages and statuses
      setStudents(prev => prev.map(st => {
        const result = res.calculated_results.find((r: any) => r.student_id === st.id);
        if (result) {
          return { ...st, average: result.average, status: result.status };
        }
        return st;
      }));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced save for auto-saving cell edits
  const debouncedSave = useCallback(
    debounce((updates: any[]) => {
      handleSave(updates);
    }, 1000),
    []
  );

  const handleCellChange = (id: number, field: 'cc' | 'exam', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    
    setStudents(prev => {
      const updated = prev.map(st => 
        st.id === id ? { ...st, [field]: numValue } : st
      );
      
      const changedStudent = updated.find(st => st.id === id);
      if (changedStudent) {
        debouncedSave([{
          student_id: changedStudent.id,
          cc: changedStudent.cc,
          exam: changedStudent.exam
        }]);
      }
      
      return updated;
    });
  };

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Saisie des Notes</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {meta?.module_name || 'Module'} — {meta?.group_name || 'Groupe'}
          </p>
        </div>
        
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
            <span className="text-xs font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" /> Erreur de sauvegarde
            </span>
          )}
          <button onClick={fetchGrid} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg border border-slate-200">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
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
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                </td>
              </tr>
            ) : students.map((st) => (
              <tr key={st.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-800">
                  {st.first_name} {st.last_name}
                </td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
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
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                    placeholder="—"
                    value={st.exam ?? ''}
                    onChange={(e) => handleCellChange(st.id, 'exam', e.target.value)}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "text-lg font-black",
                    st.average === null ? "text-slate-300" :
                    st.average >= 12 ? "text-emerald-600" :
                    st.average >= 10 ? "text-amber-500" : "text-red-500"
                  )}>
                    {st.average !== null ? st.average.toFixed(2) : '—'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "inline-flex px-3 py-1 rounded-full text-[10px] font-bold",
                    st.status === 'Validée' ? "bg-emerald-50 text-emerald-600" :
                    st.status === 'Saisie en cours' ? "bg-amber-50 text-amber-600" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {st.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
