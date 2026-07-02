import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Gavel, AlertTriangle, ShieldAlert, CheckCircle2,
  XCircle, Clock, Search, FileText, UserX
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Input } from '@shared/components/ui/Input'
import { toast } from 'sonner'

export default function DisciplinePage() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')

  // Fetch Cases
  const { data: disciplineCases, isLoading } = useQuery({
    queryKey: ['discipline-cases'],
    queryFn: () => api.get('/discipline').then(res => res.data.data)
  })

  // Mutate Decision
  const decideMutation = useMutation({
    mutationFn: ({ id, decision }: { id: number, decision: string }) => 
      api.post(`/discipline/${id}/decide`, { decision }),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تسجيل القرار' : 'Décision enregistrée avec succès')
      queryClient.invalidateQueries({ queryKey: ['discipline-cases'] })
    },
    onError: () => toast.error(isRtl ? 'خطأ' : 'Erreur lors de l\'enregistrement')
  })

  // MOCK DATA Fallback
  const dataList = disciplineCases?.length > 0 ? disciplineCases : [
    { id: 1, student: { first_name: 'Karim', last_name: 'EL FASSI', cne: 'N111222333' }, type: 'Triche à l\'examen', severity: 'high', status: 'pending', incident_date: '2026-06-25' },
    { id: 2, student: { first_name: 'Nadia', last_name: 'BENALI', cne: 'M444555666' }, type: 'Absences répétées', severity: 'medium', status: 'resolved', decision: 'warning', incident_date: '2026-06-20' },
    { id: 3, student: { first_name: 'Omar', last_name: 'CHAKIR', cne: 'K777888999' }, type: 'Comportement', severity: 'low', status: 'pending', incident_date: '2026-06-28' },
  ]

  const filteredList = dataList.filter(item => 
    item.student?.last_name.toLowerCase().includes(search.toLowerCase()) || 
    item.type.toLowerCase().includes(search.toLowerCase())
  )

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'high': return <Badge className="bg-red-500/10 text-red-600 border-none"><AlertTriangle size={12} className="me-1"/> {isRtl ? 'عالي' : 'Élevée'}</Badge>
      case 'medium': return <Badge className="bg-amber-500/10 text-amber-600 border-none"><ShieldAlert size={12} className="me-1"/> {isRtl ? 'متوسط' : 'Moyenne'}</Badge>
      case 'low': return <Badge className="bg-blue-500/10 text-blue-600 border-none"><FileText size={12} className="me-1"/> {isRtl ? 'منخفض' : 'Faible'}</Badge>
      default: return null
    }
  }

  const getStatusBadge = (status: string, decision?: string) => {
    if (status === 'resolved') {
      if (decision === 'exclusion') return <Badge className="bg-red-500/10 text-red-600 border-none"><UserX size={12} className="me-1"/> {isRtl ? 'طرد' : 'Exclusion'}</Badge>
      if (decision === 'warning') return <Badge className="bg-amber-500/10 text-amber-600 border-none"><AlertTriangle size={12} className="me-1"/> {isRtl ? 'إنذار' : 'Avertissement'}</Badge>
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-none"><CheckCircle2 size={12} className="me-1"/> {isRtl ? 'محسوم' : 'Résolu'}</Badge>
    }
    return <Badge className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-none"><Clock size={12} className="me-1"/> {isRtl ? 'قيد الانتظار' : 'À traiter'}</Badge>
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-20 animate-in fade-in" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#5f1f1f] to-[#7c2a2a] rounded-[2rem] p-8 text-white shadow-xl shadow-[#5f1f1f]/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center border border-white/20">
            <Gavel className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tight">
              {isRtl ? 'المجلس التأديبي وشؤون الطلاب' : 'Conseil de Discipline'}
            </h1>
            <p className="text-white/80 font-medium text-sm">
              {isRtl ? 'إدارة حالات الغش، الغياب، والقرارات التأديبية.' : 'Gestion des signalements, triches et sanctions disciplinaires.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[hsl(var(--border))] flex flex-wrap gap-4 items-center justify-between bg-[hsl(var(--muted)/30)]">
          <h2 className="font-bold text-lg flex items-center gap-2 text-[hsl(var(--foreground))] px-2">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><Gavel size={18} /></div>
            {isRtl ? 'الملفات التأديبية' : 'Dossiers Disciplinaires'}
          </h2>
          
          <div className="flex gap-3">
            <div className="w-64">
              <Input 
                placeholder={isRtl ? 'بحث...' : 'Rechercher étudiant...'} 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                icon={<Search size={16}/>}
              />
            </div>
          </div>
        </div>

        {isLoading && !disciplineCases ? (
          <div className="flex-1 p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-[hsl(var(--muted)/50)] text-[hsl(var(--muted-foreground))] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">{isRtl ? 'الطالب' : 'Étudiant'}</th>
                  <th className="px-6 py-4">{isRtl ? 'نوع المخالفة' : 'Type d\'incident'}</th>
                  <th className="px-6 py-4">{isRtl ? 'التاريخ' : 'Date'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الخطورة' : 'Sévérité'}</th>
                  <th className="px-6 py-4">{isRtl ? 'القرار' : 'Statut / Décision'}</th>
                  <th className="px-6 py-4 text-end">{isRtl ? 'إجراءات' : 'Actions (Conseil)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filteredList.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[hsl(var(--muted)/30)] transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[hsl(var(--foreground))]">{item.student?.last_name} {item.student?.first_name}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-medium">CNE: {item.student?.cne}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-[hsl(var(--foreground))]">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 text-[hsl(var(--muted-foreground))] text-xs">
                      {item.incident_date}
                    </td>
                    <td className="px-6 py-4">
                      {getSeverityBadge(item.severity)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status, item.decision)}
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => decideMutation.mutate({ id: item.id, decision: 'warning' })}
                              className="p-2 text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors" 
                              title="Avertissement"
                            >
                              <AlertTriangle size={16} />
                            </button>
                            <button 
                              onClick={() => decideMutation.mutate({ id: item.id, decision: 'exclusion' })}
                              className="p-2 text-red-600 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors" 
                              title="Exclusion"
                            >
                              <UserX size={16} />
                            </button>
                            <button 
                              onClick={() => decideMutation.mutate({ id: item.id, decision: 'dismissed' })}
                              className="p-2 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors" 
                              title="Classer sans suite"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {isRtl ? 'مغلق' : 'Clôturé'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))] font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <ShieldAlert className="w-8 h-8 opacity-20" />
                        {isRtl ? 'لا توجد ملفات تأديبية' : 'Aucun dossier disciplinaire trouvé.'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
