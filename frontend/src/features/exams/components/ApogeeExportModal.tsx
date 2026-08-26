import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, FileSpreadsheet, X, CheckCircle2, ShieldCheck, 
  Building2, AlertTriangle, RefreshCw, FileText, Loader2
} from 'lucide-react';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

interface ApogeeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFiliereId?: string | number;
}

export default function ApogeeExportModal({ isOpen, onClose, defaultFiliereId }: ApogeeExportModalProps) {
  const [selectedFiliere, setSelectedFiliere] = useState<string>(defaultFiliereId?.toString() || '');
  const [selectedSemester, setSelectedSemester] = useState<string>('');

  // 1. Fetch Filieres for filtering
  const { data: filieres = [] } = useQuery({
    queryKey: ['filieres-list'],
    queryFn: () => api.get('/filieres').then(res => res.data.data || res.data || []),
  });

  // 2. Fetch Apogee Preview Data
  const { data: previewData, isLoading, refetch } = useQuery({
    queryKey: ['apogee-preview', selectedFiliere, selectedSemester],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (selectedFiliere) params.filiere_id = selectedFiliere;
      if (selectedSemester) params.semester_id = selectedSemester;
      const res = await api.get('/admin/apogee/preview', { params });
      return res.data?.data || null;
    },
    enabled: isOpen,
  });

  // Direct Download Trigger
  const handleDownloadCsv = () => {
    const params = new URLSearchParams();
    if (selectedFiliere) params.append('filiere_id', selectedFiliere);
    if (selectedSemester) params.append('semester_id', selectedSemester);

    const url = `/api/v1/admin/apogee/export-csv?${params.toString()}`;
    
    toast.success('📥 Téléchargement du fichier APOGEE officiel en cours...', {
      description: 'Format CSV conforme aux spécifications du MESRSFC (Royaume du Maroc).'
    });

    openAuthenticatedUrl(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#11296b] to-[#1e3b8a] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-white/20 text-amber-300 text-[10px] font-black uppercase rounded-md tracking-wider">
                  MESRSFC • APOGEE
                </span>
                <span className="text-xs text-blue-200 font-bold">Code Établissement : 040</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Export Officiel des Délibérations APOGEE
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filière</label>
              <select
                value={selectedFiliere}
                onChange={(e) => setSelectedFiliere(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="">Toutes les Filières</option>
                {filieres.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Semestre</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="">Tous les Semestres</option>
                {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'].map((s, idx) => (
                  <option key={s} value={idx + 1}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Rafraîchir"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" /> Télécharger Fichier CSV APOGEE
            </button>
          </div>
        </div>

        {/* Records Preview Table */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Aperçu des 50 premiers enregistrements prêts pour transmission ministérielle</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200">
              Total : {previewData?.total_records || 0} lignes
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span>Génération du flux APOGEE en cours...</span>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider text-[10px] font-black border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">COD_ETB</th>
                    <th className="p-3">COD_IND</th>
                    <th className="p-3">CNE (COD_ETU)</th>
                    <th className="p-3">NOM & PRÉNOM</th>
                    <th className="p-3">MODULE (COD_ELP)</th>
                    <th className="p-3 text-center">NOTE (NOT_ELP)</th>
                    <th className="p-3 text-center">DÉCISION (COD_TRE)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {(previewData?.records || []).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-400">{row.COD_ETB}</td>
                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{row.COD_IND}</td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{row.COD_ETU}</td>
                      <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">
                        {row.NOM_ETU} {row.PRE_ETU}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-slate-700 dark:text-slate-300">
                          {row.COD_ELP}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                        {row.NOT_ELP} / 20
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                          row.COD_TRE === 'V' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                          row.COD_TRE === 'RAT' && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                          row.COD_TRE === 'NV' && "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        )}>
                          {row.COD_TRE}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Conforme à la circulaire ministérielle MESRSFC — Système LMD Marocain
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
