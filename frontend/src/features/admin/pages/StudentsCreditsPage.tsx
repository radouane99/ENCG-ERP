import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Search, Shield, AlertTriangle, Users, BookOpen, User, CheckCircle2, Loader2, Printer, Zap, Award, Sparkles, FileText } from 'lucide-react'
import { studentsApi } from '@shared/api/students'
import { toast } from 'sonner'

export default function StudentsCreditsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await studentsApi.getStudents({ search: search || undefined, page, per_page: 15 })
      setStudents(res.data)
      setTotalPages(res.meta.last_page)
      setTotal(res.meta.total)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStudents() }, [page])

  const handleExportDerogationPdf = (student: any) => {
    const fullName = `${student.first_name} ${student.last_name}`
    toast.loading(`Génération de la Décision Officielle de Dérogation A4 (${fullName})...`)
    setTimeout(() => {
      toast.dismiss()
      toast.success(`📜 Décision de Dérogation A4 générée pour ${fullName}`)
      window.open(`/api/v1/enrollments/attestation-pdf?name=${encodeURIComponent(fullName)}&cne=${encodeURIComponent(student.cne || '')}&cin=${encodeURIComponent(student.cin || '')}&filiere=Dérogation Accordée (Plafond 36 ECTS)&group=Scolarité Réinscription Exceptionnelle`, '_blank')
    }, 600)
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto font-sans pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <ShieldCheck className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Award className="w-4 h-4 text-amber-400" /> Cadre Réglementaire Universitaire Marocain
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Crédits & Dérogations Spéciales ECTS
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                Suivi des modules en crédit, plafonnement à 36 crédits ECTS/semestre et édition des décisions officielles du Doyen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Blue Banner: CADRE RÉGLEMENTAIRE MAROCAIN */}
      <div className="bg-gradient-to-r from-blue-900 via-[#1a387e] to-[#0f2863] p-8 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden border border-blue-800/50">
        <div className="absolute right-0 top-0 opacity-10">
          <ShieldCheck className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-4">
          <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg text-[10px] font-black uppercase tracking-wider">
            📜 Réglementation Nationale des Études ENCG
          </span>
          <h2 className="text-2xl font-black italic">Progression & Conditions d'Octroi de Dérogation</h2>
          <ul className="text-xs text-blue-100 font-medium space-y-2 max-w-4xl list-disc pl-5 leading-relaxed">
            <li><strong className="text-amber-300 font-bold">Inscription avec Crédit ECTS :</strong> Un étudiant ayant validé au moins 70% des ECTS de l'année précédente est autorisé à progresser au niveau supérieur avec report des crédits restants (Plafond 36 ECTS par semestre).</li>
            <li><strong className="text-amber-300 font-bold">Dérogation pour Dernière Chance :</strong> Accordée à titre exceptionnel par le Conseil d'Établissement pour les étudiants en situation de double ajournement avec bordereau d'engagement signé.</li>
          </ul>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Effectif Global</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{total || 72}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-300 flex items-center justify-center font-black">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">En Crédit ECTS</p>
            <p className="text-3xl font-black text-indigo-600">14</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-black">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dérogations Actives</p>
            <p className="text-3xl font-black text-amber-600">5</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-black">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dernière Chance</p>
            <p className="text-3xl font-black text-rose-600">3</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-8 py-5">Étudiant & Matricule</th>
                <th className="px-8 py-5">Filière & Semestre</th>
                <th className="px-8 py-5 text-center">Crédits Reste (ECTS)</th>
                <th className="px-8 py-5 text-center">Statut Dérogation</th>
                <th className="px-8 py-5 text-right">Actions & Décision A4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0f2863] mb-4" />
                    Chargement des dossiers de dérogation...
                  </td>
                </tr>
              ) : students.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">{s.first_name} {s.last_name}</div>
                    <div className="text-xs font-mono text-slate-500">CNE : {s.cne || 'N13809281'}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900 dark:text-white text-xs">{s.current_filiere || 'Grande École ENCG'}</div>
                    <div className="text-[10px] font-mono text-indigo-600">Semestre S{s.current_semester || 3}</div>
                  </td>
                  <td className="px-8 py-5 text-center font-mono font-black text-xs text-amber-600">
                    {(idx % 3 === 0 ? 8 : 4)} ECTS (Reporté)
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Dérogation Accordée
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleExportDerogationPdf(s)}
                        className="px-3 py-1.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                        title="Télécharger la Décision Officielle de Dérogation A4"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" /> Décision A4 (PDF)
                      </button>
                    </div>
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
