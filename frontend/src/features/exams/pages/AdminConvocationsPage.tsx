import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Mail, Printer, CheckCircle, Download, Clock, Zap, FileDown, CheckCircle2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function AdminConvocationsPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'surveillants' | 'disponibilites'>('students')
  const [showBanner, setShowBanner] = useState(false)

  const handleAutoAssign = () => {
    setShowBanner(true)
    setTimeout(() => setShowBanner(false), 5000)
  }

  const students = [
    { nom: 'Omar Tahiri', filiere: 'Génie Informatique - Groupe 2', examen: 'SQL SERVER BASE DE DONNEE', date: '03/07/2026 11:00', statut: 'Générée', ref: 'CONV-2026-000589' },
    { nom: 'Salma El Fassi', filiere: 'Génie Informatique - Groupe 2', examen: 'SQL SERVER BASE DE DONNEE', date: '03/07/2026 11:00', statut: 'Générée', ref: 'CONV-2026-000590' },
    { nom: 'Othmane Sekkat', filiere: 'Génie Informatique - Groupe 2', examen: 'SQL SERVER BASE DE DONNEE', date: '03/07/2026 11:00', statut: 'Générée', ref: 'CONV-2026-000591' },
    { nom: 'Zineb Alaoui', filiere: 'Génie Informatique - Groupe 2', examen: 'SQL SERVER BASE DE DONNEE', date: '03/07/2026 11:00', statut: 'Générée', ref: 'CONV-2026-000592' },
    { nom: 'Mohammed Bennis', filiere: 'Génie Informatique - Groupe 2', examen: 'GAMING', date: '04/07/2026 09:00', statut: 'Générée', ref: 'CONV-2026-000606' },
  ]

  const surveillants = [
    { nom: 'Radouane el asri', examen: 'Introduction - Génie Civil', date: '01/07/2026 09:00', salle: 'Labo Info 1', role: 'Principal', statut: 'Confirmée' },
    { nom: 'Prof. Hicham Alaoui', examen: 'Avancé - Marketing & Commerce', date: '02/07/2026 09:00', salle: 'Salle TD 02', role: 'Principal', statut: 'Générée' },
    { nom: 'Radouane el asri', examen: 'Introduction - Marketing & Commerce', date: '01/07/2026 16:30', salle: 'Labo Info 1', role: 'Principal', statut: 'Confirmée' },
    { nom: 'Prof. Salma Tazi', examen: 'Avancé - Marketing & Commerce', date: '01/07/2026 16:30', salle: 'Salle TD 02', role: 'Principal', statut: 'Générée' },
    { nom: 'Prof. Fatima Zahra Bennani', examen: 'Introduction - Marketing & Commerce', date: '01/07/2026 14:30', salle: 'Labo Info 1', role: 'Principal', statut: 'Générée' },
  ]

  const disponibilites = [
    { nom: 'Radouane el asri', dept: 'Génie Informatique', jours: 7, dates: ['01/07', '02/07', '03/07', '04/07', '05/07'], extra: '+2' },
    { nom: 'Prof. Fatima Zahra Bennani', dept: 'Génie Civil', jours: 6, dates: ['01/07', '02/07', '03/07', '04/07', '05/07'], extra: '+1' },
    { nom: 'Prof. Youssef El Mansouri', dept: 'Génie Électrique', jours: 4, dates: ['01/07', '02/07', '03/07', '04/07'] },
    { nom: 'Prof. Salma Tazi', dept: 'Économie', jours: 5, dates: ['01/07', '02/07', '03/07', '06/07', '07/07'] },
    { nom: 'Prof. Hicham Alaoui', dept: 'Marketing', jours: 5, dates: ['01/07', '02/07', '03/07', '05/07', '06/07'] },
  ]

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] italic flex items-center gap-3">
          📋 Gestion des Convocations d'Examens
        </h1>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          01/07/2026
        </div>
      </div>

      {showBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 mb-6">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Affectation automatique : 0 surveillant(s) affecté(s), 30 examen(s) déjà couverts.</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 mb-6 flex gap-6">
        <div className="flex-1 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SESSION D'EXAMENS</label>
          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 font-bold outline-none">
            <option>Normale Automne — 2025/2026</option>
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">FILIÈRE</label>
          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 font-bold outline-none">
            <option>Toutes les filières</option>
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">STATUT</label>
          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 font-bold outline-none">
            <option>Tous les statuts</option>
          </select>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0f2863] rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-32 relative overflow-hidden">
          <FileText className="absolute top-4 left-4 w-6 h-6 text-white/20" />
          <p className="text-4xl font-black mb-1 relative z-10">750</p>
          <p className="text-[10px] font-bold uppercase tracking-wider relative z-10">TOTAL ÉTUDIANTS</p>
        </div>
        <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-32 relative overflow-hidden">
          <FileText className="absolute top-4 left-4 w-6 h-6 text-white/20" />
          <p className="text-4xl font-black mb-1 relative z-10">728</p>
          <p className="text-[10px] font-bold uppercase tracking-wider relative z-10">GÉNÉRÉES</p>
        </div>
        <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-32 relative overflow-hidden">
          <Mail className="absolute top-4 left-4 w-6 h-6 text-white/20" />
          <p className="text-4xl font-black mb-1 relative z-10">21</p>
          <p className="text-[10px] font-bold uppercase tracking-wider relative z-10">ENVOYÉES</p>
        </div>
        <div className="bg-purple-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-32 relative overflow-hidden">
          <CheckCircle2 className="absolute top-4 left-4 w-6 h-6 text-white/20" />
          <p className="text-4xl font-black mb-1 relative z-10">1</p>
          <p className="text-[10px] font-bold uppercase tracking-wider relative z-10">TÉLÉCHARGÉES</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={() => setActiveTab('students')}
          className={cn(
            "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors",
            activeTab === 'students' ? "bg-white text-[#0f2863] shadow-sm" : "text-slate-500 hover:bg-white/50"
          )}
        >
          🎓 ÉTUDIANTS (750)
        </button>
        <button 
          onClick={() => setActiveTab('surveillants')}
          className={cn(
            "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors",
            activeTab === 'surveillants' ? "bg-white text-[#0f2863] shadow-sm" : "text-slate-500 hover:bg-white/50"
          )}
        >
          🧑‍🏫 SURVEILLANTS (28)
        </button>
        <button 
          onClick={() => setActiveTab('disponibilites')}
          className={cn(
            "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors",
            activeTab === 'disponibilites' ? "bg-white text-[#0f2863] shadow-sm" : "text-slate-500 hover:bg-white/50"
          )}
        >
          📅 DISPONIBILITÉS (5)
        </button>
      </div>

      {activeTab === 'students' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Actions & Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" /> Actions rapides — Étudiants
            </h3>
            <div className="flex gap-3 mb-6">
              <button className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors">
                <FileText className="w-3.5 h-3.5" /> GÉNÉRER TOUTES LES CONVOCATIONS
              </button>
              <button className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors">
                <Mail className="w-3.5 h-3.5" /> ENVOYER TOUS LES EMAILS
              </button>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors ml-2">
                <Printer className="w-3.5 h-3.5" /> IMPRIMER TOUTES LES CONVOCATIONS
              </button>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>Progression des envois</span>
                <span>8%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Liste des convocations étudiants</h2>
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">750 au total</span>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-[9px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 font-bold">ÉTUDIANT</th>
                  <th className="px-6 py-4 font-bold">FILIÈRE / GROUPE</th>
                  <th className="px-6 py-4 font-bold">EXAMEN</th>
                  <th className="px-6 py-4 font-bold">DATE</th>
                  <th className="px-6 py-4 font-bold text-center">STATUT</th>
                  <th className="px-6 py-4 font-bold">RÉFÉRENCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{st.nom}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 w-48">{st.filiere}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{st.examen}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{st.date}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold">
                        {st.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-400 font-bold">{st.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'surveillants' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Sub KPIs for Surveillants */}
          <div className="grid grid-cols-4 gap-4">
             <div className="bg-indigo-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-24">
              <p className="text-3xl font-black mb-1">28</p>
              <p className="text-[10px] font-bold uppercase tracking-wider">TOTAL PROFS</p>
            </div>
            <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-24">
              <p className="text-3xl font-black mb-1">23</p>
              <p className="text-[10px] font-bold uppercase tracking-wider">GÉNÉRÉES</p>
            </div>
            <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-24">
              <p className="text-3xl font-black mb-1">0</p>
              <p className="text-[10px] font-bold uppercase tracking-wider">ENVOYÉES</p>
            </div>
            <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-24">
              <p className="text-3xl font-black mb-1">5</p>
              <p className="text-[10px] font-bold uppercase tracking-wider">CONFIRMÉES</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center"><CheckCircle2 className="w-3 h-3" /></span> 
              Actions — Surveillance
            </h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleAutoAssign} className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors">
                <UsersIcon className="w-3.5 h-3.5" /> AFFECTATION AUTO DES SURVEILLANTS
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors">
                <FileText className="w-3.5 h-3.5" /> GÉNÉRER CONVOCATIONS PROFS
              </button>
              <button className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors">
                <Mail className="w-3.5 h-3.5" /> ENVOYER EMAILS PROFS
              </button>
              <Link to="/admin/convocations/print-professors?session_id=1" className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors ml-2">
                <Printer className="w-3.5 h-3.5" /> IMPRIMER CONVOCATIONS PROFS
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Convocations de surveillance</h2>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-[9px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 font-bold">PROFESSEUR</th>
                  <th className="px-6 py-4 font-bold">EXAMEN</th>
                  <th className="px-6 py-4 font-bold">DATE / HEURE</th>
                  <th className="px-6 py-4 font-bold">SALLE</th>
                  <th className="px-6 py-4 font-bold text-center">RÔLE</th>
                  <th className="px-6 py-4 font-bold text-center">STATUT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surveillants.map((sv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{sv.nom}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 w-48">{sv.examen}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{sv.date}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{sv.salle}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-bold">
                        {sv.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex px-3 py-1 rounded-full text-[9px] font-bold",
                        sv.statut === 'Confirmée' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {sv.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'disponibilites' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Disponibilités déclarées par les professeurs</h2>
              <button className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline">
                VUE DÉTAILLÉE →
              </button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-[9px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 font-bold">PROFESSEUR</th>
                  <th className="px-6 py-4 font-bold">DÉPARTEMENT</th>
                  <th className="px-6 py-4 font-bold text-center">JOURS DISPONIBLES</th>
                  <th className="px-6 py-4 font-bold">DATES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disponibilites.map((disp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{disp.nom}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{disp.dept}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold">
                        {disp.jours} jour(s)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {disp.dates.map((d, i) => (
                          <span key={i} className="inline-flex bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">
                            {d}
                          </span>
                        ))}
                        {disp.extra && (
                          <span className="text-[10px] font-bold text-slate-400 ml-1">{disp.extra}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
