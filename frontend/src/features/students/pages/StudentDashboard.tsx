import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  GraduationCap, Calendar, FileText, Upload, CheckCircle2,
  Clock, AlertCircle, Sparkles, User, MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Input } from '../../../shared/components/ui/Input';
import { cn } from '../../../shared/lib/utils';

export default function StudentDashboard() {
  const { t, i18n } = useTranslation(['students', 'common'])
  const isRtl = i18n.language === 'ar'
  const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'absences' | 'revision'>('overview')

  // Absence Form State
  const [absenceReason, setAbsenceReason] = useState('')
  const [absenceDesc, setAbsenceDesc] = useState('')
  const [absenceFile, setAbsenceFile] = useState<File | null>(null)

  // Revision Planner State
  const [modulesInput, setModulesInput] = useState('')

  // Queries
  const { data: scheduleData } = useQuery({
    queryKey: ['student-schedule'],
    queryFn: () => api.get('/student-portal/schedule').then(res => res.data.data)
  })

  const { data: gradesData, isLoading: loadingGrades } = useQuery({
    queryKey: ['student-grades'],
    queryFn: () => api.get('/student-portal/grades').then(res => res.data.data)
  })

  // Mutations
  const submitAbsenceMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('student_id', '1') // TO DO: get real user ID
      formData.append('attendance_id', '1') // TO DO: get real attendance ID
      formData.append('reason', absenceReason)
      formData.append('description', absenceDesc)
      if (absenceFile) formData.append('document', absenceFile)

      return api.post('/student-portal/absences', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: (res) => {
      toast.success(res.data.message || (t('students:dashboard.messages.absence_success')))
      setAbsenceReason('')
      setAbsenceDesc('')
      setAbsenceFile(null)
    },
    onError: () => {
      toast.error(t('students:dashboard.messages.absence_error'))
    }
  })

  const generateRevisionMutation = useMutation({
    mutationFn: () => api.post('/student/ai/revision-planner', { modules: modulesInput }),
    onSuccess: () => {
      toast.success(t('students:dashboard.messages.plan_success'))
    },
    onError: () => toast.error(t('students:dashboard.messages.plan_error'))
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-6 pb-20 animate-in">
      {/* Student Premium Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] rounded-[2rem] p-8 text-white shadow-xl shadow-[hsl(var(--color-primary))/20] relative overflow-hidden">
        <div className="absolute top-0 end-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay -mt-10 -me-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-inner">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className={cn("text-center md:text-start", isRtl && "md:text-right")}>
            <h1 className="text-3xl font-black mb-1 drop-shadow-md">Fatima ALAOUI</h1>
            <p className="text-white/80 font-medium mb-3 flex items-center justify-center md:justify-start gap-2">
              <GraduationCap size={16} /> CNE: N123456789 <span className="opacity-50">•</span> ENCG Fès
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="bg-white/20 px-4 py-1.5 rounded-xl text-xs font-bold backdrop-blur-sm shadow-sm">
                S5 - Gestion Financière et Comptable
              </span>
              <span className="bg-green-500/20 text-green-100 px-4 py-1.5 rounded-xl text-xs font-bold backdrop-blur-sm shadow-sm flex items-center gap-1 border border-green-400/30">
                <CheckCircle2 size={14} /> {t('students:dashboard.header.status_active')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/20)] flex overflow-x-auto hide-scrollbar">
          {[
            { id: 'overview', label: t('students:dashboard.tabs.overview') },
            { id: 'grades', label: t('students:dashboard.tabs.grades') },
            { id: 'absences', label: t('students:dashboard.tabs.absences') },
            { id: 'revision', label: t('students:dashboard.tabs.revision'), icon: <Sparkles size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "py-4 px-6 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2",
                activeTab === tab.id
                  ? "border-[hsl(var(--color-primary))] text-[hsl(var(--color-primary))] bg-[hsl(var(--background))]"
                  : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))/50]"
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline (Left/Right depending on RTL) */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-lg text-[hsl(var(--foreground))] flex items-center gap-2 mb-4">
                  <Calendar className="text-[hsl(var(--color-primary))]" />
                  {t('students:dashboard.overview.timeline_title')}
                </h3>

                <div className="space-y-4 relative before:absolute before:inset-0 before:ms-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[hsl(var(--border))] before:to-transparent">
                  {scheduleData?.slice(0, 2).map((cours: any, idx: number) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[hsl(var(--card))] bg-[hsl(var(--color-primary))] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Clock size={12} />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-sm hover:border-[hsl(var(--color-primary))/50] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs bg-[hsl(var(--color-primary))/10] text-[hsl(var(--color-primary))] border-none">
                            {cours.time}
                          </Badge>
                          <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{cours.type}</span>
                        </div>
                        <h4 className="font-bold text-[hsl(var(--foreground))] text-sm leading-tight mb-2">
                          {cours.module}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">
                          <span className="flex items-center gap-1"><User size={12} /> {cours.professor}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} /> {cours.room}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                  <h3 className="font-bold text-amber-600 flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5" />
                    {t('students:dashboard.overview.alerts_title')}
                  </h3>
                  <div className="bg-[hsl(var(--card))] p-3 rounded-xl border border-[hsl(var(--border))] shadow-sm text-sm font-medium text-[hsl(var(--foreground))]">
                    {t('students:dashboard.overview.alerts_text')}
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                  <h3 className="font-bold text-blue-600 flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5" />
                    {t('students:dashboard.overview.docs_title')}
                  </h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-xs bg-[hsl(var(--background))]">
                      {t('students:dashboard.overview.doc_1')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs bg-[hsl(var(--background))]">
                      {t('students:dashboard.overview.doc_2')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GRADES */}
          {activeTab === 'grades' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">{t('students:dashboard.grades.title')}</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('students:dashboard.grades.subtitle')}</p>
                </div>
                <Badge className="bg-green-500 text-white border-none">{t('students:dashboard.grades.status_validated')}</Badge>
              </div>

              {loadingGrades ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--color-primary))]"></div></div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                  <table className="w-full text-sm text-start">
                    <thead className="bg-[hsl(var(--muted)/50)] text-[hsl(var(--muted-foreground))] font-bold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">{t('students:dashboard.grades.columns.module')}</th>
                        <th className="px-6 py-4">{t('students:dashboard.grades.columns.type')}</th>
                        <th className="px-6 py-4 text-center">{t('students:dashboard.grades.columns.note')}</th>
                        <th className="px-6 py-4 text-center">{t('students:dashboard.grades.columns.result')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                      {gradesData?.length > 0 ? gradesData.map((grade: any, i: number) => (
                        <tr key={i} className="hover:bg-[hsl(var(--muted)/30)] transition-colors">
                          <td className="px-6 py-4 font-bold text-[hsl(var(--foreground))]">{grade.gradeComponent?.module?.name || 'Comptabilité Générale'}</td>
                          <td className="px-6 py-4 text-[hsl(var(--muted-foreground))]">{grade.examSession?.type || 'Contrôle Continu'}</td>
                          <td className="px-6 py-4 text-center font-black text-lg text-[hsl(var(--foreground))]">{grade.value}</td>
                          <td className="px-6 py-4 text-center">
                            {grade.value >= 10 ? (
                              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none">{t('students:dashboard.grades.pass')}</Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-none">{t('students:dashboard.grades.fail')}</Badge>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-[hsl(var(--muted-foreground))]">
                            {t('students:dashboard.grades.empty')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: ABSENCES */}
          {activeTab === 'absences' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">{t('students:dashboard.absences.title')}</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                  {t('students:dashboard.absences.subtitle')}
                </p>

                <form onSubmit={(e) => { e.preventDefault(); submitAbsenceMutation.mutate(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[hsl(var(--foreground))] mb-1.5">{t('students:dashboard.absences.reason')}</label>
                    <select
                      value={absenceReason}
                      onChange={e => setAbsenceReason(e.target.value)}
                      className="w-full border border-[hsl(var(--border))] rounded-xl px-4 py-2.5 text-sm font-semibold bg-[hsl(var(--background))] focus:ring-2 focus:ring-[hsl(var(--color-primary))/20] outline-none"
                      required
                    >
                      <option value="">{t('students:dashboard.absences.reason_select')}</option>
                      <option value="medical">{t('students:dashboard.absences.reason_medical')}</option>
                      <option value="convocation">{t('students:dashboard.absences.reason_convocation')}</option>
                      <option value="other">{t('students:dashboard.absences.reason_other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[hsl(var(--foreground))] mb-1.5">{t('students:dashboard.absences.details')}</label>
                    <textarea
                      value={absenceDesc}
                      onChange={e => setAbsenceDesc(e.target.value)}
                      className="w-full border border-[hsl(var(--border))] rounded-xl px-4 py-3 text-sm bg-[hsl(var(--background))] focus:ring-2 focus:ring-[hsl(var(--color-primary))/20] outline-none resize-none h-24"
                      placeholder={t('students:dashboard.absences.details_placeholder')}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[hsl(var(--foreground))] mb-1.5">{t('students:dashboard.absences.document')}</label>
                    <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-6 text-center hover:bg-[hsl(var(--muted)/20)] transition-colors cursor-pointer">
                      <input type="file" className="hidden" id="file-upload" onChange={(e) => setAbsenceFile(e.target.files?.[0] || null)} accept=".pdf,.jpg,.png" />
                      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                        <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                          {absenceFile ? absenceFile.name : (t('students:dashboard.absences.document_placeholder'))}
                        </span>
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={submitAbsenceMutation.isPending}
                  >
                    {t('students:dashboard.absences.submit')}
                  </Button>
                </form>
              </div>

              <div className="bg-[hsl(var(--muted)/30)] rounded-3xl p-6 border border-[hsl(var(--border))]">
                <h3 className="font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[hsl(var(--color-primary))]" />
                  {t('students:dashboard.absences.history_title')}
                </h3>
                <div className="space-y-3">
                  <div className="bg-[hsl(var(--background))] p-4 rounded-xl border border-[hsl(var(--border))] flex justify-between items-start shadow-sm">
                    <div>
                      <p className="font-bold text-sm text-[hsl(var(--foreground))]">{t('students:dashboard.absences.history_item')}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{t('students:dashboard.absences.history_date')}</p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 bg-amber-500/10 border-amber-200">
                      {t('students:dashboard.absences.history_status')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: REVISION PLANNER (AI) */}
          {activeTab === 'revision' && (
            <div className="max-w-2xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-black text-[hsl(var(--foreground))]">{t('students:dashboard.revision.title')}</h2>
              <p className="text-[hsl(var(--muted-foreground))] text-sm">
                {t('students:dashboard.revision.subtitle')}
              </p>

              <div className="flex gap-2 text-start">
                <Input
                  className="flex-1"
                  placeholder={t('students:dashboard.revision.placeholder')}
                  value={modulesInput}
                  onChange={(e) => setModulesInput(e.target.value)}
                />
                <Button
                  onClick={() => generateRevisionMutation.mutate()}
                  isLoading={generateRevisionMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-none shrink-0"
                >
                  {t('students:dashboard.revision.generate')}
                </Button>
              </div>

              {generateRevisionMutation.isSuccess && (
                <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-6 mt-6 shadow-sm text-start">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-[hsl(var(--foreground))]">
                      {t('students:dashboard.revision.result_title')}
                    </h3>
                    <Badge className="bg-purple-100 text-purple-700 border-none">AI Generated</Badge>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-[hsl(var(--muted-foreground))]">
                    <p>{t('students:dashboard.revision.result_text')}</p>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Jour 1: Comptabilité (Chapitres 1-3) - 2h</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Jour 2: Algèbre (Espaces Vectoriels) - 1.5h</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Jour 3: Marketing + Révision Croisée - 3h</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
