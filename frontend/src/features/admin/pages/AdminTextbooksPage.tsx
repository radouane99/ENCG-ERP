import { useState } from 'react'
import { Book, Sparkles, Filter, Calendar, Users, GraduationCap } from 'lucide-react'
import CustomSelect from '@/shared/components/ui/CustomSelect'

export default function AdminTextbooksPage() {
  const [teacher, setTeacher] = useState('all')
  const [group, setGroup] = useState('all')
  const [nature, setNature] = useState('all')

  const textbooks = [
    { 
      id: 1, 
      date: '31/05/2026', 
      time: '10:00 - 12:00',
      teacher: 'Dr. Radouane El Asri', 
      department: 'Management & Systèmes d\'Information',
      module: 'Management des Systèmes d\'Information (MSI)', 
      group: 'Tronc Commun S2 - Groupe 1', 
      nature: 'TD', 
      objective: 'Résolution des cas pratiques et modélisation des processus métiers.' 
    },
    { 
      id: 2, 
      date: '30/05/2026', 
      time: '08:30 - 10:30',
      teacher: 'Pr. Salma Benjelloun', 
      department: 'Finance & Comptabilité',
      module: 'Audit Financier & Contrôle de Gestion', 
      group: 'Master CCA S8 - Groupe 2', 
      nature: 'COURS', 
      objective: 'Analyse des risques d\'audit et mise en place de la cartographie.' 
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in p-4 md:p-8 max-w-[1500px] mx-auto pb-24 font-sans">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#001A4B] to-blue-950 p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
            <Book className="w-8 h-8 md:w-10 md:h-10 text-amber-300" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
              <Sparkles className="w-4 h-4 text-amber-300" /> Supervision Pédagogique — ENCG Fès
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Cahiers de Textes Universitaires
            </h1>
            <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
              Consultez et suivez l'état d'avancement des enseignements, les objectifs pédagogiques et les séances saisies par le corps professoral.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar with CustomSelect */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
          <Filter className="w-4 h-4 text-primary" />
          <span>Filtres de Supervision</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Enseignant</label>
            <CustomSelect
              value={teacher}
              onChange={setTeacher}
              placeholder="Tous les professeurs"
              options={[
                { value: 'all', label: 'Tous les professeurs', badge: 'TOUS' },
                { value: '1', label: 'Dr. Radouane El Asri', badge: 'PROF' },
                { value: '2', label: 'Pr. Salma Benjelloun', badge: 'PROF' },
                { value: '3', label: 'Dr. Karim Tazi', badge: 'PROF' },
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Groupe / Section</label>
            <CustomSelect
              value={group}
              onChange={setGroup}
              placeholder="Tous les groupes"
              options={[
                { value: 'all', label: 'Tous les groupes', badge: 'TOUS' },
                { value: 'tc1', label: 'Tronc Commun S2 - Groupe 1', badge: 'S2' },
                { value: 'mcca', label: 'Master CCA S8 - Groupe 2', badge: 'S8' },
                { value: 'mcm', label: 'Management Commercial S6 - Groupe 1', badge: 'S6' },
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Nature de Séance</label>
            <CustomSelect
              value={nature}
              onChange={setNature}
              placeholder="Toutes les natures"
              options={[
                { value: 'all', label: 'Toutes les natures', badge: 'TOUS' },
                { value: 'cours', label: 'Cours Magistral (Amphi)', badge: 'COURS' },
                { value: 'td', label: 'Travaux Dirigés (TD)', badge: 'TD' },
                { value: 'tp', label: 'Travaux Pratiques (TP Labo)', badge: 'TP' },
                { value: 'rattrapage', label: 'Séance de Rattrapage', badge: 'EXTRA' },
              ]}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden p-6 md:p-8">
        <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
          <span>Historique des Séances Enregistrées</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] font-black text-muted-foreground uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-5 py-4">Date & Créneau</th>
                <th className="px-5 py-4">Enseignant & Département</th>
                <th className="px-5 py-4">Module & Groupe</th>
                <th className="px-5 py-4">Nature</th>
                <th className="px-5 py-4">Objectif Pédagogique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {textbooks.map((row) => (
                <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-5">
                    <div className="font-black text-foreground text-sm">{row.date}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{row.time}</div>
                  </td>
                  <td className="px-5 py-5">
                    <div className="font-bold text-foreground text-sm">{row.teacher}</div>
                    <div className="text-[11px] text-muted-foreground">{row.department}</div>
                  </td>
                  <td className="px-5 py-5">
                    <div className="font-bold text-primary text-sm">{row.module}</div>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">{row.group}</div>
                  </td>
                  <td className="px-5 py-5">
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase">
                      {row.nature}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-muted-foreground font-medium text-xs max-w-md">
                    {row.objective}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
