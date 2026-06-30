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
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';

export default function ProfessorDashboard() {
  const { user } = useAuthStore();
  const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto font-sans animate-in fade-in zoom-in duration-500">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-white/5">
        <div>
          <h1 className="text-2xl font-black text-[#001A4B] flex items-center gap-2">
            <Moon className="w-6 h-6 text-amber-400 fill-amber-400" />
            Bonsoir, {user?.name || "Radouane el asri"}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-400 tracking-wider">
            <Calendar className="w-4 h-4" />
            {currentDate} â€¢ TABLEAU DE BORD ENSEIGNANT
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rôle Académique</span>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Professeur
          </div>
        </div>
      </div>

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-[#001A4B] to-[#1a365d] rounded-3xl p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-[#e6007e]/20 text-[#ffb6dc] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 inline-block border border-[#e6007e]/30">
            Espace Pédagogique
          </span>
          <h2 className="text-4xl font-black tracking-tight mb-3 flex items-center gap-3">
            Portail Enseignant <BookOpen className="w-8 h-8 text-[#e6007e]" />
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Bon retour parmi nous. Pilotez vos enseignements avec précision et accompagnez vos étudiants vers l'excellence.
          </p>
        </div>
        
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center shadow-2xl min-w-[180px]">
          <div className="text-5xl font-black text-white mb-1">2</div>
          <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Groupes Assignés</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Taux de réussite */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6 relative">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="36" fill="transparent" stroke="#ecfdf5" strokeWidth="8" />
              <circle cx="40" cy="40" r="36" fill="transparent" stroke="#10b981" strokeWidth="8" strokeDasharray="226" strokeDashoffset="42" className="transition-all duration-1000 ease-out" />
            </svg>
            <TrendingUp className="w-8 h-8 text-emerald-500 relative z-10" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Taux de réussite global</h3>
          <div className="text-5xl font-black text-[#001A4B] mb-4">81%</div>
          <p className="text-xs text-white/50 max-w-[200px] mx-auto italic">
            Pourcentage d'étudiants ayant obtenu la moyenne dans vos modules.
          </p>
        </div>

        {/* Top Etudiants */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-[#001A4B] flex items-center gap-2">
              Top Étudiants <Trophy className="w-5 h-5 text-amber-500" />
            </h3>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider">Vos Modules</span>
          </div>
          <div className="space-y-4 flex-1">
            {[
              { id: '#31', name: 'Ali El Fassi', grade: '16.83' },
              { id: '#45', name: 'Nada Tazi', grade: '16.75' },
              { id: '#40', name: 'Omar Tahiri', grade: '16.18' }
            ].map((student, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="bg-white/[0.05] text-white/70 text-xs font-bold px-2 py-1 rounded-md">{student.id}</span>
                  <span className="text-sm font-bold text-white/90">{student.name}</span>
                </div>
                <span className="text-sm font-black text-[#001A4B]">{student.grade}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Absents Frequents */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-[#001A4B] flex items-center gap-2">
              Absents Fréquents <AlertTriangle className="w-5 h-5 text-rose-500" />
            </h3>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md uppercase tracking-wider">Non Justifiés</span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
            {[
              { letter: 'A', name: 'Ahmed Benani', count: '5 absences' },
              { letter: 'A', name: 'Aniss el alaoui', count: '4 absences' },
              { letter: 'I', name: 'Ilyas Tazi', count: '4 absences' },
              { letter: 'Y', name: 'Youssef Chraibi', count: '2 absences' },
              { letter: 'Z', name: 'Zineb Guessous', count: '2 absences' }
            ].map((student, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center font-bold text-xs">
                    {student.letter}
                  </div>
                  <span className="text-sm font-bold text-white/90">{student.name}</span>
                </div>
                <span className="text-xs font-bold text-rose-600">{student.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Outils Pédagogiques Grid */}
      <div className="mt-12">
        <h2 className="text-2xl font-black text-[#001A4B] italic mb-6">Outils Pédagogiques</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          
          <Link to="/calendar" className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex flex-col hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-black text-white text-sm mb-1">Planning</h4>
            <p className="text-[10px] text-gray-400 font-medium">Emploi du temps</p>
          </Link>

          <Link to="/exams/notes" className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex flex-col hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003a8c] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h4 className="font-black text-white text-sm mb-1">Notes</h4>
            <p className="text-[10px] text-gray-400 font-medium">Saisie et validation</p>
          </Link>

          <Link to="/professor/absences" className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex flex-col hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-black text-white text-sm mb-1">Absences</h4>
            <p className="text-[10px] text-gray-400 font-medium">Feuilles manuelles</p>
          </Link>

          <Link to="/professor/check-in/scanner" className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex flex-col hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <h4 className="font-black text-white text-sm mb-1">Scanner QR</h4>
            <p className="text-[10px] text-gray-400 font-medium">Présence rapide</p>
          </Link>

          <Link to="/professor/classroom/1" className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex flex-col hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <h4 className="font-black text-white text-sm mb-1">Classroom</h4>
            <p className="text-[10px] text-gray-400 font-medium">Supports et annonces</p>
          </Link>

          <Link to="/professor/reservations" className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex flex-col hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="font-black text-white text-sm mb-1">Salles</h4>
            <p className="text-[10px] text-gray-400 font-medium">Réservations ponctuelles</p>
          </Link>

          <Link to="/professor/proctor-convocations" className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex flex-col hover:shadow-md transition-shadow group border-rose-100 bg-rose-50/20">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="font-black text-white text-sm mb-1">Proctoring</h4>
            <p className="text-[10px] text-gray-400 font-medium">Surveillance d'examens</p>
          </Link>

          <Link to="#" className="col-span-2 lg:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-lg shadow-purple-500/20 flex flex-col justify-between hover:shadow-xl transition-shadow group text-white border border-purple-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-white/20 relative z-10">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="relative z-10">
              <h4 className="font-black text-white text-lg mb-1 flex items-center gap-2">
                Générateur QCM
              </h4>
              <p className="text-[11px] text-purple-100 font-medium tracking-wide">Propulsé par IA</p>
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}
