import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Target, Users, Search, Download, Calculator, FileCheck2, Filter,
  CheckCircle2, XCircle, Clock
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Input } from '@shared/components/ui/Input'
import { toast } from 'sonner'

export default function AdmissionCampaignManager() {
  const { t, i18n } = useTranslation(['admissions', 'common'])
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const campaignId = 1 // Mock campaign ID

  // Fetch Applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications', campaignId],
    queryFn: () => api.get(`/admissions/campaigns/${campaignId}/applications`).then(res => res.data.data)
  })

  // Mutate Application Status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      api.patch(`/admissions/applications/${id}/status`, { status }),
    onSuccess: (res) => {
      toast.success(res.data.message || t('admissions:campaign.messages.update_success'))
      queryClient.invalidateQueries({ queryKey: ['applications', campaignId] })
    },
    onError: () => toast.error(t('admissions:campaign.messages.update_error'))
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20"><CheckCircle2 size={12} className="me-1"/> {t('admissions:campaign.status.accepted')}</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-none hover:bg-red-500/20"><XCircle size={12} className="me-1"/> {t('admissions:campaign.status.rejected')}</Badge>
      case 'waitlisted':
        return <Badge className="bg-amber-500/10 text-amber-600 border-none hover:bg-amber-500/20"><Clock size={12} className="me-1"/> {t('admissions:campaign.status.waitlisted')}</Badge>
      default:
        return <Badge className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-none hover:bg-[hsl(var(--muted))/80]">{t('admissions:campaign.status.pending')}</Badge>
    }
  }

  // Filter logic
  const filteredApps = applications?.filter((app: any) => 
    (app.candidate?.first_name?.toLowerCase().includes(search.toLowerCase()) || '') || 
    (app.candidate?.last_name?.toLowerCase().includes(search.toLowerCase()) || '')
  ) || []

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-20 animate-in fade-in" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F] to-[#2A4D7C] rounded-[2rem] p-8 text-white shadow-xl shadow-[#1F3A5F]/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center border border-white/20">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tight">
              {t('admissions:campaign.title')}
            </h1>
            <p className="text-white/80 font-medium text-sm">
              {t('admissions:campaign.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Sidebar Status / Actions */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute -end-6 -top-6 w-24 h-24 bg-[hsl(var(--color-primary))/5] rounded-full blur-2xl transition-transform group-hover:scale-150"></div>
            <h2 className="font-black text-lg mb-6 text-[hsl(var(--foreground))] relative z-10">
              {t('admissions:campaign.card.title')}
            </h2>
            
            <div className="space-y-4 text-sm text-[hsl(var(--muted-foreground))] relative z-10">
              <div className="flex justify-between items-center bg-[hsl(var(--muted)/30)] p-3 rounded-xl border border-[hsl(var(--border))]">
                <span className="font-bold">{t('admissions:campaign.card.formula')}</span>
                <Badge variant="outline" className="bg-[hsl(var(--background))]">75% Nat + 25% Reg</Badge>
              </div>
              <div className="flex justify-between items-center bg-[hsl(var(--muted)/30)] p-3 rounded-xl border border-[hsl(var(--border))]">
                <span className="font-bold">{t('admissions:campaign.card.capacity')}</span>
                <span className="font-black text-[hsl(var(--foreground))]">450 {t('admissions:campaign.card.places')}</span>
              </div>
              <div className="flex justify-between items-center bg-[hsl(var(--muted)/30)] p-3 rounded-xl border border-[hsl(var(--border))]">
                <span className="font-bold">{t('admissions:campaign.card.enrolled')}</span>
                <span className="font-black text-[hsl(var(--foreground))]">12,500</span>
              </div>
            </div>

            <Button className="w-full mt-6 bg-[#A80A0B] hover:bg-[#A80A0B]/90 text-white font-bold h-12 shadow-md shadow-[#A80A0B]/20" icon={<Calculator size={18}/>}>
              {t('admissions:campaign.card.calculate')}
            </Button>
          </div>
        </div>

        {/* Main Content: Ranking List */}
        <div className="xl:col-span-3">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-[hsl(var(--border))] flex flex-wrap gap-4 items-center justify-between bg-[hsl(var(--muted)/30)]">
              <h2 className="font-bold text-lg flex items-center gap-2 text-[hsl(var(--foreground))] px-2">
                <div className="p-2 bg-[hsl(var(--color-primary))/10] rounded-lg text-[hsl(var(--color-primary))]"><Users size={18} /></div>
                {t('admissions:campaign.list.title')}
              </h2>
              
              <div className="flex gap-3">
                <div className="w-64">
                  <Input 
                    placeholder={t('admissions:campaign.list.search')} 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    icon={<Search size={16}/>}
                  />
                </div>
                <Button variant="outline" icon={<Download size={16}/>} className="bg-[hsl(var(--background))]">
                  {t('admissions:campaign.list.export')}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex-1 p-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--color-primary))]"></div>
              </div>
            ) : (
              <div className="flex-1 p-0 overflow-x-auto">
                <table className="w-full text-sm text-start">
                  <thead className="bg-[hsl(var(--muted)/50)] text-[hsl(var(--muted-foreground))] font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{t('admissions:campaign.list.table.rank')}</th>
                      <th className="px-6 py-4">{t('admissions:campaign.list.table.name')}</th>
                      <th className="px-6 py-4 text-center">{t('admissions:campaign.list.table.score')}</th>
                      <th className="px-6 py-4 text-center">{t('admissions:campaign.list.table.status')}</th>
                      <th className="px-6 py-4 text-end">{t('admissions:campaign.list.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {filteredApps?.length > 0 ? filteredApps.map((app: any, idx: number) => (
                      <tr key={app.id} className="hover:bg-[hsl(var(--muted)/30)] transition-colors group">
                        <td className="px-6 py-4 font-black text-[hsl(var(--foreground))] opacity-70">
                          #{idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-[hsl(var(--foreground))]">{app.candidate?.last_name || 'Candidat'} {app.candidate?.first_name || 'Anonyme'}</p>
                          <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-medium">CNE: {app.candidate?.cne || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-lg text-[hsl(var(--color-primary))]">
                          {(app.score || 14.5).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="px-6 py-4 text-end">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {app.status !== 'accepted' && (
                              <button onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'accepted' })} className="p-2 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors" title="Accepter">
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            {app.status !== 'waitlisted' && (
                              <button onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'waitlisted' })} className="p-2 text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors" title="Liste d'attente">
                                <Clock size={16} />
                              </button>
                            )}
                            {app.status !== 'rejected' && (
                              <button onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'rejected' })} className="p-2 text-red-600 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors" title="Rejeter">
                                <XCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))] font-medium">
                          <div className="flex flex-col items-center gap-2">
                            <Target className="w-8 h-8 opacity-20" />
                            {t('admissions:campaign.list.empty')}
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
      </div>
    </div>
  )
}
