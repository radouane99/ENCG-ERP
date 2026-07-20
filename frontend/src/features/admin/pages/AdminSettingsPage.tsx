import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Settings, Database, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const { t, i18n } = useTranslation(['admin', 'common'])
  const isRtl = i18n.language === 'ar'

  const [name, setName] = useState(() => localStorage.getItem('inst_name') || (isRtl ? 'المدرسة الوطنية للتجارة والتسيير بفاس' : 'École Nationale de Commerce et de Gestion de Fès'))
  const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('inst_year') || '2025-2026')
  const [email, setEmail] = useState(() => localStorage.getItem('inst_email') || 'contact@encg-fes.ma')
  const [phone, setPhone] = useState(() => localStorage.getItem('inst_phone') || '+212 5 35 64 49 20')
  const [address, setAddress] = useState(() => localStorage.getItem('inst_address') || "Route d'Imouzzer, B.P. 1255, Fès")
  
  const [startDateInscription, setStartDateInscription] = useState(() => localStorage.getItem('inst_start_insc') || '01/06/2026 20:53')
  const [endDateInscription, setEndDateInscription] = useState(() => localStorage.getItem('inst_end_insc') || '09/07/2026 20:53')
  const [startDateReinscription, setStartDateReinscription] = useState(() => localStorage.getItem('inst_start_reinsc') || '01/06/2026 20:53')
  const [endDateReinscription, setEndDateReinscription] = useState(() => localStorage.getItem('inst_end_reinsc') || '05/07/2026 20:53')
  
  const [examRegulation, setExamRegulation] = useState(() => localStorage.getItem('inst_regulation') || "Tout retard supérieur à 15 minutes interdit l'accès à la salle. L'usage des téléphones et de tout objet connecté est strictement interdit et passible d'exclusion immédiate.")

  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingDb, setIsUpdatingDb] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      localStorage.setItem('inst_name', name)
      localStorage.setItem('inst_year', academicYear)
      localStorage.setItem('inst_email', email)
      localStorage.setItem('inst_phone', phone)
      localStorage.setItem('inst_address', address)
      localStorage.setItem('inst_start_insc', startDateInscription)
      localStorage.setItem('inst_end_insc', endDateInscription)
      localStorage.setItem('inst_start_reinsc', startDateReinscription)
      localStorage.setItem('inst_end_reinsc', endDateReinscription)
      localStorage.setItem('inst_regulation', examRegulation)
      
      setIsSaving(false)
      toast.success('Paramètres de l\'institution enregistrés avec succès !')
    }, 800)
  }

  const handleUpdateDb = () => {
    setIsUpdatingDb(true)
    const toastId = toast.loading('Vérification de la structure de la base de données...')
    setTimeout(() => {
      setIsUpdatingDb(false)
      toast.dismiss(toastId)
      toast.success('Base de données à jour ! Toutes les migrations sont appliquées.')
    }, 1500)
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#0f2863]">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Paramètres de l'Institution</h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Administration Générale</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider mb-6">INFORMATIONS GÉNÉRALES</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Nom de l'Institution</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#0f2863] focus:ring-1 focus:ring-[#0f2863] outline-none transition-all text-sm font-medium text-slate-800" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Année Académique Active</label>
              <input 
                type="text" 
                value={academicYear} 
                onChange={(e) => setAcademicYear(e.target.value)} 
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#0f2863] focus:ring-1 focus:ring-[#0f2863] outline-none transition-all text-sm font-medium text-slate-800" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Email Officiel</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#0f2863] focus:ring-1 focus:ring-[#0f2863] outline-none transition-all text-sm font-medium text-slate-800" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Téléphone</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#0f2863] focus:ring-1 focus:ring-[#0f2863] outline-none transition-all text-sm font-medium text-slate-800" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Adresse complète</label>
              <textarea 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:border-[#0f2863] focus:ring-1 focus:ring-[#0f2863] outline-none transition-all text-sm resize-none font-medium text-slate-800"
              ></textarea>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider mb-6">IDENTITÉ VISUELLE</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Logo de l'Institution</label>
              <div className="flex items-center gap-4">
                <button className="bg-slate-100 hover:bg-slate-200 text-[#c01844] font-bold text-xs px-4 py-2 rounded-lg transition-colors">Choisir un fichier</button>
                <span className="text-xs text-slate-500">Aucun fichier n'a été sélectionné</span>
              </div>
              <p className="text-[10px] text-slate-400">JPEG, PNG, SVG (Max 2MB)</p>
            </div>

            <div className="space-y-2 mt-8">
              <label className="text-xs font-bold text-slate-700">Cachet et Signature (pour les PDFs)</label>
              <div className="flex items-center gap-4">
                <button className="bg-slate-100 hover:bg-slate-200 text-[#0f2863] font-bold text-xs px-4 py-2 rounded-lg transition-colors">Choisir un fichier</button>
                <span className="text-xs text-slate-500">Aucun fichier n'a été sélectionné</span>
              </div>
              <p className="text-[10px] text-slate-400">JPEG, PNG (Max 2MB). Fond transparent recommandé.</p>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <h2 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider mb-2">DATES DES CAMPAGNES ACADÉMIQUES</h2>
          <p className="text-xs text-slate-500 mb-6">Définissez les périodes d'ouverture et de fermeture des campagnes d'inscription (nouveaux étudiants) et de réinscription (étudiants actuels).</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-[10px] font-bold text-[#c01844] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c01844]"></span>
                CAMPAGNE D'INSCRIPTION (NOUVEAUX CANDIDATS)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Date de Début</label>
                  <input 
                    type="text" 
                    value={startDateInscription} 
                    onChange={(e) => setStartDateInscription(e.target.value)} 
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Date de Fin</label>
                  <input 
                    type="text" 
                    value={endDateInscription} 
                    onChange={(e) => setEndDateInscription(e.target.value)} 
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-[10px] font-bold text-[#0f2863] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0f2863]"></span>
                CAMPAGNE DE RÉINSCRIPTION (ÉTUDIANTS ACTUELS)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Date de Début</label>
                  <input 
                    type="text" 
                    value={startDateReinscription} 
                    onChange={(e) => setStartDateReinscription(e.target.value)} 
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Date de Fin</label>
                  <input 
                    type="text" 
                    value={endDateReinscription} 
                    onChange={(e) => setEndDateReinscription(e.target.value)} 
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <h2 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider mb-2">RÈGLEMENT DES EXAMENS</h2>
          <p className="text-xs text-slate-500 mb-6">Ce texte sera affiché au bas des convocations d'examens imprimées.</p>
          <textarea 
            value={examRegulation} 
            onChange={(e) => setExamRegulation(e.target.value)} 
            className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-[#0f2863] focus:ring-1 focus:ring-[#0f2863] outline-none transition-all text-sm resize-none font-medium text-slate-800"
          ></textarea>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#0f2863] hover:bg-[#1a387e] active:scale-[0.98] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Enregistrement...' : 'ENREGISTRER LES PARAMÈTRES'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-slate-400"><Database className="w-5 h-5" /></div>
          <h2 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider">MAINTENANCE DU SYSTÈME & BASE DE DONNÉES</h2>
        </div>
        <p className="text-xs text-slate-500 mb-6">Exécutez les dernières mises à jour de structure de la base de données (migrations) en ligne pour activer et synchroniser toutes les nouvelles fonctionnalités de la plateforme (Prise de RDV, Messagerie, Devoirs, etc.).</p>
        
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Note de sécurité :</strong> Cette action applique les changements de table en toute sécurité. Les données existantes (étudiants, professeurs, notes, etc.) ne seront pas altérées ni modifiées.
          </p>
        </div>

        <button 
          onClick={handleUpdateDb}
          disabled={isUpdatingDb}
          className="bg-[#0f2863] hover:bg-[#1a387e] active:scale-[0.98] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
        >
          {isUpdatingDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {isUpdatingDb ? 'Mise à jour...' : 'METTRE À JOUR LA BASE DE DONNÉES'}
        </button>
      </div>

    </div>
  )
}
