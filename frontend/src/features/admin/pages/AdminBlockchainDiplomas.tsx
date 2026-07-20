import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Link as LinkIcon, Award, FileText, CheckCircle2, Copy, Search, Key } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AdminBlockchainDiplomas() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRtl = i18n.language === 'ar';

  const generatedDiplomas = [
    { name: isRtl ? 'عثمان ب.' : 'Othmane B.', degree: isRtl ? 'ماستر الإدارة المالية' : 'Master Management Financier', date: '25/06/2026', hash: '0x8f2a...4b9e', status: 'VERIFIED' },
    { name: isRtl ? 'آية ر.' : 'Aya R.', degree: isRtl ? 'ماستر التسويق الرقمي' : 'Master Marketing Digital', date: '25/06/2026', hash: '0x3c1d...9a2f', status: 'VERIFIED' },
    { name: isRtl ? 'كريم ل.' : 'Karim L.', degree: isRtl ? 'الإجازة في التسيير' : 'Licence en Gestion', date: '24/06/2026', hash: '0x7e5b...1d8c', status: 'VERIFIED' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#001A4B] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Node Sécurisé
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Certification Blockchain</h1>
            <p className="text-blue-200 text-lg max-w-2xl">
              Générez et ancrez les diplômes de l'ENCG sur un registre distribué pour une vérification instantanée et infalsifiable.
            </p>
          </div>
          <div className="shrink-0">
            <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:from-blue-600 hover:to-indigo-700 transition-colors shadow-lg flex items-center gap-3">
              <Award className="w-6 h-6" /> Certifier la Promo 2026
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Network Status */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><LinkIcon className="w-24 h-24 text-[#003a8c]" /></div>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Statut du Réseau</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white/80 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Node ENCG
                </span>
                <span className="text-xs font-mono bg-white/[0.05] px-2 py-1 rounded text-white/70">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white/80 flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-400" /> Signature Cryptographique
                </span>
                <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200">Valide</span>
              </div>
              <div className="pt-4 border-t border-white/5">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Diplômes Ancrés</div>
                <div className="text-3xl font-black text-[#003a8c]">1,452</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verifier Tool */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5 h-full flex flex-col justify-center">
            <h2 className="text-xl font-black text-white mb-2">Vérificateur Public</h2>
            <p className="text-white/50 text-sm mb-6">Outil de simulation pour vérifier un hash ou un ID de diplôme public.</p>
            
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Ex: 0x8f2a... ou ENCG-DIP-2026-001" 
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono text-sm"
                />
              </div>
              <button className="bg-[#001A4B] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#003a8c] transition-colors shadow-sm">
                Vérifier
              </button>
            </div>
            
            {/* Example success verification */}
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">Diplôme Authentique</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Ce certificat a été délivré par l'ENCG Fès le 25/06/2026. Aucune modification n'a été détectée.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">Registre des Émissions (Ledger)</h2>
          <button className="text-sm font-bold text-blue-600 hover:underline">Voir tout l'historique</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Étudiant</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Diplôme</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date d'Ancrage</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Hash de Transaction</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Statut Réseau</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {generatedDiplomas.map((dip, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-bold text-white">{dip.name}</td>
                  <td className="p-4 text-sm text-white/70 font-medium">{dip.degree}</td>
                  <td className="p-4 text-sm text-white/50">{dip.date}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-white/[0.05] px-2 py-1 rounded text-white/70">{dip.hash}</span>
                      <button className="text-gray-400 hover:text-blue-500"><Copy className="w-3 h-3" /></button>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-emerald-200 flex items-center gap-1 w-max">
                      <CheckCircle2 className="w-3 h-3" /> {dip.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-white/50 hover:text-[#003a8c] flex items-center gap-2 text-sm font-bold bg-white border border-white/10 px-3 py-1.5 rounded-lg shadow-sm transition-all hover:shadow-md">
                      <FileText className="w-4 h-4" /> PDF
                    </button>
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
