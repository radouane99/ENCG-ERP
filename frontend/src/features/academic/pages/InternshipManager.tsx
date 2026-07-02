import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Briefcase, Search, Download, CheckCircle2, Clock, 
  MapPin, UserSquare2, FileCheck2, Filter
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Input } from '@shared/components/ui/Input'
import { toast } from 'sonner'

export default function InternshipManager() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')

  // Fetch Internships
  const { data: internships, isLoading } = useQuery({
    queryKey: ['admin-internships'],
    queryFn: () => api.get('/internships').then(res => res.data.data)
  })

  // Validate Convention Mutation
  const validateMutation = useMutation({
    mutationFn: (id: number) => api.put(`/internships/${id}`, { action: 'validate' }),
    onSuccess: () => {
      toast.success(isRtl ? 'تم التصديق على الاتفاقية' : 'Convention validée avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin-internships'] })
    },
    onError: () => toast.error(isRtl ? 'خطأ' : 'Erreur de validation')
  })

  // MOCK DATA Fallback
  const dataList = internships?.length > 0 ? internships : [
    { id: 1, student: { first_name: 'Anass', last_name: 'EL WALI' }, type: 'Stage d\'application', company: { name: 'Royal Air Maroc' }, city: 'Casablanca', status: 'pending', duration: '2 mois' },
    { id: 2, student: { first_name: 'Salma', last_name: 'BENNIS' }, type: 'PFE', company: { name: 'Bank of Africa' }, city: 'Rabat', status: 'validated', duration: '6 mois' },
    { id: 3, student: { first_name: 'Youssef', last_name: 'TAZI' }, type: 'Stage d\'initiation', company: { name: 'OCP Group' }, city: 'Khouribga', status: 'pending', duration: '1 mois' },
  ]

  const filteredList = dataList.filter(item => 
    item.student?.last_name.toLowerCase().includes(search.toLowerCase()) || 
    item.company?.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    if (status === 'validated') {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-none"><CheckCircle2 size={12} className="me-1"/> {isRtl ? 'مصادق عليه' : 'Validé'}</Badge>
    }
    return <Badge className="bg-amber-500/10 text-amber-600 border-none"><Clock size={12} className="me-1"/> {isRtl ? 'قيد الانتظار' : 'En attente'}</Badge>
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-20 animate-in fade-in" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F] to-[#2A4D7C] rounded-[2rem] p-8 text-white shadow-xl shadow-[#1F3A5F]/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center border border-white/20">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tight">
              {isRtl ? 'إدارة التداريب ومشاريع التخرج' : 'Gestion des Stages & PFE'}
            </h1>
            <p className="text-white/80 font-medium text-sm">
              {isRtl ? 'المصادقة على الاتفاقيات وتعيين المشرفين.' : 'Validation des conventions et suivi de l\'insertion professionnelle.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[hsl(var(--border))] flex flex-wrap gap-4 items-center justify-between bg-[hsl(var(--muted)/30)]">
          <h2 className="font-bold text-lg flex items-center gap-2 text-[hsl(var(--foreground))] px-2">
            <div className="p-2 bg-[hsl(var(--color-primary))/10] rounded-lg text-[hsl(var(--color-primary))]"><Briefcase size={18} /></div>
            {isRtl ? 'لائحة التدريبات' : 'Conventions de Stage'}
          </h2>
          
          <div className="flex gap-3">
            <div className="w-64">
              <Input 
                placeholder={isRtl ? 'بحث...' : 'Rechercher étudiant, entreprise...'} 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                icon={<Search size={16}/>}
              />
            </div>
            <Button variant="outline" icon={<Filter size={16}/>} className="bg-[hsl(var(--background))] hidden sm:flex">
              {isRtl ? 'تصفية' : 'Filtres'}
            </Button>
            <Button variant="outline" icon={<Download size={16}/>} className="bg-[hsl(var(--background))]">
              {isRtl ? 'تصدير' : 'Exporter'}
            </Button>
          </div>
        </div>

        {isLoading && !internships ? (
          <div className="flex-1 p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--color-primary))]"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-[hsl(var(--muted)/50)] text-[hsl(var(--muted-foreground))] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">{isRtl ? 'الطالب' : 'Étudiant'}</th>
                  <th className="px-6 py-4">{isRtl ? 'نوع التدريب' : 'Type'}</th>
                  <th className="px-6 py-4">{isRtl ? 'المؤسسة المستقبلة' : 'Entreprise (Lieu)'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الحالة' : 'Statut Convention'}</th>
                  <th className="px-6 py-4 text-end">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filteredList.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[hsl(var(--muted)/30)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                          <UserSquare2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[hsl(var(--foreground))]">{item.student?.last_name} {item.student?.first_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[hsl(var(--foreground))]">
                      {item.type}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[hsl(var(--foreground))]">{item.company?.name || 'N/A'}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-medium flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {item.city} - {item.duration}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.status === 'pending' ? (
                          <Button 
                            variant="primary" 
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" 
                            onClick={() => validateMutation.mutate(item.id)}
                            isLoading={validateMutation.isPending}
                            icon={<FileCheck2 size={14}/>}
                          >
                            {isRtl ? 'مصادقة' : 'Valider'}
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="h-8 text-xs bg-[hsl(var(--background))]" icon={<Download size={14}/>}>
                            {isRtl ? 'تحميل' : 'Convention'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))] font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="w-8 h-8 opacity-20" />
                        {isRtl ? 'لا توجد تدريبات' : 'Aucun stage trouvé.'}
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
