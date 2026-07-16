import React, { useState } from 'react'
import { QrCode, MessageSquareText, Settings, Users, BrainCircuit, Mic, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'

export default function ClassroomPage() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [activeTab, setActiveTab] = useState<'attendance' | 'ai'>('attendance')

  return (
    <div className="h-[calc(100vh-80px)] p-4 md:p-6 max-w-[1400px] mx-auto animate-in flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">{isRtl ? 'القسم الرقمي' : 'Espace Classroom'}</h1>
          <p className="text-[var(--muted-foreground)] mt-1 font-medium text-sm">Management Stratégique (M12) • S6 • Amphi 1</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-full p-1.5 flex shadow-sm">
          <button
            onClick={() => setActiveTab('attendance')}
            className={cn("flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all", activeTab === 'attendance' ? "bg-[var(--color-primary)] text-white shadow-md" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}
          >
            <QrCode size={16} /> {isRtl ? 'تسجيل الحضور' : 'Appel Numérique'}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn("flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all", activeTab === 'ai' ? "bg-purple-600 text-white shadow-md" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}
          >
            <BrainCircuit size={16} /> {t('modules:classroom.ai_assistant')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="h-full flex flex-col lg:flex-row gap-6 animate-in fade-in zoom-in-95 duration-300">
            {/* QR Code Presentation */}
            <div className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-10 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 end-0 p-8 opacity-5 text-[var(--color-primary)]">
                <QrCode size={200} />
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2 relative z-10">{isRtl ? 'امسح لتسجيل الحضور' : 'Scannez pour valider votre présence'}</h2>
              <p className="text-[var(--muted-foreground)] mb-10 text-center relative z-10 max-w-sm">
                {t('modules:classroom.scan_desc')}
              </p>
              
              <div className="relative z-10 bg-white p-6 rounded-[2rem] shadow-xl border-4 border-slate-100 mb-8 transform transition-transform hover:scale-105">
                {/* SVG mock for a beautiful QR Code */}
                <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="240" height="240" fill="white"/>
                  <path d="M0 0H70V70H0V0ZM20 20V50H50V20H20ZM170 0H240V70H170V0ZM190 20V50H220V20H190ZM0 170H70V240H0V170ZM20 190V220H50V190H20ZM90 0H110V50H90V0ZM130 0H150V30H130V0ZM90 70H150V90H90V70ZM170 90H240V110H170V90ZM0 90H70V110H0V90ZM0 130H30V150H0V130ZM50 130H110V150H50V130ZM130 110H150V150H130V110ZM170 130H190V150H170V130ZM210 130H240V170H210V130ZM90 170H130V190H90V170ZM150 170H170V210H150V170ZM190 190H210V240H190V190ZM220 190H240V240H220V190ZM90 210H130V240H90V210Z" fill="#0f2863"/>
                </svg>
                {/* Central ENCG Logo mock */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0f2863] to-[#a11162] rounded-lg"></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                <Button variant="outline">{isRtl ? 'تجديد الرمز' : 'Régénérer le code'}</Button>
                <Button variant="primary">{isRtl ? 'إغلاق التسجيل' : 'Clôturer l\'appel'}</Button>
              </div>
            </div>

            {/* Live Stats */}
            <div className="w-full lg:w-96 bg-[var(--card)] border border-[var(--border)] rounded-3xl flex flex-col overflow-hidden shadow-lg">
              <div className="p-6 border-b border-[var(--border)] bg-[color-mix(in srgb, var(--muted) 3000%, transparent)]">
                <h3 className="font-bold flex items-center gap-2 text-[var(--foreground)]">
                  <Users className="w-5 h-5 text-[var(--color-primary)]" /> {t('modules:classroom.present_students')}
                </h3>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-black text-[var(--color-primary)]">42</span>
                  <span className="text-[var(--muted-foreground)] font-medium pb-1">/ 50 inscrits</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-2xl border border-[var(--border)] animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 bg-[var(--color-primary)/10] rounded-full flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                      E{i}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--foreground)]">Étudiant {i}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Présent à 08:3{i}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="h-full bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[var(--border)] bg-gradient-to-r from-purple-900 to-[#14285e] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{isRtl ? 'مولد QCM والمساعد' : 'Générateur de QCM & Assistant'}</h2>
                  <p className="text-white/70 text-sm">{t('modules:classroom.ai_powered')}</p>
                </div>
              </div>
              <Button variant="ghost" className="text-white hover:bg-white/10" icon={<Settings size={18} />}>
                {isRtl ? 'إعدادات النموذج' : 'Paramètres'}
              </Button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[var(--background)]">
              {/* AI Chat Bubbles Mock */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5 text-purple-600" />
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-2xl rounded-tl-sm max-w-2xl shadow-sm">
                  <p className="text-[var(--foreground)] text-sm leading-relaxed">
                    {isRtl 
                      ? 'مرحباً! يمكنني مساعدتك في إنشاء اختبارات، تلخيص ملفات PDF للطلاب، أو اقتراح مواضيع للنقاش. ماذا تود أن نفعل اليوم؟' 
                      : 'Bonjour ! Je peux vous aider à générer un QCM, résumer un support de cours PDF pour vos étudiants, ou trouver des cas d\'étude. Que souhaitez-vous faire ?'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 flex-row-reverse">
                <div className="w-10 h-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm">
                  PR
                </div>
                <div className="bg-[var(--color-primary)] text-white p-4 rounded-2xl rounded-tr-sm max-w-2xl shadow-sm">
                  <p className="text-sm leading-relaxed">
                    {isRtl 
                      ? 'قم بإنشاء اختبار QCM من 5 أسئلة حول التحليل المالي.' 
                      : 'Génère-moi un QCM de 5 questions sur l\'analyse financière, niveau M1.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5 text-purple-600" />
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl rounded-tl-sm max-w-2xl shadow-sm w-full">
                  <p className="text-[var(--foreground)] font-bold mb-4 text-sm">{isRtl ? 'إليك مقترح QCM:' : 'Voici une proposition de QCM :'}</p>
                  <div className="space-y-4">
                    <div className="p-4 bg-[color-mix(in srgb, var(--muted) 5000%, transparent)] rounded-xl border border-[var(--border)]">
                      <p className="font-bold text-sm text-[var(--foreground)] mb-2">1. Quel est l'objectif principal du bilan fonctionnel ?</p>
                      <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                        <label className="flex items-center gap-2"><input type="radio" name="q1"/> A. Évaluer la liquidité à court terme</label>
                        <label className="flex items-center gap-2 text-green-600 font-medium"><input type="radio" name="q1" checked readOnly/> B. Analyser l'équilibre financier (FRNG, BFR, Trésorerie)</label>
                        <label className="flex items-center gap-2"><input type="radio" name="q1"/> C. Calculer le résultat net</label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">Exporter en PDF</Button>
                    <Button size="sm" variant="primary">Intégrer à l'examen</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[var(--card)] border-t border-[var(--border)]">
              <div className="relative flex items-center bg-[var(--background)] border border-[var(--border)] rounded-full p-1.5 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all shadow-inner">
                <button className="p-3 text-[var(--muted-foreground)] hover:text-purple-600 transition-colors">
                  <Mic size={20} />
                </button>
                <input 
                  type="text" 
                  placeholder={t('modules:classroom.ask_ai')}
                  className="flex-1 bg-transparent border-none focus:outline-none px-2 text-sm text-[var(--foreground)]"
                />
                <button className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-md transform hover:scale-105 active:scale-95">
                  <Send size={18} className={cn(isRtl && "rotate-180")} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
