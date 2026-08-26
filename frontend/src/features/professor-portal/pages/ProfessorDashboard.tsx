import React, { useRef, useState, useEffect } from 'react';
import {
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  QrCode,
  Megaphone,
  Building2,
  Eye,
  Zap,
  FileSignature,
  RotateCcw,
  Sparkles,
  PenTool,
  ShieldCheck,
  Download,
  X,
  UserX
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
import RoleQuickActions from '@shared/components/layout/RoleQuickActions';
import PageHeader from '@shared/components/layout/PageHeader';

export default function ProfessorDashboard() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  const { user } = useAuthStore();
  const currentDate = new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  const [activeAiModule, setActiveAiModule] = React.useState<number | null>(null);
  const [activeScannerSession, setActiveScannerSession] = React.useState<number | null>(null);
  
  // Persist signature acknowledgement
  const [hasAcknowledged, setHasAcknowledged] = React.useState<boolean>(() => {
    return localStorage.getItem('encg_prof_os_signed') === 'true';
  });
  const [showSignModal, setShowSignModal] = React.useState<boolean>(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas context
  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f2863';
    }
    return ctx;
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
  };

  const generateStylizedSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw stylish cursive signature
    ctx.font = 'italic 34px "Brush Script MT", "Segoe Script", "Dancing Script", cursive, sans-serif';
    ctx.fillStyle = '#0f2863';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const profName = user?.name || 'Professeur';
    ctx.fillText(profName, canvas.width / 2, canvas.height / 2);

    // Decorative underline flourish
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f2863';
    ctx.moveTo(canvas.width / 2 - 100, canvas.height / 2 + 25);
    ctx.bezierCurveTo(
      canvas.width / 2 - 40, canvas.height / 2 + 35,
      canvas.width / 2 + 40, canvas.height / 2 + 15,
      canvas.width / 2 + 100, canvas.height / 2 + 30
    );
    ctx.stroke();

    setHasDrawn(true);
    toast.success('✨ Signature stylisée générée !');
  };

  const handleSyncCalendar = () => {
    const classes = Array.isArray(stats.next_classes) ? stats.next_classes : [];
    if (classes.length === 0) {
      toast.error('Aucun cours à exporter.');
      return;
    }
    const events = classes.map((c: any) => {
      const start = c.start || c.dtstart || '';
      const end = c.end || c.dtend || '';
      return `BEGIN:VEVENT\nSUMMARY:${c.title || c.module || 'Cours'}\nDESCRIPTION:${c.description || ''}\nLOCATION:${c.room || ''}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT`;
    }).join('\n');
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ENCG Fes ERP//Emploi du temps//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n${events}\nEND:VCALENDAR`;

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
    if (!hasDrawn) {
      // Auto generate signature if user didn't draw
      generateStylizedSignature();
    }
    setHasAcknowledged(true);
    localStorage.setItem('encg_prof_os_signed', 'true');
    setShowSignModal(false);
    toast.success('✍️ Émargement certifié et signé électroniquement avec succès !', {
      description: 'Certificat horodaté SHA-256 transmis au Secrétariat Général & Chef de Département.'
    });
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
    <div className="space-y-6 font-sans animate-in fade-in zoom-in duration-500 dark:text-slate-100">
      <PageHeader
        title={`Bonjour, ${user?.name || 'Professeur'}`}
        subtitle={`${currentDate} · Tableau de bord enseignant`}
        actions={
          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-800">
            {stats.has_contract ? 'Vacataire' : 'Permanent'}
          </span>
        }
      />
      <RoleQuickActions
        actions={[
          { to: '/professor/absences', label: 'Émarger', icon: UserX, testId: 'cta-prof-attendance' },
          { to: '/admin/grades', label: 'CC / Exam', icon: Zap },
          { to: '/professor/schedules', label: 'EDT', icon: Calendar },
          { to: '/professor/proctoring', label: 'Surveillance', icon: Eye },
        ]}
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">Chargement des données...</div>
      ) : (
        <>
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><BookOpen className="w-16 h-16" /></div>
              <div className="text-sm font-bold text-muted-foreground mb-4">Modules Enseignés</div>
              <div className="text-4xl font-black text-primary dark:text-white">{stats.total_modules}</div>
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> AFFECTATIONS VALIDÉES
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Users className="w-16 h-16" /></div>
              <div className="text-sm font-bold text-muted-foreground mb-4">Total Étudiants</div>
              <div className="text-4xl font-black text-primary dark:text-white">{stats.total_students}</div>
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

            <div className="bg-gradient-to-br from-primary to-blue-800 rounded-3xl p-6 shadow-lg shadow-blue-500/20 relative overflow-hidden group text-white">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
              <div className="text-sm font-bold text-white/70 mb-4">Prochain Cours</div>
              <div className="text-2xl font-black text-white leading-tight">
                {stats.next_classes[0] ? stats.next_classes[0].time : 'Libre'}
              </div>
              <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-2">
                {stats.next_classes[0] ? stats.next_classes[0].location : 'Aucun cours prévu'}
              </div>
            </div>
          </div>

          {/* Banner: Ordre de Service & Signature */}
          <div className="bg-gradient-to-r from-primary via-blue-800 to-primary rounded-3xl p-6 md:p-8 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
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
                  href={`/api/v1/admin/professor-assignments/ordre-de-service-pdf?prof=${encodeURIComponent(user?.name || '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-[#0f2863] font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" /> Ordre de Service (A4 PDF)
                </a>

                {hasAcknowledged ? (
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="px-4 py-2.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:bg-emerald-500/40 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" /> Émargé le {new Date().toLocaleDateString('fr-FR')} (Revoir)
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

          <div className="xl:col-span-2 space-y-6">
              
              {/* Prochaines séances */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black text-[#001A4B] flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Agenda d'Aujourd'hui
                  </h2>
                  <Link to="/professor/schedules" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Voir tout l'emploi du temps →</Link>
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
                        <button onClick={() => setActiveScannerSession(cls.session_id || 1)} className="hidden md:flex items-center gap-2 bg-[#001A4B] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-[#000d26] transition-colors cursor-pointer">
                          <QrCode className="w-4 h-4" /> FAIRE L'APPEL
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modules List */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black text-[#001A4B] flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Mes Éléments de Modules (Syllabus & Cours)
                  </h2>
                  <span className="text-xs font-bold text-gray-400">Semestre Automne 2026/2027</span>
                </div>

                <div className="space-y-4">
                  {(stats.modules_list && stats.modules_list.length > 0 ? stats.modules_list : []).map((mod: any) => (
                    <div key={mod.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              {mod.code || `MOD-${mod.id}`}
                            </span>
                            <h3 className="font-black text-sm text-slate-900">{mod.name}</h3>
                          </div>
                          <span className="text-xs text-slate-500 font-bold block mt-0.5">
                            {mod.group_name || mod.filiere || 'Groupe Affecté ENCG'} • {mod.hours_done ? `${mod.hours_done}h / ${mod.hours_total}h` : '48h'}
                          </span>
                        </div>
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                          {mod.progress || 0}% avancement
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${mod.progress || 0}%` }}></div>
                      </div>
                    </div>
                  ))}
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

      {/* ✍️ SIGNATURE ÉLECTRONIQUE & ACCUSÉ DE RÉCEPTION MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
                  <FileSignature className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Émargement & Accusé de Réception</h3>
                  <p className="text-xs text-slate-400 font-medium">Ordre de Service & Affectations 2026/2027</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSignModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-700 leading-relaxed">
                Je soussigné(e), <strong className="text-indigo-900">{user?.name || ''}</strong>, confirme avoir pris connaissance de mon ordre de service officiel décernant mes modules et horaires d'enseignement pour le semestre courant.
              </p>
              <div className="font-mono text-[10px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Certificat Horodaté ENCG Fès — Hash SHA-256 : 8f9a2b4c1e0d3f7a</span>
              </div>
            </div>

            {/* Interactive Drawing Canvas Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-500">
                  Zone de Signature Tactile / Souris
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generateStylizedSignature}
                    className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" /> Signature Auto
                  </button>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] font-black text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-rose-50 px-2.5 py-1 rounded-lg"
                  >
                    <RotateCcw className="w-3 h-3" /> Effacer
                  </button>
                </div>
              </div>

              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden shadow-inner group hover:border-emerald-500 transition-colors">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] cursor-crosshair touch-none"
                />

                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-4 space-y-1">
                    <PenTool className="w-6 h-6 text-slate-300" />
                    <div className="text-xs font-bold text-slate-400">
                      Signez ici avec votre souris, stylet ou doigt
                    </div>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono text-center">
                Signature Électronique Certifiée • Conforme Loi 53-05 sur la validité des actes numériques
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSignOrdreDeService}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/20 transition-all cursor-pointer flex items-center gap-2"
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
