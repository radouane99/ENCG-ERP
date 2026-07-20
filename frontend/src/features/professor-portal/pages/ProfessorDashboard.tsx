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

export default function ProfessorDashboard() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  const { user } = useAuthStore();
  const currentDate = new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-white/5">
        <div>
          <h1 className="text-2xl font-black text-[#001A4B] flex items-center gap-2">
            <Moon className="w-6 h-6 text-amber-400 fill-amber-400" />
            Bonjour, {user?.name}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-400 tracking-wider">
            <Calendar className="w-4 h-4" />
            {currentDate} • TABLEAU DE BORD ENSEIGNANT
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rôle Académique</span>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
            {stats.has_contract ? 'Vacataire' : 'Permanent'}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">Chargement des données...</div>
      ) : (
        <>
          {/* KPIs Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <Link to="/professor/check-in/scanner" className="hidden md:flex items-center gap-2 bg-[#001A4B] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-[#000d26] transition-colors">
                          <QrCode className="w-4 h-4" /> FAIRE L'APPEL
                        </Link>
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
                          <h3 className="font-bold text-foreground text-sm">{mod.name}</h3>
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
                  <Link to="/professor/check-in/scanner" className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 group hover:bg-indigo-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#001A4B] text-sm">Scanner QR Présence</div>
                      <div className="text-[10px] font-medium text-muted-foreground mt-0.5">Application mobile de scan</div>
                    </div>
                  </Link>

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
                    <a href={`http://localhost:8000/api/vacataires/${stats.professor_id}/pdf`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 group hover:bg-amber-50 transition-colors cursor-pointer">
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
    </div>
  );
}
