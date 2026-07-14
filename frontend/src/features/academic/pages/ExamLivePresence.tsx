import React, { useState, useEffect } from 'react';
import { Eye, Download, ArrowLeft, Users, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '@/shared/lib/api';

export default function ExamLivePresence() {
  const { examId } = useParams();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/admin/exam-planning/${examId || 1}/live-stats`);
        setStats(res.data.data);
      } catch (error) {
        console.error(error);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [examId]);

  const percentage = stats ? Math.round((stats.present / stats.total_students) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/10 rounded-full">
            <Eye className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-pink-600 italic">Dashboard Live Présences</h1>
            <p className="text-white/50 text-xs">Suivi en temps réel : Avancé - Génie Informatique â€” Groupe 2</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="bg-[#e91e63] hover:bg-[#c2185b] text-white px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide flex items-center gap-2">
            <Download className="w-4 h-4" /> Télécharger Rapport PDF
          </button>
          <Link to="/academic/exam-planning" className="bg-white hover:bg-white/5 border border-white/10 text-foreground px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour aux examens
          </Link>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="w-3 h-3 rounded-full bg-teal-500 animate-pulse"></span>
            Actualisation en temps réel (toutes les 5s)
          </div>
          <div className="text-xs text-white/50">Dernière mise Ã  jour: {new Date().toLocaleTimeString()}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5/30 border border-white/10 rounded-xl p-5 relative overflow-hidden">
            <div className="text-xs font-bold text-white/50 uppercase mb-1">Total Étudiants</div>
            <div className="text-4xl font-black">{stats?.total_students || 0}</div>
            <Users className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/50/10" />
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 relative overflow-hidden">
            <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Présents</div>
            <div className="text-4xl font-black text-emerald-700">{stats?.present || 0}</div>
            <CheckCircle2 className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-emerald-600/10" />
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-5 relative overflow-hidden">
            <div className="text-xs font-bold text-red-600 uppercase mb-1">Absents / En attente</div>
            <div className="text-4xl font-black text-red-700">
              {stats ? stats.total_students - stats.present : 0}
            </div>
            <XCircle className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-red-600/10" />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 relative overflow-hidden flex flex-col justify-center">
            <div className="text-xs font-bold text-blue-600 uppercase mb-1">Taux de présence</div>
            <div className="text-4xl font-black text-blue-700">{percentage}%</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold uppercase mb-2">
            <span>Progression du Check-in</span>
            <span className="text-teal-600">{percentage}% complété</span>
          </div>
          <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 transition-all duration-1000" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white border border-white/10 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5/10">
            <h3 className="font-bold">Journal des scans (Flux en direct)</h3>
            <button className="text-pink-600 text-xs font-bold flex items-center gap-1 bg-pink-50 px-2 py-1 rounded">
              <RefreshCw className="w-3 h-3" /> Rafraîchir la liste
            </button>
          </div>
          
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/50 uppercase bg-white/5/20">
              <tr>
                <th className="px-6 py-3 font-bold">Étudiant</th>
                <th className="px-6 py-3 font-bold text-center">Statut</th>
                <th className="px-6 py-3 font-bold text-right">Heure de Scan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats?.latest_scans?.map((scan: any, i: number) => (
                <tr key={i} className="animate-in fade-in slide-in-from-top-2 duration-500">
                  <td className="px-6 py-4 font-medium">{scan.student}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Présent</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs">{scan.time}</td>
                </tr>
              ))}
              {!stats?.latest_scans?.length && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-white/50">
                    Aucun scan enregistré pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
