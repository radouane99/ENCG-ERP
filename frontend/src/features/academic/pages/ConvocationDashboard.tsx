import React, { useState } from 'react'
import { ClipboardList, Users, CheckCircle2, GraduationCap, FileText, Send, Mail, Printer, LayoutList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function ConvocationDashboard() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'etudiants' | 'surveillants' | 'dispo'>('surveillants')

  const generateMutation = useMutation({
    mutationFn: (examId: number) => api.post(`/exam-planning/${examId}/generate-convocations`),
    onSuccess: (res) => {
      toast.success(res.data.message || (isRtl ? 'تم توليد الاستدعاءات' : 'Convocations générées'))
      queryClient.invalidateQueries({ queryKey: ['convocations'] })
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ' : 'Erreur lors de la génération')
  })

  const sendEmailMutation = useMutation({
    mutationFn: (examId: number) => api.post(`/exam-planning/${examId}/send-emails`),
    onSuccess: (res) => {
      toast.success(res.data.message || (isRtl ? 'تم إرسال الرسائل' : 'Emails envoyés'))
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ' : 'Erreur lors de l\'envoi')
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-20 animate-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] p-8 text-white rounded-[2rem] shadow-xl shadow-[var(--color-primary)/10] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {isRtl ? 'إدارة الاستدعاءات' : 'Gestion des Convocations d\'Examens'}
            </h1>
            <p className="text-white/80 font-medium text-sm">
              {isRtl ? 'توليد الرموز (QR)، إرسال البريد الإلكتروني والإحصائيات' : 'Génération de QR, envoi d\'emails et statistiques'}
            </p>
          </div>
        </div>
        <div className="relative z-10 text-sm font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-[var(--card)] border border-[var(--border)] p-4 rounded-3xl shadow-sm">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1.5 block">{isRtl ? 'دورة الامتحان' : 'Session d\'examens'}</label>
          <select className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold bg-[var(--background)] focus:ring-2 focus:ring-[var(--color-primary)/20] outline-none">
            <option>Normale Automne — 2025/2026</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1.5 block">{isRtl ? 'الشعبة' : 'Filière'}</label>
          <select className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold bg-[var(--background)] focus:ring-2 focus:ring-[var(--color-primary)/20] outline-none">
            <option>{isRtl ? 'جميع الشعب' : 'Toutes les filières'}</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1.5 block">{isRtl ? 'الحالة' : 'Statut'}</label>
          <select className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold bg-[var(--background)] focus:ring-2 focus:ring-[var(--color-primary)/20] outline-none">
            <option>{isRtl ? 'جميع الحالات' : 'Tous les statuts'}</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)]">
        <button 
          onClick={() => setActiveTab('etudiants')}
          className={cn("flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase transition-colors border-b-2", activeTab === 'etudiants' ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}
        >
          <GraduationCap className="w-5 h-5" /> {isRtl ? 'الطلاب (750)' : 'Étudiants (750)'}
        </button>
        <button 
          onClick={() => setActiveTab('surveillants')}
          className={cn("flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase transition-colors border-b-2", activeTab === 'surveillants' ? "border-[#e91e63] text-[#e91e63]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}
        >
          <Users className="w-5 h-5" /> {isRtl ? 'المراقبين (28)' : 'Surveillants (28)'}
        </button>
      </div>

      {/* KPIs depending on tab */}
      {activeTab === 'surveillants' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#e91e63]/10 border border-[#e91e63]/20 text-[#e91e63] p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <div className="text-4xl font-black mb-1">{/* dynamic */ '-'} </div>
              <div className="text-xs font-bold uppercase opacity-90">{isRtl ? 'إجمالي الأساتذة' : 'Total Profs'}</div>
            </div>
            <Users className="w-10 h-10 opacity-30" />
          </div>
          <div className="bg-[#2979ff]/10 border border-[#2979ff]/20 text-[#2979ff] p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <div className="text-4xl font-black mb-1">{/* dynamic */ '-'} </div>
              <div className="text-xs font-bold uppercase opacity-90">{isRtl ? 'مُولّدة' : 'Générées'}</div>
            </div>
            <FileText className="w-10 h-10 opacity-30" />
          </div>
          <div className="bg-[#00bfa5]/10 border border-[#00bfa5]/20 text-[#00bfa5] p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <div className="text-4xl font-black mb-1">{/* dynamic */ '-'} </div>
              <div className="text-xs font-bold uppercase opacity-90">{isRtl ? 'مُرسلة' : 'Envoyées'}</div>
            </div>
            <Send className="w-10 h-10 opacity-30" />
          </div>
          <div className="bg-[#4caf50]/10 border border-[#4caf50]/20 text-[#4caf50] p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <div className="text-4xl font-black mb-1">{/* dynamic */ '-'} </div>
              <div className="text-xs font-bold uppercase opacity-90">{isRtl ? 'مُؤكدة' : 'Confirmées'}</div>
            </div>
            <CheckCircle2 className="w-10 h-10 opacity-30" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <div className="text-4xl font-black mb-1">{/* dynamic */ '-'} </div>
              <div className="text-xs font-bold uppercase opacity-90">{isRtl ? 'إجمالي الطلاب' : 'Total Étudiants'}</div>
            </div>
            <GraduationCap className="w-10 h-10 opacity-30" />
          </div>
          <div className="bg-[#2979ff]/10 border border-[#2979ff]/20 text-[#2979ff] p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <div className="text-4xl font-black mb-1">{/* dynamic */ '-'} </div>
              <div className="text-xs font-bold uppercase opacity-90">{isRtl ? 'مُولّدة' : 'Générées'}</div>
            </div>
            <FileText className="w-10 h-10 opacity-30" />
          </div>
          <div className="bg-[#00bfa5]/10 border border-[#00bfa5]/20 text-[#00bfa5] p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <div className="text-4xl font-black mb-1">{/* dynamic */ '-'} </div>
              <div className="text-xs font-bold uppercase opacity-90">{isRtl ? 'مُرسلة' : 'Envoyées'}</div>
            </div>
            <Send className="w-10 h-10 opacity-30" />
          </div>
          <div className="bg-[#8e24aa]/10 border border-[#8e24aa]/20 text-[#8e24aa] p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <div className="text-4xl font-black mb-1">{/* dynamic */ '-'} </div>
              <div className="text-xs font-bold uppercase opacity-90">{isRtl ? 'تنزيلات' : 'Téléchargées'}</div>
            </div>
            <CheckCircle2 className="w-10 h-10 opacity-30" />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-3xl shadow-sm">
        <h3 className="text-[var(--foreground)] font-bold text-lg mb-4">
          {isRtl ? 'إجراءات جماعية' : 'Actions Groupées'} — {activeTab === 'surveillants' ? (isRtl ? 'المراقبين' : 'Surveillance') : (isRtl ? 'الطلاب' : 'Étudiants')}
        </h3>
        
        {activeTab === 'surveillants' ? (
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" className="bg-[#e91e63] border-none shadow-md shadow-pink-500/20 hover:bg-[#d81b60]" icon={<Users size={16} />}>
              {isRtl ? 'تعيين آلي للمراقبين' : 'Affectation Auto'}
            </Button>
            <Button variant="outline" icon={<FileText size={16} />} onClick={() => generateMutation.mutate(1)}>
              {isRtl ? 'توليد استدعاءات' : 'Générer Convocations Profs'}
            </Button>
            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" icon={<Mail size={16} />} onClick={() => sendEmailMutation.mutate(1)}>
              {isRtl ? 'إرسال البريد' : 'Envoyer Emails Profs'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" icon={<FileText size={16} />} onClick={() => generateMutation.mutate(1)}>
              {isRtl ? 'توليد استدعاءات الطلاب' : 'Générer Convocations Étudiants'}
            </Button>
            <Button variant="outline" className="text-teal-600 border-teal-200 hover:bg-teal-50" icon={<Mail size={16} />} onClick={() => sendEmailMutation.mutate(1)}>
              {isRtl ? 'إرسال بريد الطلاب' : 'Envoyer Emails Étudiants'}
            </Button>
            <Button variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50" icon={<Printer size={16} />}>
              {isRtl ? 'معاينة PDF' : 'Aperçu PDF'}
            </Button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] bg-[color-mix(in srgb, var(--muted) 3000%, transparent)]">
          <h3 className="font-bold text-[var(--foreground)] text-lg px-2">
            {isRtl ? 'قائمة الاستدعاءات' : 'Liste des convocations'}
          </h3>
        </div>
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-[var(--muted)] rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-10 h-10 text-[var(--muted-foreground)]" />
          </div>
          <p className="font-bold text-[var(--foreground)] text-lg mb-1">{isRtl ? 'البيانات قيد التحميل...' : 'Chargement des données...'}</p>
          <p className="text-[var(--muted-foreground)] text-sm">
            {isRtl ? 'يرجى الانتظار، سيتم عرض الجدول قريباً.' : 'Veuillez patienter, le tableau sera affiché.'}
          </p>
        </div>
      </div>
    </div>
  )
}
