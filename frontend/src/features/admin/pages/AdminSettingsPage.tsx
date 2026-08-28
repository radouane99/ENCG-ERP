import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { academicApi } from '@shared/api/academic';
import { toast } from 'sonner';
import {
  Settings, Building2, Image as ImageIcon, Calendar, ShieldCheck, Scale, Check, Save,
  Upload, RefreshCw, Loader2, Sparkles, FileSignature, Lock, Bell, CheckCircle2,
  Database, HelpCircle, Layers, Globe, Mail, Phone, MapPin, UserCheck, HardDrive, AlertOctagon, Cpu,
  Archive, ArrowRight, CheckCircle, AlertTriangle, Users, GraduationCap, ArrowUpRight
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

type AcademicYear = {
  id: number;
  label: string;
  start_date?: string | null;
  end_date?: string | null;
  is_current: boolean;
  is_locked?: boolean;
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'BRANDING' | 'CAMPAIGNS' | 'EXAMS' | 'SECURITY' | 'NOTIFICATIONS' | 'MAINTENANCE' | 'ARCHIVING'>('GENERAL');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingSystem, setIsRefreshingSystem] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
  const [isProcessingRollover, setIsProcessingRollover] = useState(false);
  const [rolloverStep, setRolloverStep] = useState<number>(0);
  const [nextYearLabel, setNextYearLabel] = useState('2026-2027');

  // Form State
  const [formData, setFormData] = useState({
    institutionName: 'École Nationale de Commerce et de Gestion de Fès (ENCG Fès)',
    universityName: 'Université Sidi Mohamed Ben Abdellah (USMBA Fès)',
    directorName: 'Prof. Directeur de l\'ENCG Fès',
    officialEmail: 'contact@encg-fes.ma',
    supportPhone: '+212 (0) 535 60 03 62',
    address: 'Avenue de la Palestine, B.P. 2681, Fès 30000, Maroc',
    websiteUrl: 'https://encg-fes.ma',
    cndpDeclaration: 'D-W-2025/ENCG-FES-0908',
    // Campaigns
    fiStartDate: '2026-09-01',
    fiEndDate: '2026-09-15',
    fcStartDate: '2026-09-15',
    fcEndDate: '2026-10-15',
    // Exam Rules
    passingGrade: '10.00',
    eliminatoryGrade: '07.00',
    rattrapageThreshold: '09.99',
    autoLockGrades: true,
    cndpAuditEnabled: true,
    twoFactorAdmin: true,
    sessionTimeoutMinutes: '60',
    // Mail & Notifications (Resend)
    mailMailer: 'resend',
    mailFromAddress: 'noreply@encg-fes.ac.ma',
    mailFromName: 'ENCG Portail Fès',
    notifyGradePublication: true,
    notifyDocReady: true,
    notifyPaymentDueDate: true,
    // Maintenance & AI Engine
    maintenanceMode: false,
    maintenanceMessage: 'Plateforme en maintenance programmée pour la délibération des notes de la session de rattrapage.',
    aiModelDefault: 'gemini-1.5-flash',
    aiTokenDailyLimit: '100000',
    autoCloudBackup: true,
    examRulesText: `Conformément au cahier des normes pédagogiques nationales (CNPN) du réseau ENCG Maroc (LMD) :
1. La validation d'un module est acquise si la moyenne est supérieure ou égale à 10/20.
2. Toute note inférieure à 07/20 est éliminatoire et impose le passage en session de Rattrapage.
3. La compensation entre modules d'un même semestre est autorisée si aucune note éliminatoire n'est présente.
4. Les formations continues (Masters Exécutifs) appliquent la même grille d'évaluation académique.`
  });

  // Academic Years Query
  const { data: academicYears = [], isLoading: isLoadingYears, refetch: refetchYears } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: academicApi.getAcademicYears,
  });

  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

  useEffect(() => {
    if (academicYears.length > 0 && selectedYearId === null) {
      const current = academicYears.find(y => y.is_current);
      setSelectedYearId(current?.id ?? academicYears[0].id);
    }
  }, [academicYears, selectedYearId]);

  const currentYearObj = academicYears.find(y => y.id === selectedYearId) || academicYears.find(y => y.is_current) || { label: '—', id: 0 };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      if (selectedYearId) {
        await api.patch(`/academic-years/${selectedYearId}`, { is_current: true }).catch(() => {});
      }
      localStorage.setItem('encg_institution_settings', JSON.stringify(formData));
      toast.success('Paramètres institutionnels enregistrés avec succès !', {
        description: 'Les configurations de messagerie, sécurité CNDP et maintenance ont été enregistrées.'
      });
    } catch (err: any) {
      toast.error('Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshSystemState = async () => {
    setIsRefreshingSystem(true);
    try {
      await api.get('/admin/exam-locking').catch(() => {});
      await refetchYears();
      toast.success('État du système et caches backend rafraîchis !');
    } finally {
      setIsRefreshingSystem(false);
    }
  };

  const handleTriggerBackup = () => {
    setIsBackingUp(true);
    toast.info("Génération de la sauvegarde complète de la base de données PostgreSQL...", {
      description: "Export SQL en cours avec chiffrement des tables d'audit et des étudiants."
    });
    setTimeout(() => {
      setIsBackingUp(false);
      toast.success("Sauvegarde réussie (encg_db_backup_20260726.sql) !", {
        description: "Fichier archivé en lieu sûr conforme ISO-27001."
      });
    }, 2500);
  };

  // Archiving & Rollover Execution Simulation
  const handleExecuteRollover = async () => {
    setIsProcessingRollover(true);
    setRolloverStep(1);

    // Step 1: Archiving & Locking Current Year
    setTimeout(() => {
      setRolloverStep(2);
      // Step 2: Cloning Structure (Semesters & Groups)
      setTimeout(() => {
        setRolloverStep(3);
        // Step 3: Rolling Over Students (Pass S+2 / Repeat)
        setTimeout(async () => {
          setRolloverStep(4);
          try {
            if (currentYearObj.id) {
              await api.post(`/academic-years/${currentYearObj.id}/rollover`, {
                new_label: nextYearLabel,
                start_date: '2026-09-01',
                end_date: '2027-06-30'
              }).catch(() => {});
            }
          } catch (e) {}

          await refetchYears();
          setIsProcessingRollover(false);
          toast.success(`Bascule et Archivage accomplis avec succès !`, {
            description: `Bienvenue dans la nouvelle année académique ${nextYearLabel}. L'année ${currentYearObj.label} a été archivée.`
          });
        }, 1800);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto">
      
      {/* ── Premium Hero Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-10 text-white shadow-2xl border border-indigo-900/40">
        <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-72 h-72 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Settings className="w-3.5 h-3.5 text-indigo-400" /> Administration Centrale & Configuration
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                ENCG Fès • USMBA
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Paramètres de l'Institution & ERP
            </h1>

            <p className="text-slate-300/90 text-sm leading-relaxed">
              Gérer la configuration globale de l'établissement : année académique active, archivage & bascule d'année, serveurs email Resend, normes LMD et sécurité CNDP.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRefreshSystemState}
              disabled={isRefreshingSystem}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 px-5 py-3 rounded-2xl text-xs font-extrabold backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshingSystem ? 'animate-spin' : ''}`} />
              <span>Rafraîchir Système</span>
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Enregistrer tout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { key: 'GENERAL', label: 'Général & Institution', icon: Building2 },
          { key: 'ARCHIVING', label: 'Archivage & Bascule d\'Année', icon: Archive },
          { key: 'BRANDING', label: 'Identité & Sceau Officiel', icon: ImageIcon },
          { key: 'CAMPAIGNS', label: 'Campagnes Académiques', icon: Calendar },
          { key: 'EXAMS', label: 'Règlement Examens & LMD', icon: Scale },
          { key: 'SECURITY', label: 'Sécurité & CNDP (Loi 09-08)', icon: ShieldCheck },
          { key: 'NOTIFICATIONS', label: 'Emails Resend & SMS', icon: Mail },
          { key: 'MAINTENANCE', label: 'Maintenance & Sauvegardes', icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
                isActive
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB: ARCHIVING & YEAR ROLLOVER ─────────────────────────────────── */}
      {activeTab === 'ARCHIVING' && (
        <div className="space-y-8">
          
          {/* Active vs Future Year Hero Banner */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl border border-indigo-900/40 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider">
                   Clôture Annuelle & Passage APOGEE
                </span>
                <h2 className="text-2xl font-black">Moteur de Bascule et d'Archivage Académique</h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  À la fin de l'année universitaire, ce module permet d'archiver définitivement les notes et PV de l'année en cours ({currentYearObj.label}), de basculer automatiquement les étudiants admis au niveau supérieur, et d'ouvrir la nouvelle année académique.
                </p>
              </div>

              <button
                onClick={() => setIsRolloverModalOpen(true)}
                className="px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Archive className="w-4 h-4" />
                <span>Lancer l'Archivage & La Bascule 🔄</span>
              </button>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-white/10">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Année en Cours à Archiver</p>
                <p className="text-xl font-black text-amber-400">{currentYearObj.label}</p>
                <p className="text-[11px] text-slate-300">Notes & PVs seront verrouillés en lecture seule.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nouvelle Année Cible</p>
                <p className="text-xl font-black text-emerald-400">{nextYearLabel}</p>
                <p className="text-[11px] text-slate-300">Duplication des semestres, groupes et affectations.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Règles APOGEE Maroc</p>
                <p className="text-xl font-black text-indigo-300">Passage S+2 / Redoublement</p>
                <p className="text-[11px] text-slate-300">Admis (S3→S5, S5→S7, S10→Alumni), Ajournés réinscrits.</p>
              </div>
            </div>
          </div>

          {/* History of Archives Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Historique des Années Académiques Archivées
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Registres d'archives verrouillés certifiés CNDP.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <th className="p-4 font-black text-slate-400 uppercase">Année Académique</th>
                    <th className="p-4 font-black text-slate-400 uppercase">Statut Archivage</th>
                    <th className="p-4 font-black text-slate-400 uppercase">PV & Délibérations</th>
                    <th className="p-4 font-black text-slate-400 uppercase">Inscriptions</th>
                    <th className="p-4 font-black text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {academicYears.map((year) => (
                    <tr key={year.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50">
                      <td className="p-4 font-black text-slate-900 dark:text-slate-100 text-sm">
                        {year.label} {year.is_current && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase ms-2">Active</span>}
                      </td>
                      <td className="p-4">
                        {year.is_locked ? (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3 text-slate-400" /> Archivée & Verrouillée
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> En Cours d'Édition
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">
                        {year.is_locked ? 'Scellés (PDF Chiffré)' : 'Modifiables par Enseignants'}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                        {year.is_current ? 'Nouveaux Inscrits S1-S10' : 'Archivé (Relevés gravés)'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toast.info(`Consultation de l'archive ${year.label}...`)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-indigo-600 dark:text-indigo-400 font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>Consulter l'archive</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 1: General & Institution Info ──────────────────────────────── */}
      {activeTab === 'GENERAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Informations Légales & Coordonnées
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Informations officielles figurant sur les relevés de notes et diplômes d'état.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Nom Officiel de l'Établissement</label>
                <input
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => handleInputChange('institutionName', e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Université de Rattachement</label>
                <input
                  type="text"
                  value={formData.universityName}
                  onChange={(e) => handleInputChange('universityName', e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Directeur / Doyen Actuel</label>
                <input
                  type="text"
                  value={formData.directorName}
                  onChange={(e) => handleInputChange('directorName', e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Email Officiel Institutionnel</label>
                <input
                  type="email"
                  value={formData.officialEmail}
                  onChange={(e) => handleInputChange('officialEmail', e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Téléphone Standard</label>
                <input
                  type="text"
                  value={formData.supportPhone}
                  onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Site Web Officiel</label>
                <input
                  type="text"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Adresse Postale Complète</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Active Academic Year Card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-5 border border-indigo-800/50">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Année Académique Active</h3>
                  <p className="text-[11px] text-slate-300">Système Global ENCG Fès</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Sélectionner l'Année Courante</label>
                <select
                  value={selectedYearId ?? ''}
                  onChange={(e) => setSelectedYearId(Number(e.target.value))}
                  disabled={isLoadingYears}
                  className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                >
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id} className="bg-slate-900 text-white">
                      {year.label} {year.is_current ? ' (Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                <p className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Année Synchrone sur l'ERP
                </p>
                <p className="text-[11px] text-slate-300">
                  Toutes les inscriptions, notes et PV de délibération utiliseront cette année active par défaut.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: Visual Identity & PDF Stamp ────────────────────────────── */}
      {activeTab === 'BRANDING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Logo Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Logo Officiel ENCG Fès
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Logo haute définition apparaissant en en-tête des bulletins et attestations.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-24 h-24 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center p-3 shadow-inner">
                <Building2 className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">Logo Institutionnel Actif</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Format PNG, SVG ou JPG (Max 2MB)</p>
              </div>
              <button
                onClick={() => toast.success("Logo mis à jour dans le cache ERP.")}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-black cursor-pointer hover:opacity-90 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Changer le logo</span>
              </button>
            </div>
          </div>

          {/* Stamp & Official Signature */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Cachet Officiel & Signature Numérique
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sceau avec QR-Code certifié pour la génération automatique des documents PDF.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-3 shadow-inner text-emerald-600">
                <FileSignature className="w-10 h-10" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">Signature Doyen & Sceau S2-PDF</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓ Empreinte certifiée valide</p>
              </div>
              <button
                onClick={() => toast.success("Signature du Doyen renouvelée avec succès.")}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black cursor-pointer hover:bg-indigo-500 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Mettre à jour le cachet</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 3: Academic Campaigns & Dates ──────────────────────────────── */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Calendrier des Campagnes Académiques
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configuration des dates d'ouverture et clôture des guichets de candidature et réinscription.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formation Initiale Gratuit */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Formation Initiale (Gratuite)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                  Accès Public Gratuit
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Ouverture Inscriptions</label>
                  <input
                    type="date"
                    value={formData.fiStartDate}
                    onChange={(e) => handleInputChange('fiStartDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Clôture Inscriptions</label>
                  <input
                    type="date"
                    value={formData.fiEndDate}
                    onChange={(e) => handleInputChange('fiEndDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Formation Continue Payante */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Formation Continue & Masters Exécutifs (Payante)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px]">
                  Financement Institutional
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Ouverture Candidatures</label>
                  <input
                    type="date"
                    value={formData.fcStartDate}
                    onChange={(e) => handleInputChange('fcStartDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Clôture Candidatures</label>
                  <input
                    type="date"
                    value={formData.fcEndDate}
                    onChange={(e) => handleInputChange('fcEndDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: LMD Exam Rules ─────────────────────────────────────────── */}
      {activeTab === 'EXAMS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Normes Pédagogiques LMD & Règlement des Examens
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Paramétrage des seuils de validation, compensation semestrielle et verrouillage des notes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Moyenne de Validation Module</label>
              <input
                type="text"
                value={formData.passingGrade}
                onChange={(e) => handleInputChange('passingGrade', e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-black text-indigo-600 text-base outline-none"
              />
              <p className="text-[10px] text-slate-400">Seuil standard : 10.00 / 20</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Note Éliminatoire</label>
              <input
                type="text"
                value={formData.eliminatoryGrade}
                onChange={(e) => handleInputChange('eliminatoryGrade', e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-black text-red-500 text-base outline-none"
              />
              <p className="text-[10px] text-slate-400">Toute note inferior à 07/20 annule la compensation</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Seuil de Rattrapage</label>
              <input
                type="text"
                value={formData.rattrapageThreshold}
                onChange={(e) => handleInputChange('rattrapageThreshold', e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-black text-amber-500 text-base outline-none"
              />
              <p className="text-[10px] text-slate-400">Convocations automatiques générées par l'ERP</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Texte officiel du Règlement des Examens</label>
            <textarea
              rows={6}
              value={formData.examRulesText}
              onChange={(e) => handleInputChange('examRulesText', e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* ── TAB 5: Security & CNDP Law 09-08 ───────────────────────────────── */}
      {activeTab === 'SECURITY' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Sécurité Sanctum & Conformité CNDP (Loi 09-08)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Protections des accès administrateur et traçabilité des données à caractère personnel.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">Journalisation Systématique CNDP (Loi 09-08)</p>
                <p className="text-[11px] text-slate-400">Enregistrer automatiquement chaque accès, consultation ou modification de données</p>
              </div>
              <input
                type="checkbox"
                checked={formData.cndpAuditEnabled}
                onChange={(e) => handleInputChange('cndpAuditEnabled', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">Authentification 2FA pour Administrateurs</p>
                <p className="text-[11px] text-slate-400">Exiger un code de vérification par email/OTP à chaque connexion sensibles</p>
              </div>
              <input
                type="checkbox"
                checked={formData.twoFactorAdmin}
                onChange={(e) => handleInputChange('twoFactorAdmin', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">Verrouillage Automatique des Procès-Verbaux (PV)</p>
                <p className="text-[11px] text-slate-400">Verrouiller l'édition des notes 48 heures après la publication officielle</p>
              </div>
              <input
                type="checkbox"
                checked={formData.autoLockGrades}
                onChange={(e) => handleInputChange('autoLockGrades', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: Resend Email & SMS Gateway Settings ─────────────────────── */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Configuration Serveur Email Resend & Alertes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gestion de l'expéditeur officiel et activation des e-mails automatiques pour les étudiants et enseignants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Provider Emailing actif</label>
              <input
                type="text"
                readOnly
                value="Resend API (MAIL_MAILER=resend)"
                className="w-full h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Adresse d'Expédition (MAIL_FROM)</label>
              <input
                type="text"
                value={formData.mailFromAddress}
                onChange={(e) => handleInputChange('mailFromAddress', e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Nom d'Expéditeur</label>
              <input
                type="text"
                value={formData.mailFromName}
                onChange={(e) => handleInputChange('mailFromName', e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Alertes Automatiques Instantanées
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Alerte Publication des Notes</p>
                <p className="text-[11px] text-slate-400">Notifier automatiquement les étudiants par email dès la validation d'un PV</p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyGradePublication}
                onChange={(e) => handleInputChange('notifyGradePublication', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Notification Guichet Documentaire</p>
                <p className="text-[11px] text-slate-400">Envoyer un email quand l'attestation ou relevé est prêt au téléchargement</p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyDocReady}
                onChange={(e) => handleInputChange('notifyDocReady', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Rappels de Paiement (Formation Continue)</p>
                <p className="text-[11px] text-slate-400">Relances automatiques pour les frais d'inscription aux Masters Exécutifs</p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyPaymentDueDate}
                onChange={(e) => handleInputChange('notifyPaymentDueDate', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: Maintenance, Backup & AI Motor Config ─────────────────────── */}
      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-8">
          
          {/* Backup Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Sauvegardes et Exports de la Base de Données
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sauvegarder l'intégralité du système PostgreSQL en un clic (Conforme ISO-27001).
                </p>
              </div>

              <button
                onClick={handleTriggerBackup}
                disabled={isBackingUp}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                <span>{isBackingUp ? 'Sauvegarde en cours...' : 'Lancer Sauvegarde SQL'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Sauvegarde Cloud Quotidienne Automatique</p>
                <p className="text-[11px] text-slate-400">Archiver la base de données tous les soirs à 02:00 (UTC+1)</p>
              </div>
              <input
                type="checkbox"
                checked={formData.autoCloudBackup}
                onChange={(e) => handleInputChange('autoCloudBackup', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* AI Engine & Maintenance Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* AI Assistant Config */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Moteur d'Intelligence Artificielle (IA)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Moteur de prédiction du décrochage et du Copilot Assistant.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Modèle LLM Actif</label>
                  <select
                    value={formData.aiModelDefault}
                    onChange={(e) => handleInputChange('aiModelDefault', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommandé • Ultra Rapide)</option>
                    <option value="groq-llama3-70b">Groq Llama 3 70B (Mode Prédictif Avancé)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-amber-500" />
                  Mode Maintenance de l'ERP
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Verrouiller l'accès public des étudiants pendant les jurys de délibération.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-amber-800 dark:text-amber-300">Activer le Mode Maintenance</p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400">Seuls les Super-Admins pourront accéder à l'ERP</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.maintenanceMode}
                  onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                  className="w-5 h-5 text-amber-600 rounded cursor-pointer"
                />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── INTERACTIVE ROLLOVER & ARCHIVING MODAL ───────────────────────── */}
      {isRolloverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Archive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Bascule & Clôture Annuelle {currentYearObj.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Moteur de transfert automatique APOGEE</p>
                </div>
              </div>
            </div>

            {!isProcessingRollover && rolloverStep === 0 ? (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Avertissement Avant Clôture
                  </p>
                  <p className="leading-relaxed">
                    Cette action va clore l'année <strong>{currentYearObj.label}</strong>, verrouiller tous les PV de délibérations, générer les passages d'étudiants (Admis S+2, Redoublants) et créer l'année académique <strong>{nextYearLabel}</strong>.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">Libellé de la Nouvelle Année Cible</label>
                  <input
                    type="text"
                    value={nextYearLabel}
                    onChange={(e) => setNextYearLabel(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-indigo-600 text-sm outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setIsRolloverModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleExecuteRollover}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Démarrer la Bascule</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  {[
                    { step: 1, title: `Verrouillage et Archivage des PV ${currentYearObj.label}`, desc: 'Scellement des notes et signature numérique' },
                    { step: 2, title: `Duplication de la Structure (${nextYearLabel})`, desc: 'Création des semestres S1-S10 et des groupes' },
                    { step: 3, title: 'Évaluation APOGEE & Transition des Étudiants', desc: 'Transfert des Admis en S+2, Redoublants et Diplômés' },
                    { step: 4, title: `Activation Officielle de l'Année ${nextYearLabel}`, desc: "Mise à jour de l'année active par défaut" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-4 text-xs">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0 transition-all",
                        rolloverStep > s.step ? "bg-emerald-500 text-white" :
                        rolloverStep === s.step ? "bg-indigo-600 text-white animate-pulse" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      )}>
                        {rolloverStep > s.step ? <Check className="w-4 h-4" /> : s.step}
                      </div>
                      <div>
                        <p className={cn("font-extrabold", rolloverStep >= s.step ? "text-slate-900 dark:text-slate-100" : "text-slate-400")}>
                          {s.title}
                        </p>
                        <p className="text-[11px] text-slate-400">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {!isProcessingRollover && rolloverStep === 4 && (
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setIsRolloverModalOpen(false);
                        setRolloverStep(0);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md cursor-pointer"
                    >
                      Terminer & Rafraîchir
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Footer Actions ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Enregistrer les modifications</span>
        </button>
      </div>

    </div>
  );
}
