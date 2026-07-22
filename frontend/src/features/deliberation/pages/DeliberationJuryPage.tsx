import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, PlusCircle, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { Spinner } from '@shared/components/ui/Spinner'

export default function DeliberationJuryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [isRachatModalOpen, setIsRachatModalOpen] = useState(false)
  const [rachatData, setRachatData] = useState({ studentId: 0, studentName: '', moduleId: 0, moduleName: '', currentGrade: 0, newGrade: 10 })

  const { data, isLoading } = useQuery({
    queryKey: ['deliberation-jury', id],
    queryFn: async () => {
      const res = await api.get(`/admin/academic/deliberations/${id}/jury`);
      return res.data;
    }
  });

  const applyRachatMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post(`/admin/academic/deliberations/${id}/rachat`, payload);
    },
    onSuccess: () => {
      setIsRachatModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['deliberation-jury', id] })
      // Optionnel: ajouter un toast de succès
    }
  })

  const handleExportPdf = async () => {
    try {
      const res = await api.get(`/admin/academic/deliberations/${id}/pv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pv_deliberation_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      console.error(e)
    }
  }

  const openRachat = (student: any, mod: any, grade: number) => {
    setRachatData({
      studentId: student.student_id,
      studentName: student.student_name,
      moduleId: mod.id,
      moduleName: mod.name,
      currentGrade: grade,
      newGrade: 10
    })
    setIsRachatModalOpen(true)
  }

  if (isLoading) return <div className="p-12 flex justify-center"><Spinner className="w-8 h-8 text-primary" /></div>
  if (!data) return <div className="p-12 text-center text-muted-foreground">Données introuvables.</div>

  const { deliberation, modules, matrix } = data;

  return (
    <div className="space-y-6 p-6 animate-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Jury de Délibération</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {deliberation?.filiere?.name} - {deliberation?.semester?.name} | {deliberation?.academic_year?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPdf}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4"/> Générer PV (PDF)
          </button>
        </div>
      </div>

      {/* Matrice */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-[10px] text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold w-10">N°</th>
              <th className="px-4 py-3 font-semibold sticky left-0 bg-muted/50 z-10">Étudiant</th>
              {modules.map((m: any) => (
                <th key={m.id} className="px-4 py-3 font-semibold text-center border-l">
                  <div className="max-w-[100px] truncate" title={m.name}>{m.name}</div>
                  <div className="text-[8px] text-primary mt-0.5">Coef: {m.coef}</div>
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-center border-l bg-primary/5 text-primary">Moyenne</th>
              <th className="px-4 py-3 font-semibold text-center border-l">Décision</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {matrix.map((row: any, i: number) => (
              <tr key={row.student_id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3 font-medium sticky left-0 bg-card z-10 border-r">{row.student_name}</td>
                
                {modules.map((m: any) => {
                  const modRes = row.modules[m.id];
                  if (!modRes) return <td key={m.id} className="px-4 py-3 text-center border-l text-muted-foreground">-</td>;
                  
                  const isRed = modRes.status === 'NV' || modRes.status === 'RAT' || modRes.status === 'DISCIPLINE';
                  const isOrange = modRes.status === 'VC';
                  const isGreen = modRes.status === 'V';
                  
                  return (
                    <td key={m.id} className={cn(
                      "px-4 py-3 text-center border-l group relative",
                      isRed ? 'bg-red-50/50' : '',
                      isOrange ? 'bg-orange-50/50' : '',
                      isGreen ? 'bg-green-50/50' : ''
                    )}>
                      <div className={cn(
                        "font-mono text-sm font-bold",
                        isRed ? 'text-red-600' : isOrange ? 'text-orange-600' : 'text-green-600'
                      )}>
                        {modRes.average.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 font-semibold">
                        {modRes.status}
                      </div>

                      {/* Rachat Button Overlay on Hover if grade < 10 */}
                      {modRes.average < 10 && (
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openRachat(row, m, modRes.average)}
                            className="bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded shadow-sm flex items-center gap-1 font-bold"
                          >
                            <PlusCircle className="w-3 h-3"/> Rachat
                          </button>
                        </div>
                      )}
                    </td>
                  )
                })}
                
                <td className="px-4 py-3 text-center border-l bg-primary/5 font-mono font-bold text-primary">
                  {row.semester_average.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center border-l">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                    row.is_admitted ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                  )}>
                    {row.decision}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rachat Modal */}
      {isRachatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Appliquer un Rachat
              </h3>
              <button onClick={() => setIsRachatModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <p><strong>Étudiant :</strong> {rachatData.studentName}</p>
                <p><strong>Module :</strong> {rachatData.moduleName}</p>
                <p><strong>Note actuelle :</strong> <span className="text-red-500 font-bold">{rachatData.currentGrade.toFixed(2)}</span></p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nouvelle Note (Rachat)</label>
                <input 
                  type="number" 
                  step="0.25"
                  min="0"
                  max="20"
                  value={rachatData.newGrade}
                  onChange={(e) => setRachatData({...rachatData, newGrade: parseFloat(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground">La note sera mise à jour dans le système et tracée.</p>
              </div>
            </div>
            <div className="p-5 border-t bg-muted/50 flex justify-end gap-2">
              <button onClick={() => setIsRachatModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">Annuler</button>
              <button 
                onClick={() => applyRachatMutation.mutate({ student_id: rachatData.studentId, module_id: rachatData.moduleId, new_grade: rachatData.newGrade })}
                disabled={applyRachatMutation.isPending}
                className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2"
              >
                {applyRachatMutation.isPending ? <Spinner className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                Confirmer le Rachat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
