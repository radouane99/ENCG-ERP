import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, 
  BookOpen, 
  Clock, 
  FileEdit, 
  CheckCircle2, 
  QrCode, 
  BookMarked, 
  Award, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '@/shared/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/shared/lib/utils';

const ProfessorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-professor-stats'],
    queryFn: () => api.get('/dashboard/professor/stats').then(r => r.data.data),
  });

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chargement du tableau de bord enseignant...</p>
      </div>
    );
  }

  const attendanceData = stats.modules_list?.map((m: any) => ({
    module: m.code || m.name,
    fullName: m.name,
    presence: m.progress || 0,
    hoursDone: m.hours_done || 0,
    hoursTotal: m.hours_total || 45,
  })) || [];

  const BAR_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#3b82f6'];
  const validatedHours = stats.modules_list?.reduce((acc: number, m: any) => acc + (m.hours_done || 0), 0) || 0;

  return (
    <div className="space-y-8 animate-in p-2 md:p-4 max-w-7xl mx-auto pb-24">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-8 md:p-10 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold backdrop-blur-md border border-white/10">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>{stats.role_title || 'Espace Enseignant-Chercheur — ENCG Fès'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Bienvenue, Pr. {user?.name || 'Enseignant'} 👋
              </h1>
              {stats.role_badge && (
                <span className="px-3.5 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md">
                  {stats.role_badge}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Consultez vos cours, saisissez les notes d'examens, prenez la présence par QR Code et accédez à vos outils de gestion académique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/professor/scanner')}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 group"
            >
              <QrCode className="w-4 h-4" />
              <span>Scanner QR Présence</span>
            </button>
            <button
              onClick={() => navigate('/professor/grades')}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/20 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <FileEdit className="w-4 h-4 text-amber-400" />
              <span>Saisie des Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">MODULES ASSIGNÉS</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{stats.total_modules || 0}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Espaces de cours actifs</p>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full w-full"></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">ÉTUDAINTS ENCADRÉS</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-indigo-900">{stats.total_students || 0}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Étudiants inscrits aux filières</p>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full w-3/4"></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">NOTES EN ATTENTE</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-sm">
              <FileEdit className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-amber-600">{stats.pending_grades || 0}</p>
            <p className="text-xs font-semibold text-amber-800/80 mt-1">Évaluations à renseigner</p>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-1/2"></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">HEURES EFFECTUÉES</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-900">{validatedHours}h</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Volume horaire réalisé</p>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full w-2/3"></div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section: Assiduité & Progression des Modules */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Progression Pédagogique
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Avancement des Cours par Module
                </h3>
              </div>
              <button 
                onClick={() => navigate('/classroom')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>Voir Classrooms</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {attendanceData.length > 0 ? (
              <div className="space-y-6">
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                      <YAxis dataKey="module" type="category" tick={{ fill: '#0f172a', fontSize: 12, fontWeight: 700 }} axisLine={false} width={90} />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#0f172a', 
                          border: 'none', 
                          borderRadius: '16px', 
                          color: '#fff',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                        }}
                        formatter={(val: any) => [`${val}% d'avancement`, 'Progression']}
                      />
                      <Bar dataKey="presence" radius={[0, 8, 8, 0]} barSize={22}>
                        {attendanceData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Module Details Table */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                  {stats.modules_list?.map((mod: any, idx: number) => (
                    <div key={mod.id || idx} className="p-4 flex items-center justify-between hover:bg-white transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-700">
                          {mod.code || `M${idx + 1}`}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-extrabold text-slate-800">{mod.name}</p>
                            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                              {mod.group_name || 'GROUPE AFFECTÉ'}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{mod.hours_done || 0}h réalisées / {mod.hours_total || 45}h prévues</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs font-black text-indigo-900">{mod.progress || 0}%</span>
                        </div>
                        <button
                          onClick={() => navigate(`/student/classroom/${mod.id}`)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-extrabold transition-colors"
                        >
                          Accéder
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">Aucun module assigné pour ce semestre.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Prochains Cours & Quick Actions */}
        <div className="space-y-6">
          {/* Prochain Cours Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-600 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Emploi du Temps
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[10px] font-extrabold">Aujourd'hui</span>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">Prochain Cours Planifié</h3>

            {stats.next_classes?.[0] ? (
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {stats.next_classes[0].time || '09:00 - 11:00'}
                  </span>
                  <span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">
                    {stats.next_classes[0].room || 'Amphi A'}
                  </span>
                </div>
                <p className="text-base font-extrabold">{stats.next_classes[0].title || stats.next_classes[0].module}</p>
                <p className="text-xs text-slate-300 font-semibold">{stats.next_classes[0].group || 'Tronc Commun ENCG'}</p>
              </div>
            ) : (
              <Link to="/professor/schedules" className="block p-6 text-center bg-slate-50 hover:bg-indigo-50/50 transition-colors rounded-2xl border border-slate-100 space-y-2 group cursor-pointer">
                <Calendar className="w-8 h-8 text-indigo-500 mx-auto group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Consulter Mon Emploi du Temps</p>
                <p className="text-[10px] text-slate-500 font-semibold">Afficher mon calendrier de cours et mes affectations de groupes.</p>
              </Link>
            )}
          </div>

          {/* Quick Hub Tools */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Raccourcis Enseignant
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <Link 
                to="/professor/textbook" 
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Cahier de Texte</p>
                    <p className="text-[10px] font-semibold text-slate-400">Saisie des comptes-rendus</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link 
                to="/professor/recommendations" 
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-pink-50/50 border border-slate-100 hover:border-pink-100 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Lettres de Recommandation</p>
                    <p className="text-[10px] font-semibold text-slate-400">Génération par IA & Signature</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link 
                to="/professor/ai-copilot" 
                className="p-3.5 rounded-2xl bg-purple-50/60 hover:bg-purple-100/60 border border-purple-200/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-purple-950 dark:text-white flex items-center gap-1.5">
                      Copilote IA & Examens <span className="px-1.5 py-0.2 bg-purple-600 text-white text-[9px] font-black rounded-md">NEW</span>
                    </p>
                    <p className="text-[10px] font-semibold text-purple-700/80 dark:text-purple-300">Conception d'épreuves sur 20 & Trame IA</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link 
                to="/professor/internships" 
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-100 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Encadrement PFE & Jurys</p>
                    <p className="text-[10px] font-semibold text-slate-400">Suivi des soutenances</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
