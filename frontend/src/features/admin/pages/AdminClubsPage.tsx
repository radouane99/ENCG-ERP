import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Tent, Search, Users, CheckCircle2, 
  XCircle, Clock, Filter, Sparkles, Building2
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Input } from '@shared/components/ui/Input'
import { toast } from 'sonner'

export default function AdminClubsPage() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')

  // Fetch Clubs
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['admin-clubs'],
    queryFn: () => api.get('/clubs').then(res => res.data.data)
  })

  // Validate Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      api.put(`/clubs/${id}`, { status }),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تحديث حالة النادي' : 'Statut du club mis à jour')
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] })
    },
    onError: () => toast.error(isRtl ? 'خطأ' : 'Erreur de mise à jour')
  })

  const displayedClubs = clubs || []

  const filteredList = displayedClubs.filter((item: any) => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.president?.last_name.toLowerCase().includes(search.toLowerCase())
  )


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/10 text-emerald-600 border-none"><CheckCircle2 size={12} className="me-1"/> {isRtl ? 'نشط' : 'Actif'}</Badge>
      case 'inactive': return <Badge className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-none"><Building2 size={12} className="me-1"/> {isRtl ? 'غير نشط' : 'Inactif'}</Badge>
      case 'rejected': return <Badge className="bg-red-500/10 text-red-600 border-none"><XCircle size={12} className="me-1"/> {isRtl ? 'مرفوض' : 'Rejeté'}</Badge>
      default: return <Badge className="bg-amber-500/10 text-amber-600 border-none"><Clock size={12} className="me-1"/> {isRtl ? 'قيد الانتظار' : 'En attente'}</Badge>
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-20 animate-in fade-in" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#FF6B6B] to-[#C92A2A] rounded-[2rem] p-8 text-white shadow-xl shadow-[#C92A2A]/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center border border-white/20">
            <Tent className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tight flex items-center gap-2">
              {isRtl ? 'الحياة الطلابية والأندية' : 'Annuaire des Clubs & BDE'}
              <Sparkles size={20} className="text-yellow-300" />
            </h1>
            <p className="text-white/90 font-medium text-sm">
              {isRtl ? 'إدارة واعتماد الأندية والأنشطة الطلابية.' : 'Gestion, validation et annuaire de la vie associative.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[hsl(var(--border))] flex flex-wrap gap-4 items-center justify-between bg-[hsl(var(--muted)/30)]">
          <h2 className="font-bold text-lg flex items-center gap-2 text-[hsl(var(--foreground))] px-2">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><Users size={18} /></div>
            {isRtl ? 'لائحة الأندية' : 'Liste des Associations'}
          </h2>
          
          <div className="flex gap-3">
            <div className="w-64">
              <Input 
                placeholder={isRtl ? 'بحث باسم النادي...' : 'Rechercher un club...'} 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                icon={<Search size={16}/>}
              />
            </div>
            <Button variant="outline" icon={<Filter size={16}/>} className="bg-[hsl(var(--background))] hidden sm:flex">
              {isRtl ? 'تصفية' : 'Filtres'}
            </Button>
          </div>
        </div>

        {isLoading && !clubs ? (
          <div className="flex-1 p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-[hsl(var(--muted)/10)]">
            {filteredList.map((club: any) => (
              <div key={club.id} className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-white font-black text-xl shadow-inner">
                    {club.name[0]}
                  </div>
                  {getStatusBadge(club.status)}
                </div>
                
                <h3 className="font-bold text-lg text-[hsl(var(--foreground))] mb-1 line-clamp-1">{club.name}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-4 min-h-[40px]">
                  {club.description}
                </p>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between text-sm bg-[hsl(var(--muted)/50)] p-2.5 rounded-xl border border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1"><Users size={14}/> {isRtl ? 'الأعضاء' : 'Membres'}</span>
                    <span className="font-bold text-[hsl(var(--foreground))]">{club.members_count || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">{isRtl ? 'الرئيس' : 'Président'}</span>
                    <span className="font-medium text-[hsl(var(--foreground))]">{club.president?.last_name} {club.president?.first_name}</span>
                  </div>

                  {club.status === 'pending' && (
                    <div className="pt-4 border-t border-[hsl(var(--border))] flex gap-2">
                      <Button 
                        variant="primary" 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-9" 
                        onClick={() => updateStatusMutation.mutate({ id: club.id, status: 'active' })}
                        isLoading={updateStatusMutation.isPending}
                      >
                        {isRtl ? 'اعتماد' : 'Approuver'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 h-9"
                        onClick={() => updateStatusMutation.mutate({ id: club.id, status: 'rejected' })}
                      >
                        {isRtl ? 'رفض' : 'Rejeter'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredList.length === 0 && (
              <div className="col-span-full py-12 text-center text-[hsl(var(--muted-foreground))] font-medium">
                <div className="flex flex-col items-center gap-2">
                  <Tent className="w-8 h-8 opacity-20" />
                  {isRtl ? 'لا توجد أندية' : 'Aucun club trouvé.'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
