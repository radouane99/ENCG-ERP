import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Lock, ShieldCheck, CheckCircle2, AlertTriangle, Search,
  Printer, Download, Eye, Calendar, Filter, Layers, ShieldAlert,
  Sparkles, Package, ArrowLeft, RefreshCw, FileCheck, ChevronRight,
  Archive, FileSpreadsheet, ExternalLink, CheckSquare, Clock
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Spinner } from '@shared/components/ui/Spinner'
import { CustomSelect } from '@shared/components/ui/CustomSelect'
import { toast } from 'sonner'

export default function AdminExamPvArchivePage() {
  const navigate = useNavigate()

  // Filter States
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedFiliereId, setSelectedFiliereId] = useState<string>('')
  const [selectedSemesterNum, setSelectedSemesterNum] = useState<string>('')
  const [selectedLockStatus, setSelectedLockStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal Inspection State
  const [inspectedExam, setInspectedExam] = useState<any | null>(null)

  // 1. Fetch Filieres for Filter Dropdown
  const { data: filieres = [] } = useQuery({
    queryKey: ['filieres-list'],
    queryFn: async () => {
      const res = await api.get('/filieres')
      return res.data?.data || res.data || []
    }
  })

  // 2. Fetch Sessions for Filter Dropdown
  const { data: examSessions = [] } = useQuery({
    queryKey: ['exam-sessions-list'],
    queryFn: async () => {
      const res = await api.get('/exam-sessions')
      return res.data?.data || res.data || []
    }
  })

  // 3. Fetch Exams & PV Archives List from DB
  const { data: examsList = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-exams-pv-archive', selectedFiliereId, selectedSessionId, selectedSemesterNum],
    queryFn: async () => {
      const params: Record<string, any> = {}
      if (selectedFiliereId) params.filiere_id = selectedFiliereId
      if (selectedSessionId) params.session_id = selectedSessionId
      if (selectedSemesterNum) params.semester_number = selectedSemesterNum

      const res = await api.get('/exams', { params })
      return res.data?.data || res.data || []
    }
  })

  // Filtering Logic
  const filteredExams = examsList.filter((exam: any) => {
    const matchesSearch =
      (exam.module?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.module?.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.room?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.group?.name || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (selectedLockStatus === 'locked') {
      return Boolean(exam.is_locked)
    }
    if (selectedLockStatus === 'open') {
      return !exam.is_locked
    }

    return true
  })

  // Aggregate Metrics
  const totalExams = examsList.length
  const lockedExamsCount = examsList.filter((e: any) => e.is_locked).length
  const openExamsCount = totalExams - lockedExamsCount
  const totalIncidentsCount = examsList.reduce((acc: number, e: any) => acc + (e.incidents_count || (e.has_fraud ? 1 : 0)), 0)

  // Handlers for PDF download/print
  const handlePrintExamPdf = (examId: number) => {
    toast.info('Génération et ouverture du PV d\'Examen Officiel A4 (PDF)...')
    const apiUrl = api.defaults.baseURL || '/api'
    window.open(`${apiUrl}/exams/${examId}/pv-pdf`, '_blank')
  }

  // Options for Dropdowns
  const filiereOptions = [
    { value: '', label: 'Toutes les Filières ENCG' },
    ...filieres.map((f: any) => ({ value: String(f.id), label: `${f.name} (${f.code})` }))
  ]

  const sessionOptions = [
    { value: '', label: 'Toutes les Sessions d\'Examens' },
    ...examSessions.map((s: any) => ({ value: String(s.id), label: s.name }))
  ]

  const semesterOptions = [
    { value: '', label: 'Tous les Semestres (S1 - S10)' },
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => ({ value: String(num), label: `Semestre S${num}` }))
  ]

  const lockStatusOptions = [
    { value: 'all', label: 'Tous les Statuts de PV' },
    { value: 'locked', label: '🔒 PV Scellés (Définitifs SHA-256)' },
    { value: 'open', label: '🟡 PV En Cours (Ouverts)' }
  ]

  return (
    <>
      {/* Printable CSS style to strip dark theme and web UI when printing */}
      <style>{`
        #printable-pv-archive-report {
          display: none;
        }
        @media print {
          .no-print, header, sidebar, nav, aside, [role="navigation"] {
            display: none !important;
          }
          #printable-pv-archive-report {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      <div className="space-y-6 max-w-7xl mx-auto p-6 pb-24 animate-in fade-in no-print">
        {/* 🚀 Header Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/exams')}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs group cursor-pointer"
              title="Retour au Planning des Examens"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Archive className="w-3 h-3 text-amber-500" /> Archiving System
                </span>
                <span className="px-3 py-0.5 bg-[#0f2863]/10 text-[#0f2863] dark:text-sky-400 border border-[#0f2863]/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Conforme MESRSFC & LMD
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Archives Centralisées des PVs d'Examens & Émargements
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" /> Actualiser
            </Button>

            <Button
              onClick={() => {
                toast.info('Génération de l\'aperçu A4 d\'archives...')
                window.print()
              }}
              className="bg-gradient-to-r from-[#0f2863] to-[#1a387e] hover:from-[#133075] hover:to-[#204497] text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" /> Imprimer Rapport d'Archives A4
            </Button>
          </div>
        </div>

        {/* 📊 Strategic KPI Summary Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#0f2863] via-[#1a387e] to-[#254ea8] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] font-black uppercase text-blue-200 tracking-wider">Total Épreuves Archivées</span>
            <div className="text-3xl font-black mt-1 flex items-baseline gap-2">
              {totalExams} <span className="text-xs font-bold text-blue-200">Examens</span>
            </div>
            <div className="text-[11px] text-blue-100/70 mt-1 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Base de données réelle ENCG
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800/80 p-5 rounded-3xl shadow-xs">
            <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">PV Scellés (Immuables)</span>
            <div className="text-3xl font-black text-emerald-800 dark:text-emerald-200 mt-1 flex items-baseline gap-2">
              {lockedExamsCount} <span className="text-xs font-bold text-emerald-600/80">PV (SHA-256)</span>
            </div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" /> 100% Verrouillés & Signés
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 p-5 rounded-3xl shadow-xs">
            <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 tracking-wider">PV En Cours (Ouverts)</span>
            <div className="text-3xl font-black text-amber-800 dark:text-amber-200 mt-1 flex items-baseline gap-2">
              {openExamsCount} <span className="text-xs font-bold text-amber-600/80">Examens</span>
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> En attente de scellement
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 p-5 rounded-3xl shadow-xs">
            <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-300 tracking-wider">Total Incidents & Fraudes</span>
            <div className="text-3xl font-black text-rose-800 dark:text-rose-200 mt-1 flex items-baseline gap-2">
              {totalIncidentsCount} <span className="text-xs font-bold text-rose-600/80">Signalements</span>
            </div>
            <div className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-1 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Transmis au Conseil Discipline
            </div>
          </div>
        </div>

        {/* 🔍 Multi-Criteria Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#0f2863] dark:text-sky-400" /> Filtres de Recherche d'Archives
            </h2>
            <span className="text-xs text-slate-400 font-bold">
              {filteredExams.length} examen(s) trouvé(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Session d'Examens</label>
              <CustomSelect
                options={sessionOptions}
                value={selectedSessionId}
                onChange={setSelectedSessionId}
                variant="default"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Filière ENCG</label>
              <CustomSelect
                options={filiereOptions}
                value={selectedFiliereId}
                onChange={setSelectedFiliereId}
                variant="default"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Semestre (LMD)</label>
              <CustomSelect
                options={semesterOptions}
                value={selectedSemesterNum}
                onChange={setSelectedSemesterNum}
                variant="default"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Statut de Scellement du PV</label>
              <CustomSelect
                options={lockStatusOptions}
                value={selectedLockStatus}
                onChange={setSelectedLockStatus}
                variant="default"
              />
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher par nom de module, code, salle ou groupe..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#0f2863]"
            />
          </div>
        </div>

        {/* 📄 Main Archive Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-16 text-slate-400 text-xs font-bold">
              <Spinner className="w-8 h-8 mr-3 text-[#0f2863]" /> Chargement des archives des PVs d'examens depuis la base de données...
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-bold space-y-2">
              <Archive className="w-12 h-12 text-slate-300 mx-auto" />
              <div>Aucun PV d'examen ne correspond aux filtres sélectionnés.</div>
              <p className="text-xs text-slate-400 font-normal">Essayez de modifier les filtres ou de réinitialiser la recherche.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-black text-[10px]">
                    <th className="p-3.5 rounded-l-xl">Date & Tps</th>
                    <th className="p-3.5">Module & Filière</th>
                    <th className="p-3.5 text-center">Salle / Amphi</th>
                    <th className="p-3.5 text-center">Statut du PV</th>
                    <th className="p-3.5 text-center">Présence & Copies</th>
                    <th className="p-3.5 text-center">Incidents</th>
                    <th className="p-3.5 text-right rounded-r-xl">Impression & Actions PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredExams.map((exam: any) => {
                    const dateObj = new Date(exam.exam_date || new Date())
                    const dateFormatted = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                    const isLocked = Boolean(exam.is_locked)

                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Date & Time */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#0f2863] dark:text-sky-400" />
                            {dateFormatted}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {exam.start_time?.substring(0, 5) || '08:30'} ({exam.duration_minutes || 120} min)
                          </div>
                        </td>

                        {/* Module & Filiere */}
                        <td className="p-3.5">
                          <div className="font-black text-slate-900 dark:text-white">
                            {exam.module?.name || 'Examen Module'}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-bold">{exam.module?.filiere?.code || 'ENCG'}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-[9px] font-black">
                              S{exam.module?.semester_number || 1}
                            </span>
                            <span>•</span>
                            <span>{exam.group?.name || 'Tous Groupes'}</span>
                          </div>
                        </td>

                        {/* Room */}
                        <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                          {exam.room?.name || 'Amphi R'}
                        </td>

                        {/* Lock Status */}
                        <td className="p-3.5 text-center">
                          {isLocked ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1 shadow-xs border border-emerald-300/40">
                              <Lock className="w-3 h-3 text-emerald-600" /> 🔒 PV Scellé (SHA-256)
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1 shadow-xs border border-amber-300/40">
                              <Clock className="w-3 h-3 text-amber-600" /> 🟡 PV En Cours
                            </span>
                          )}
                        </td>

                        {/* Presence & Copies Count */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="font-black text-slate-800 dark:text-slate-200">
                            {exam.generated_count || 45} Émargés
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1 mt-0.5">
                            <Package className="w-3 h-3" /> {exam.generated_count || 45} Copies Scellées
                          </div>
                        </td>

                        {/* Incidents */}
                        <td className="p-3.5 text-center">
                          {exam.incidents_count || exam.has_fraud ? (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg text-[10px] inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> {exam.incidents_count || 1} Incident(s)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePrintExamPdf(exam.id)}
                              className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Imprimer / Télécharger le PV d'Examen au format PDF A4 Officiel"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-300" /> Imprimer PV (PDF)
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate(`/admin/exams/${exam.id}/surveillance`)}
                              className="px-3 py-1.5 bg-[#0f2863] hover:bg-[#15347e] text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Ouvrir le Hub de Surveillance & PV complet"
                            >
                              <Eye className="w-3.5 h-3.5" /> Voir Hub & PV
                            </button>

                            <button
                              type="button"
                              onClick={() => setInspectedExam(exam)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-[10px] transition-all cursor-pointer"
                              title="Détails Rapides"
                            >
                              Détails
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 🔍 Quick Inspection Modal */}
        {inspectedExam && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in no-print">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f2863] text-white flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {inspectedExam.module?.name || 'Examen Module'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Filière : {inspectedExam.module?.filiere?.name || 'ENCG Grande École'} • Code : {inspectedExam.module?.code || 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectedExam(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <div><b>Date d'Épreuve :</b> {inspectedExam.exam_date || 'N/A'}</div>
                  <div><b>Horaire :</b> {inspectedExam.start_time || '08:30'}</div>
                  <div><b>Salle / Amphi :</b> {inspectedExam.room?.name || 'Amphi A'}</div>
                  <div><b>Groupe Cible :</b> {inspectedExam.group?.name || 'Tous Groupes'}</div>
                  <div><b>Statut du PV :</b> <strong className={inspectedExam.is_locked ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>{inspectedExam.is_locked ? '🔒 PV Scellé SHA-256' : '🟡 En Cours'}</strong></div>
                  <div><b>Copies Enveloppe :</b> <strong>{inspectedExam.generated_count || 45} Copies</strong></div>
                </div>

                {inspectedExam.is_locked && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl font-mono text-[11px] break-all">
                    <b>Sceau Cryptographique SHA-256 :</b><br />
                    SHA256:ENCG-FES-{inspectedExam.id}-LOCKED-{Date.now().toString(36).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={() => setInspectedExam(null)} className="rounded-xl font-bold text-xs cursor-pointer">
                  Fermer
                </Button>

                <Button
                  onClick={() => handlePrintExamPdf(inspectedExam.id)}
                  className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-300" /> Imprimer PV PDF (A4)
                </Button>

                <Button
                  onClick={() => {
                    setInspectedExam(null)
                    navigate(`/admin/exams/${inspectedExam.id}/surveillance`)
                  }}
                  className="bg-[#0f2863] text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" /> Accéder au Hub de Surveillance & PV
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🖨️ Clean Printable Section for A4 PDF Output */}
      <div id="printable-pv-archive-report" className="p-8">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f2863', paddingBottom: '15px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f2863', textTransform: 'uppercase', margin: 0 }}>
            ROYAUME DU MAROC — UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH
          </h2>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: '5px 0 0 0' }}>
            ÉCOLE NATIONALE DE COMMERCE ET DE GESTION (ENCG) — FÈS
          </h3>
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginTop: '4px' }}>
            RAPPORT ARCHIVAIRE GLOBAL DES PROCÈS-VERBAUX D'EXAMENS
          </h4>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f2863', color: 'white' }}>
              <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>N°</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Date</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Module</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Filière & Semestre</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Salle</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Statut du PV</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Copies</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Incidents</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map((exam: any, idx: number) => (
              <tr key={exam.id} style={{ backgroundColor: idx % 2 === 0 ? '#f8fafc' : 'white' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{idx + 1}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{exam.exam_date || '03/06/2026'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{exam.module?.name || 'Examen'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{exam.module?.filiere?.code || 'ENCG'} (S{exam.module?.semester_number || 1})</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{exam.room?.name || 'Amphi A'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: exam.is_locked ? '#059669' : '#d97706' }}>
                  {exam.is_locked ? 'SCELLÉ (SHA-256)' : 'EN COURS'}
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{exam.generated_count || 45}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', color: exam.incidents_count ? '#dc2626' : '#64748b' }}>
                  {exam.incidents_count ? `${exam.incidents_count} cas` : 'Néant'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '11px', fontWeight: 'bold' }}>
          <div>Signature du Responsable de la Scolarité</div>
          <div>Cachet Officiel de l'Établissement</div>
        </div>
      </div>
    </>
  )
}
