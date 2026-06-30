import React from 'react';
import { Link } from 'react-router-dom';
import {
  Target, Settings, AlertTriangle, ShieldAlert, BarChart3,
  Clock, FileText, XCircle, GraduationCap, FileDown, ChevronRight,
} from 'lucide-react';

const stats = [
  {
    id: 1, label: 'Étudiants à risque\n(≥ 80h)', value: '0', badge: 'RISQUE',
    icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10',
    badgeColor: 'text-amber-400', link: '/students',
  },
  {
    id: 2, label: 'Conseil de discipline\n(≥ 120h)', value: '0', badge: 'DISCIPLINE',
    icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/10',
    badgeColor: 'text-red-400', link: '/discipline',
  },
  {
    id: 3, label: 'Heures non justifiées\ncumulées', value: '51.5h', badge: 'TOTAL',
    icon: BarChart3, color: 'text-rose-400', bg: 'bg-rose-400/10',
    badgeColor: 'text-rose-400', link: '/attendance',
  },
  {
    id: 4, label: 'Justificatifs cours\nen attente', value: '10', badge: 'EN ATTENTE',
    icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/10',
    badgeColor: 'text-orange-400', link: '/attendance',
  },
  {
    id: 5, label: 'Absences enregistrées\naux examens', value: '16', badge: 'EXAMENS',
    icon: FileText, color: 'text-purple-400', bg: 'bg-purple-400/10',
    badgeColor: 'text-purple-400', link: '/academic/exam-planning',
  },
  {
    id: 6, label: 'Cas de fraude\ndétectés', value: '2', badge: 'FRAUDE',
    icon: XCircle, color: 'text-pink-400', bg: 'bg-pink-400/10',
    badgeColor: 'text-pink-400', link: '/students',
  },
  {
    id: 7, label: 'Rattrapages\naccordés', value: '1', badge: 'RATTRAPAGE',
    icon: GraduationCap, color: 'text-teal-400', bg: 'bg-teal-400/10',
    badgeColor: 'text-teal-400', link: '/exams/deliberations',
  },
  {
    id: 8, label: 'Convocations non\ntéléchargées', value: '774', badge: 'CONVOCS',
    icon: FileDown, color: 'text-blue-400', bg: 'bg-blue-400/10',
    badgeColor: 'text-blue-400', link: '/academic/convocations/dashboard',
  },
];

export default function PilotagePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Centre de Pilotage Académique</h1>
            <p className="text-xs text-muted-foreground">Tableau de bord intelligent des alertes académiques</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
          <Settings className="w-3.5 h-3.5" /> Configurer les seuils
        </button>
      </div>

      {/* Main Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/90 to-secondary/90 p-8 text-white shadow-lg">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}
        />
        <div className="relative z-10 space-y-3">
          <h2 className="text-3xl font-black tracking-tight">Pilotage Académique</h2>
          <p className="text-white/80 text-sm max-w-2xl">
            Vue d'ensemble de toutes les alertes académiques : absences, discipline, examens, rattrapage et convocations.
          </p>
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-amber-300 border border-white/10">
              <AlertTriangle className="w-3.5 h-3.5" /> Seuil avertissement : 80h
            </span>
            <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white/90 border border-white/10">
              <ShieldAlert className="w-3.5 h-3.5" /> Seuil discipline : 120h
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link
            key={stat.id}
            to={stat.link}
            className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all group flex flex-col justify-between min-h-[140px] cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>
            <div className="mt-4">
              <div className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-xs font-medium text-muted-foreground whitespace-pre-line leading-tight">{stat.label}</div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
              Voir les détails <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conseil de Discipline */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Conseil de Discipline</h3>
                  <p className="text-xs text-muted-foreground">0 étudiant(s)</p>
                </div>
              </div>
              <Link to="/discipline" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors flex items-center gap-1">
                Voir tout <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="py-8 text-center text-xs font-medium text-muted-foreground italic bg-muted/30 rounded-xl">
              Aucun étudiant ne nécessite un conseil de discipline.
            </div>
          </div>
        </div>

        {/* Justifications Examen en Attente */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Justifications Examen en Attente</h3>
                  <p className="text-xs text-muted-foreground">0 en attente</p>
                </div>
              </div>
              <Link to="/attendance" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors flex items-center gap-1">
                Voir tout <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="py-8 text-center text-xs font-medium text-muted-foreground italic bg-muted/30 rounded-xl">
              Aucune justification en attente de traitement.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
