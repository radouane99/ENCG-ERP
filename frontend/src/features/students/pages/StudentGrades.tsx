import React from 'react';
import { CheckCircle2, FlaskConical, Beaker, MessageSquare } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function StudentGrades() {
  const grades = [
    { name: 'Introduction - Génie Informatique', code: 'INF-101', cc1: 19.00, cc2: 18.00, exam: 14.50, total: 16.10, status: 'VALIDÉ' },
    { name: 'Avancé - Génie Informatique', code: 'INF-201', cc1: 5.50, cc2: 8.50, exam: 7.00, total: 7.00, status: 'RATTRAPAGE' },
    { name: 'Développement mobile', code: 'DEV-301', cc1: 11.80, cc2: 11.70, exam: 16.60, total: 14.66, status: 'VALIDÉ' },
    { name: 'Développement mobile LARAVEL', code: 'DEV-302', cc1: 12.90, cc2: 12.20, exam: 6.00, total: 8.62, status: 'RATTRAPAGE' },
    { name: 'Intelligent Artificiel', code: 'IA-401', cc1: 17.20, cc2: 16.30, exam: 8.40, total: 11.74, status: 'VALIDÉ' },
    { name: 'SQL SERVER BASE DE DONNEE', code: 'DB-201', cc1: 14.20, cc2: 17.60, exam: 11.30, total: 13.14, status: 'VALIDÉ' },
    { name: 'GAMING', code: 'GAM-501', cc1: 15.00, cc2: 14.00, exam: 16.00, total: 15.00, status: 'VALIDÉ' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#0f766e] rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-lg border border-teal-600/50">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white mb-2">Performance Académique</h1>
          <p className="text-teal-100">Suivez vos notes validées et vos résultats finaux par semestre.</p>
          <button className="mt-6 bg-white text-teal-800 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 hover:bg-teal-50 transition-colors">
            <FlaskConical className="w-4 h-4" /> ACTIVER LE SIMULATEUR
          </button>
        </div>

        <div className="relative z-10 text-right">
          <div className="text-xs font-bold text-teal-200 uppercase tracking-widest mb-1">MOYENNE ANNUELLE</div>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-6xl font-black text-white">11.61</span>
            <span className="text-2xl font-bold text-teal-200">/ 20</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-teal-800/40 border border-teal-500/50 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
            ANNÉE VALIDÉE <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* S1 Table */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <h2 className="text-2xl font-black text-[#001A4B]">S1</h2>
          <div className="text-sm font-bold text-white/50">
            Moyenne Semestre : <span className="text-[#0f766e]">11.61</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5">
                <th className="pb-4 pl-4 w-1/3">MODULE</th>
                <th className="pb-4 text-center">CC1 (40%)</th>
                <th className="pb-4 text-center">CC2 (40%)</th>
                <th className="pb-4 text-center">EXAMEN FINAL</th>
                <th className="pb-4 text-right pr-4">MOYENNE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {grades.map((grade, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]/50 transition-colors group">
                  <td className="py-5 pl-4">
                    <div className="font-bold text-white">{grade.name}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">{grade.code}</div>
                  </td>
                  <td className="py-5 text-center font-semibold text-white/80">{grade.cc1.toFixed(2)}</td>
                  <td className="py-5 text-center font-semibold text-white/80">{grade.cc2.toFixed(2)}</td>
                  <td className="py-5 text-center font-black text-[#001A4B]">{grade.exam.toFixed(2)}</td>
                  <td className="py-5 text-right pr-4">
                    <div className={cn("text-lg font-black", grade.status === 'VALIDÉ' ? "text-[#0f766e]" : "text-rose-600")}>
                      {grade.total.toFixed(2)}
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1",
                        grade.status === 'VALIDÉ' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {grade.status} {grade.status === 'VALIDÉ' && <CheckCircle2 className="w-3 h-3" />}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
