import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  GraduationCap, Building2, Briefcase, TrendingUp,
  Search, Filter, MapPin, Link, Mail, CheckCircle2, Users
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Input } from '@shared/components/ui/Input'

export default function AlumniNetwork() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  
  const [search, setSearch] = useState('')

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['alumni-stats'],
    queryFn: () => api.get('/alumni/dashboard-stats').then(res => res.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const { data: alumniData } = useQuery({
    queryKey: ['alumni-directory'],
    queryFn: () => api.get('/alumni').then(res => res.data.data),
  })

  const alumniList = alumniData || []

  const filteredAlumni = alumniList.filter(a => 
    a.last_name.toLowerCase().includes(search.toLowerCase()) ||
    a.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-6 pb-20 animate-in fade-in" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Premium Header - Gold / Deep Blue Theme */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-[2rem] p-8 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700/50">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[1.2rem] flex items-center justify-center border border-amber-300/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">Alumni Network</span>
            </h1>
            <p className="text-slate-300 font-medium text-sm">
              {isRtl ? 'شبكة الخريجين وإحصاءات الإدماج المهني.' : 'Réseau d\'excellence et suivi de l\'insertion professionnelle.'}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm flex items-center justify-between group hover:border-amber-500/50 transition-colors">
          <div>
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">{isRtl ? 'إجمالي الخريجين' : 'Total Lauréats'}</p>
            <p className="text-3xl font-black text-[hsl(var(--foreground))]">{stats?.total_alumni?.toLocaleString() || '8 500'}</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm flex items-center justify-between group hover:border-emerald-500/50 transition-colors">
          <div>
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">{isRtl ? 'نسبة الإدماج' : 'Insertion (6 mois)'}</p>
            <p className="text-3xl font-black text-emerald-600">{stats?.employed_percentage || '92'}%</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm flex items-center justify-between group hover:border-blue-500/50 transition-colors">
          <div>
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">{isRtl ? 'القطاع الأول' : 'Top Secteur'}</p>
            <p className="text-xl font-black text-[hsl(var(--foreground))]">{stats?.top_sectors?.[0]?.name || 'Audit & Conseil'}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Building2 size={24} />
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm flex items-center justify-between group hover:border-purple-500/50 transition-colors">
          <div>
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">{isRtl ? 'متوسط الراتب' : 'Salaire Moyen'}</p>
            <p className="text-xl font-black text-[hsl(var(--foreground))]">{stats?.average_starting_salary || '12 000 MAD'}</p>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Briefcase size={24} />
          </div>
        </div>
      </div>

      {/* Directory Content */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[hsl(var(--border))] flex flex-wrap gap-4 items-center justify-between bg-[hsl(var(--muted)/30)]">
          <h2 className="font-bold text-lg flex items-center gap-2 text-[hsl(var(--foreground))] px-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600"><GraduationCap size={18} /></div>
            {isRtl ? 'دليل الخريجين' : 'Annuaire des Lauréats'}
          </h2>
          
          <div className="flex gap-3">
            <div className="w-64">
              <Input 
                placeholder={isRtl ? 'بحث بالاسم أو الشركة...' : 'Rechercher par nom, entreprise...'} 
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

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-[hsl(var(--muted)/10)]">
          {filteredAlumni.map((alumni) => (
            <div key={alumni.id} className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 end-0 w-16 h-16 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none"></div>
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] font-bold text-xl shrink-0 relative">
                  {alumni.first_name[0]}{alumni.last_name[0]}
                  {alumni.verified && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[hsl(var(--background))] rounded-full flex items-center justify-center text-white" title="Profil vérifié">
                      <CheckCircle2 size={10} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[hsl(var(--foreground))] line-clamp-1">{alumni.last_name} {alumni.first_name}</h3>
                  <p className="text-sm text-amber-600 font-medium">Promo {alumni.promotion} • {alumni.filiere}</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <Briefcase size={14} className="shrink-0" />
                  <span className="font-medium text-[hsl(var(--foreground))] line-clamp-1">{alumni.role}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <Building2 size={14} className="shrink-0" />
                  <span className="line-clamp-1">{alumni.company}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <MapPin size={14} className="shrink-0" />
                  <span>{alumni.city}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-[hsl(var(--border))]">
                <Button variant="outline" size="sm" className="flex-1 bg-[#0A66C2]/10 border-transparent text-[#0A66C2] hover:bg-[#0A66C2]/20 h-9" icon={<Link size={16}/>}>
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm" className="h-9 px-3 bg-[hsl(var(--muted))] border-transparent" title="Contacter">
                  <Mail size={16} />
                </Button>
              </div>
            </div>
          ))}

          {filteredAlumni.length === 0 && (
            <div className="col-span-full py-12 text-center text-[hsl(var(--muted-foreground))] font-medium">
              <div className="flex flex-col items-center gap-2">
                <GraduationCap className="w-8 h-8 opacity-20" />
                {isRtl ? 'لم يتم العثور على أي خريج' : 'Aucun lauréat trouvé.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
