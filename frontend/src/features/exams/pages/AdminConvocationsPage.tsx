import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Mail, Printer, CheckCircle, Download, Clock, Zap, FileDown, CheckCircle2, Loader2, Users } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { examsApi } from '@shared/api/exams'
import { useTranslation } from 'react-i18next'

export default function AdminConvocationsPage() {
  const { t, i18n } = useTranslation('exams')
  const isRtl = i18n.language === 'ar'

  const [activeTab, setActiveTab] = useState<'students' | 'surveillants' | 'disponibilites'>('students')
  const [showBanner, setShowBanner] = useState(false)
  const [bannerMessage, setBannerMessage] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [professeurs, setProfesseurs] = useState<any[]>([])
  const [isLoadingProfs, setIsLoadingProfs] = useState(false)

  useEffect(() => {
    if (activeTab === 'disponibilites') {
      fetchProfessors()
    }
  }, [activeTab])

  const fetchProfessors = async () => {
    try {
      setIsLoadingProfs(true)
      const data = await examsApi.getProfessorAvailabilities()
      setProfesseurs(data)
    } catch (error) {
      console.error('Failed to fetch professors:', error)
    } finally {
      setIsLoadingProfs(false)
    }
  }

  const handleAutoAssign = async () => {
    setIsAssigning(true)
    try {
      // Assuming session ID 1 for MVP
      const res = await examsApi.autoAssignProctors(1)
      setBannerMessage(res.message || t('exams:convocations.messages.assign_success'))
      setShowBanner(true)
      setTimeout(() => setShowBanner(false), 5000)
    } catch (error: any) {
      setBannerMessage(error.response?.data?.message || t('exams:convocations.messages.assign_error'))
      setShowBanner(true)
      setTimeout(() => setShowBanner(false), 5000)
    } finally {
      setIsAssigning(false)
    }
  }

  const [students, setStudents] = useState<any[]>([])
  const [surveillants, setSurveillants] = useState<any[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const [stats, setStats] = useState({
    students: { total: 0, total_seatings: 0, generated: 0, sent: 0, downloaded: 0 },
    surveillants: { total: 0, generated: 0, sent: 0, confirmed: 0 }
  })

  useEffect(() => {
    if (activeTab === 'disponibilites') {
      fetchProfessors()
    } else if (activeTab === 'students' || activeTab === 'surveillants') {
      fetchExamDetails()
    }
  }, [activeTab])

  const fetchExamDetails = async () => {
    try {
      setIsLoadingDetails(true)
      const statsData = await examsApi.getConvocationSessionStats(1) // Demo with session 1
      if (statsData) setStats(statsData)

      const listData = await examsApi.getConvocationSessionList(1)
      if (listData) {
        setStudents(listData.students || [])
        setSurveillants(listData.surveillants || [])
      }
    } catch (error) {
      console.error('Failed to fetch exam details:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleGenerateSession = async () => {
    try {
      setIsLoadingDetails(true)
      const res = await examsApi.generateSession(1);
      setBannerMessage(res.message || "Convocations générées avec succès.");
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
      await fetchExamDetails();
    } catch (e: any) {
      console.error(e);
      setBannerMessage(e.response?.data?.message || "Erreur lors de la génération.");
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
    } finally {
      setIsLoadingDetails(false)
    }
  };

  const handleSendEmails = async () => {
    try {
      setIsLoadingDetails(true)
      const res = await examsApi.sendSessionEmails(1);
      setBannerMessage(res.message || "Emails envoyés avec succès.");
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
      await fetchExamDetails();
    } catch (e: any) {
      console.error(e);
      setBannerMessage(e.response?.data?.message || "Erreur lors de l'envoi.");
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
    } finally {
      setIsLoadingDetails(false)
    }
  };

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] italic flex items-center gap-3">📋 {t('exams:convocations.title')}</h1>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          01/07/2026
        </div>
      </div>

      {showBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 mb-6">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{bannerMessage}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 mb-6 flex gap-6">
        <div className="flex-1 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('exams:convocations.filters.session')}</label>
          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 font-bold outline-none">
            <option>Normale Automne — 2025/2026</option>
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('exams:convocations.filters.filiere')}</label>
          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 font-bold outline-none">
            <option>{t('exams:convocations.filters.filiere_empty')}</option>
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('exams:convocations.filters.status')}</label>
          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 font-bold outline-none">
            <option>{t('exams:convocations.filters.status_empty')}</option>
          </select>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0f2863] rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-32 relative overflow-hidden">
          <FileText className="absolute top-4 left-4 w-6 h-6 text-white/20" />
          <p className="text-4xl font-black mb-1 relative z-10">{stats.students.total_seatings}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider relative z-10">{t('exams:convocations.kpi.students')}</p>
        </div>
        <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-32 relative overflow-hidden">
          <FileText className="absolute top-4 left-4 w-6 h-6 text-white/20" />
          <p className="text-4xl font-black mb-1 relative z-10">{stats.students.generated}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider relative z-10">{t('exams:convocations.kpi.generated')}</p>
        </div>
        <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-32 relative overflow-hidden">
          <Mail className="absolute top-4 left-4 w-6 h-6 text-white/20" />
          <p className="text-4xl font-black mb-1 relative z-10">{stats.students.sent}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider relative z-10">{t('exams:convocations.kpi.sent')}</p>
        </div>
        <div className="bg-purple-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-32 relative overflow-hidden">
          <CheckCircle2 className="absolute top-4 left-4 w-6 h-6 text-white/20" />
          <p className="text-4xl font-black mb-1 relative z-10">{stats.students.downloaded}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider relative z-10">{t('exams:convocations.kpi.downloaded')}</p>
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
        >🎓 {t('exams:convocations.tabs.students')} ({stats.students.total_seatings})</button>
        <button 
          onClick={() => setActiveTab('surveillants')}
          className={cn(
            "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors",
            activeTab === 'surveillants' ? "bg-white text-[#0f2863] shadow-sm" : "text-slate-500 hover:bg-white/50"
          )}
        >🧑‍🏫 {t('exams:convocations.tabs.surveillants')} ({stats.surveillants.total})</button>
        <button 
          onClick={() => setActiveTab('disponibilites')}
          className={cn(
            "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors",
            activeTab === 'disponibilites' ? "bg-white text-[#0f2863] shadow-sm" : "text-slate-500 hover:bg-white/50"
          )}
        >📅 {t('exams:convocations.tabs.disponibilites')} ({professeurs.length > 0 ? professeurs.length : 5})</button>
      </div>

      {activeTab === 'students' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Actions & Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" /> {t('exams:convocations.students.actions_title')}</h3>
            <div className="flex gap-3 mb-6">
              <button disabled={isLoadingDetails} onClick={handleGenerateSession} className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors">
                <FileText className="w-3.5 h-3.5" /> {t('exams:convocations.students.btn_generate_all')}</button>
              <button disabled={isLoadingDetails} onClick={handleSendEmails} className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors">
                <Mail className="w-3.5 h-3.5" /> {t('exams:convocations.students.btn_send_all')}</button>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors ml-2">
                <Printer className="w-3.5 h-3.5" /> {t('exams:convocations.students.btn_print_all')}</button>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>{t('exams:convocations.students.progress')}</span>
                <span>8%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">{t('exams:convocations.students.list_title')}</h2>
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{t('exams:convocations.students.total_badge', { total: 750 })}</span>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-[9px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.students.table.student')}</th>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.students.table.filiere')}</th>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.students.table.exam')}</th>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.students.table.date')}</th>
                  <th className="px-6 py-4 font-bold text-center">{t('exams:convocations.students.table.status')}</th>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.students.table.ref')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingDetails ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold">
                      Aucune convocation trouvée.
                    </td>
                  </tr>
                ) : students.map((st, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{st.student_name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 w-48">{st.filiere} ({st.group_name})</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{st.exam_name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{st.exam_date} {st.start_time}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex px-3 py-1 rounded-full text-[10px] font-bold", st.qr_token ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600")}>
                        {st.qr_token ? t('exams:convocations.students.table.status_generated') : t('exams:convocations.students.table.status_pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-400 font-bold">{st.qr_token?.substring(0, 8) || '-'}</td>
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
              <p className="text-3xl font-black mb-1">{stats.surveillants.total}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider">{t('exams:convocations.kpi.profs')}</p>
            </div>
            <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-24">
              <p className="text-3xl font-black mb-1">{stats.surveillants.generated}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider">{t('exams:convocations.kpi.generated')}</p>
            </div>
            <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-24">
              <p className="text-3xl font-black mb-1">{stats.surveillants.sent}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider">{t('exams:convocations.kpi.sent')}</p>
            </div>
            <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-end h-24">
              <p className="text-3xl font-black mb-1">{stats.surveillants.confirmed}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider">{t('exams:convocations.kpi.confirmed')}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center"><CheckCircle2 className="w-3 h-3" /></span> {t('exams:convocations.surveillants.actions_title')}</h3>
            <div className="flex flex-wrap gap-3">
              <button disabled={isAssigning} onClick={handleAutoAssign} className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors">
                {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />} AFFECTATION AUTO DES SURVEILLANTS
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors">
                <FileText className="w-3.5 h-3.5" /> {t('exams:convocations.surveillants.btn_generate')}</button>
              <button className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors">
                <Mail className="w-3.5 h-3.5" /> {t('exams:convocations.surveillants.btn_send')}</button>
              <Link to="/admin/convocations/print-professors?session_id=1" className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors ml-2">
                <Printer className="w-3.5 h-3.5" /> {t('exams:convocations.surveillants.btn_print')}</Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">{t('exams:convocations.surveillants.list_title')}</h2>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-[9px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.surveillants.table.prof')}</th>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.students.table.exam')}</th>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.surveillants.table.datetime')}</th>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.surveillants.table.room')}</th>
                  <th className="px-6 py-4 font-bold text-center">{t('exams:convocations.surveillants.table.role')}</th>
                  <th className="px-6 py-4 font-bold text-center">{t('exams:convocations.students.table.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingDetails ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : surveillants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold">
                      Aucun surveillant affecté.
                    </td>
                  </tr>
                ) : surveillants.map((sv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">Prof. {sv.professor_name}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 w-48">{sv.exam_name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{sv.exam_date} {sv.start_time}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{sv.room_name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-bold">
                        {sv.role || 'Surveillant'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex px-3 py-1 rounded-full text-[9px] font-bold", sv.has_attended ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600")}>
                        {sv.has_attended ? 'Présent' : 'Générée'}
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
              <h2 className="text-base font-bold text-slate-800">{t('exams:convocations.disponibilites.title')}</h2>
              <button className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline">
{t('exams:convocations.disponibilites.view_details')}
</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-[9px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.surveillants.table.prof')}</th>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.disponibilites.table.dept')}</th>
                  <th className="px-6 py-4 font-bold text-center">{t('exams:convocations.disponibilites.table.days')}</th>
                  <th className="px-6 py-4 font-bold">{t('exams:convocations.disponibilites.table.dates')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingProfs ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : professeurs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold">
                      Aucune disponibilité trouvée.
                    </td>
                  </tr>
                ) : professeurs.map((prof, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{prof.nom}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{prof.dept || t('exams:convocations.disponibilites.table.no_dept')}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold">
                        {prof.creneaux}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="inline-flex bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {prof.date}
                        </span>
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
