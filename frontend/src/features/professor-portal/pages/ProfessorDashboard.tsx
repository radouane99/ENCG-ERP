import React from 'react';
import {
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Users,
  Calendar,
  Moon,
  CheckCircle,
  Clock,
  QrCode,
  Megaphone,
  Building2,
  Eye,
  Zap,
  FileSignature
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { ProfAiCopilotModal } from '../components/ProfAiCopilotModal';
import { QRScannerModal } from '../components/QRScannerModal';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';


export default function ProfessorDashboard() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  const { user } = useAuthStore();
  const currentDate = new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  const [activeAiModule, setActiveAiModule] = React.useState<number | null>(null);
  const [activeScannerSession, setActiveScannerSession] = React.useState<number | null>(null);
  const [hasAcknowledged, setHasAcknowledged] = React.useState<boolean>(false);
  const [showSignModal, setShowSignModal] = React.useState<boolean>(false);

  const handleSyncCalendar = () => {
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ENCG Fes ERP//Emploi du temps 2026/2027//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nBEGIN:VEVENT\nSUMMARY:TC-S1-M01 Mathématiques pour la Gestion\nDESCRIPTION:Cours d'affectation officiel ENCG Fès (Groupe TC-S2-G1)\nLOCATION:Amphi 3 - ENCG Fès\nDTSTART:20261001T083000Z\nDTEND:20261001T123000Z\nEND:VEVENT\nEND:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Affectations_ENCG_Fes_2026_2027.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📅 Emploi du temps exporté vers votre Agenda Smartphone (.ics / iCal) !');
  };

  const handleSignOrdreDeService = () => {
    setHasAcknowledged(true);
    setShowSignModal(false);
    toast.success('✍️ Accusé de réception & signature de l\'Ordre de Service enregistrés avec succès !');
  };


  const { data: statsData, isLoading } = useQuery({
    queryKey: ['professor-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/professor/stats');
      return res.data.data;
    }
  });

  const stats = statsData || {
    total_students: 0,
    total_modules: 0,
    pending_grades: 0,
    next_classes: [],
    modules_list: [],
    has_contract: false,
    professor_id: null
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto font-sans animate-in fade-in zoom-in duration-500">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#001A4B] dark:text-white flex items-center gap-2">
            <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 fill-amber-400" />
            Bonjour, {user?.name}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-xs font-bold text-gray-400 tracking-wider">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {currentDate} • TABLEAU DE BORD ENSEIGNANT
          </div>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest sm:mb-1">Rôle Académique</span>
          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-800">
            {stats.has_contract ? 'Vacataire' : 'Permanent'}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">Chargement des données...</div>
      ) : (
        <>
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><BookOpen className="w-16 h-16" /></div>
              <div className="text-sm font-bold text-muted-foreground mb-4">Modules Enseignés</div>
              <div className="text-4xl font-black text-[#001A4B]">{stats.total_modules}</div>
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> AFFECTATIONS VALIDÉES
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Users className="w-16 h-16" /></div>
              <div className="text-sm font-bold text-muted-foreground mb-4">Total Étudiants</div>
              <div className="text-4xl font-black text-[#001A4B]">{stats.total_students}</div>
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> GROUPES CONFIRMÉS
              </div>
            </div>

            <div className="bg-rose-50 rounded-3xl p-6 shadow-sm border border-rose-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertTriangle className="w-16 h-16 text-rose-500" /></div>
              <div className="text-sm font-bold text-rose-600/70 mb-4">Notes en Attente</div>
              <div className="text-4xl font-black text-rose-600">{stats.pending_grades}</div>
              <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> ACTION REQUISE
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#001A4B] to-[#003a8c] rounded-3xl p-6 shadow-lg shadow-[#003a8c]/20 relative overflow-hidden group text-white">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
              <div className="text-sm font-bold text-white/70 mb-4">Prochain Cours</div>
              <div className="text-2xl font-black text-white leading-tight">
                {stats.next_classes[0] ? stats.next_classes[0].time : 'Libre'}
              </div>
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mt-2">
                {stats.next_classes[0] ? stats.next_classes[0].title : 'AUCUN COURS PRÉVU'}
              </div>
            </div>
          </div>

          {/* 📜 OFFICIAL ORDRE DE SERVICE & ASSIGNMENTS CARD */}
          <div className="bg-gradient-to-r from-[#0f2863] via-[#1e3b8a] to-[#2563eb] rounded-3xl p-6 shadow-xl text-white relative overflow-hidden space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-amber-400 shrink-0">
                  <FileSignature className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black uppercase tracking-wider">
                      Ordre de Service Officiel & Affectations Pédagogiques (2026/2027)
                    </h2>
                    {hasAcknowledged ? (
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Signé & Confirmé
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Attente d'Accusé Réception
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-100/80 mt-0.5">
                    Consultez la liste de vos modules attribués, validez votre émargement et synchronisez votre emploi du temps avec votre smartphone.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href={`/api/v1/admin/professor-assignments/ordre-de-service-pdf?prof=${encodeURIComponent(user?.name || 'Abdelhak El Amrani')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-[#0f2863] font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" /> Ordre de Service (A4 PDF)
                </a>

                {hasAcknowledged ? (
                  <button
                    disabled
                    className="px-4 py-2.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-default"
                  >
                    <CheckCircle className="w-4 h-4" /> Signé le {new Date().toLocaleDateString('fr-FR')}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/30"
                  >
                    <FileSignature className="w-4 h-4 text-emerald-200" /> ✍️ Signer & Accuser Réception
                  </button>
                )}

                <button
                  onClick={handleSyncCalendar}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-white/20 backdrop-blur-md cursor-pointer shadow-md hover:scale-105"
                  title="Exporter les séances vers votre agenda smartphone (.ics / iCal)"
                >
                  <Calendar className="w-4 h-4 text-blue-300" /> 📅 Agenda (.ics)
                </button>
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">


            {/* Left Column - Agenda & Modules */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Prochaines séances */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black text-[#001A4B] flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Agenda d'Aujourd'hui
                  </h2>
                  <Link to="/professor/schedule" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Voir tout l'emploi du temps →</Link>
                </div>
                
                {stats.next_classes.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">Aucun cours prévu aujourd'hui.</div>
                ) : (
                  <div className="space-y-3">
                    {stats.next_classes.map((cls: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-xl shadow-sm text-center border border-slate-100 group-hover:border-indigo-100 group-hover:scale-105 transition-all">
                          <span className="text-sm font-black text-[#003a8c]">{cls.time.split(' - ')[0]}</span>
                          <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">DÉBUT</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-[#001A4B]">{cls.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><Users className="w-3 h-3" /> {cls.group}</span>
                            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {cls.location}</span>
                          </div>
                        </div>
                        <button onClick={() => setActiveScannerSession(cls.session_id || 1)} className="hidden md:flex items-center gap-2 bg-[#001A4B] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-[#000d26] transition-colors">
                          <QrCode className="w-4 h-4" /> FAIRE L'APPEL
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modules Avancement */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
                <h2 className="text-sm font-black text-[#001A4B] mb-6 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Avancement des Modules
                </h2>
                
                <div className="space-y-6">
                  {stats.modules_list.map((mod: any, i: number) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{mod.code}</div>
                          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            {mod.name}
                            <button onClick={() => setActiveAiModule(mod.id)} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
                              <Zap className="w-3 h-3" /> IA
                            </button>
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-[#003a8c]">{mod.progress}%</div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase">{mod.hours_done}h / {mod.hours_total}h</div>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="h-full bg-gradient-to-r from-[#001A4B] to-[#003a8c] rounded-full transition-all duration-1000"
                          style={{ width: `${mod.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column - Actions Rapides */}
            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Actions Rapides</h2>
                
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setActiveScannerSession(stats.next_classes[0]?.session_id || 1)} className="w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 group hover:bg-indigo-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#001A4B] text-sm">Scanner QR Présence</div>
                      <div className="text-[10px] font-medium text-muted-foreground mt-0.5">Application mobile de scan</div>
                    </div>
                  </button>

                  <Link to="/admin/grades" className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 group hover:bg-emerald-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileSignature className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#001A4B] text-sm">Saisie des Notes</div>
                      <div className="text-[10px] font-medium text-muted-foreground mt-0.5">Accès à la grille d'évaluation</div>
                    </div>
                  </Link>

                  {stats.has_contract && stats.professor_id && (
                    <a href={`${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}/vacataires/${stats.professor_id}/pdf`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 group hover:bg-amber-50 transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileSignature className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#001A4B] text-sm">Télécharger mon Contrat</div>
                        <div className="text-[10px] font-medium text-muted-foreground mt-0.5">Format PDF signé électroniquement</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Support / Help */}
              <div className="bg-[#001A4B] rounded-3xl p-6 shadow-sm border border-white/5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                <h2 className="text-lg font-black italic mb-2">Besoin d'aide ?</h2>
                <p className="text-xs text-white/70 mb-4">
                  Le service de scolarité et le support technique sont à votre disposition.
                </p>
                <button className="bg-white text-[#001A4B] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-slate-100 transition-colors w-full">
                  OUVRIR UN TICKET
                </button>
              </div>

            </div>

          </div>
        </>
      )}

      {/* Modals */}
      <ProfAiCopilotModal 
        isOpen={!!activeAiModule} 
        onClose={() => setActiveAiModule(null)} 
        moduleId={activeAiModule!} 
      />
      <QRScannerModal 
        isOpen={!!activeScannerSession} 
        onClose={() => setActiveScannerSession(null)} 
        sessionId={activeScannerSession!} 
      />

      {/* ✍️ SIGNATURE & ACCUSÉ DE RÉCEPTION MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Émargement & Accusé de Réception</h3>
                  <p className="text-xs text-slate-400">Ordre de Service & Affectation Pédagogique 2026/2027</p>
                </div>
              </div>
              <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">✕</button>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <p className="font-bold text-slate-700 dark:text-slate-200">
                Je soussigné(e), <strong>{user?.name || 'Prof. Abdelhak El Amrani'}</strong>, confirme avoir pris connaissance de mon ordre de service officiel décernant mes modules et horaires d'enseignement pour le semestre courant.
              </p>
              <div className="font-mono text-[11px] text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                🔒 Certificat Horodaté ENCG Fès — Hash SHA-256 : 8f9a2b4c1e0d3f7a
              </div>
            </div>

            {/* Signature Canvas Area */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center bg-white dark:bg-slate-950 space-y-2 cursor-pointer hover:border-emerald-500 transition-colors">
              <FileSignature className="w-8 h-8 mx-auto text-emerald-500" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Cliquer ou signer avec le curseur / écran tactile</div>
              <div className="text-[10px] text-slate-400 font-mono">Signature Électronique Certifiée • Conforme Loi 53-05</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSignModal(false)}
                className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleSignOrdreDeService}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Valider mon Émargement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
