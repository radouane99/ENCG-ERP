import React from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, FileText, Star } from 'lucide-react';

export default function ProfessorInternships() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500">
      
      <h1 className="text-2xl font-black text-[#001A4B] italic mb-6">Mes Encadrements & Tutorats (Stages)</h1>

      {/* Banner */}
      <div className="bg-[#001A4B] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 inline-block border border-white/20">
            Espace Enseignant
          </span>
          <h2 className="text-3xl font-black tracking-tight mb-3 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-amber-600 fill-amber-600/20" /> Suivi des Stages Universitaires
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Supervisez l'insertion professionnelle de vos étudiants, apportez du feedback sur leurs rapports et clôturez leurs évaluations.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
        
        <div className="mb-6 border-b border-white/5 pb-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#e6007e]" /> Liste des stagiaires encadrés
          </h3>
          <p className="text-xs text-white/50 mt-1">Étudiants dont vous êtes désigné comme tuteur académique.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Étudiant</th>
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Groupe / Filière</th>
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Entreprise</th>
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Dates du Stage</th>
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 text-center">Rapports Déposés</th>
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 text-center">Statut / Note</th>
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr className="border-b border-gray-50 hover:bg-white/[0.02]/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-sm">
                      A
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">Aniss el alaoui</div>
                      <div className="text-[10px] text-gray-400 font-bold">NÂ° 1</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-xs font-bold text-white/90">Génie Informatique - Groupe 1</div>
                  <div className="text-[10px] text-[#e6007e] font-bold mt-1 uppercase">INF</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-xs font-bold text-white">ENCG</div>
                  <div className="text-[10px] text-white/50 font-medium mt-1">Tuteur Pro : RADOUANE EL-ASRI</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-xs text-white/70 font-medium">Début : <span className="font-bold text-white">01/06/2026</span></div>
                  <div className="text-xs text-white/70 font-medium mt-1">Fin : <span className="font-bold text-white">30/07/2026</span></div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs">
                    1
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                    <Star className="w-3 h-3 fill-emerald-500" /> 19.50 / 20
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <button className="bg-[#003a8c] hover:bg-[#002a66] text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
                    Évaluer
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
