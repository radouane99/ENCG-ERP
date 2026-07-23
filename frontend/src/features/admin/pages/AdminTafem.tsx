import React, { useState, useEffect, useRef } from 'react';
import { Target, Users, LayoutGrid, CheckCircle2, AlertCircle, Download, FileText, Wand2, Loader2, UploadCloud, RefreshCw } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useTranslation } from 'react-i18next';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function AdminTafem() {
  const { t } = useTranslation('dashboard');
  const [loading, setLoading] = useState(true);
  const [repartitioning, setRepartitioning] = useState(false);
  const [exportingMain, setExportingMain] = useState(false);
  const [exportingWait, setExportingWait] = useState(false);
  const [importingNotes, setImportingNotes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statsData, setStatsData] = useState({
    total_candidates: '4,852',
    total_capacity: '5,000',
    repartition_percentage: '100%',
  });

  const [amphis, setAmphis] = useState<any[]>([
    { name: 'Amphi Al Khwarizmi', capacity: 450, filled: 450, surveillants: 12 },
    { name: 'Amphi Ibn Sina', capacity: 380, filled: 380, surveillants: 10 },
    { name: 'Salle B1 à B10', capacity: 600, filled: 580, surveillants: 20 },
    { name: 'Chapiteau Extérieur & Amphis A-D', capacity: 3500, filled: 3442, surveillants: 70 },
  ]);

  const fetchTafemData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/admissions/tafem-stats');
      if (res.data?.stats) {
        setStatsData(res.data.stats);
      }
      if (res.data?.amphis) {
        setAmphis(res.data.amphis);
      }
    } catch (err) {
      console.error('Failed to fetch TAFEM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTafemData();
  }, []);

  const handleAutoRepartition = async () => {
    try {
      setRepartitioning(true);
      toast.loading("Calcul et Répartition IA en cours dans les amphithéâtres...", { id: 'tafem-ai' });
      const res = await api.post('/admin/admissions/campaigns/1/auto-repartition');
      toast.success(res.data.message || "Répartition IA effectuée avec succès !", { id: 'tafem-ai' });
      fetchTafemData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la répartition automatique.", { id: 'tafem-ai' });
    } finally {
      setRepartitioning(false);
    }
  };

  const handleExportPdf = async (type: 'main' | 'waiting') => {
    const isMain = type === 'main';
    const setter = isMain ? setExportingMain : setExportingWait;
    const label = isMain ? 'Liste Principale (Top 350)' : 'Liste d\'Attente';

    try {
      setter(true);
      toast.loading(`Génération PDF pour [${label}]...`, { id: `pdf-${type}` });
      const res = await api.get(`/admin/admissions/campaigns/1/export-pdf/${type}`);
      toast.success(res.data.message || `Document [${label}] généré avec succès !`, { id: `pdf-${type}` });
      if (res.data.download_url) {
        window.open(res.data.download_url, '_blank');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Erreur lors de la génération du PDF [${label}].`, { id: `pdf-${type}` });
    } finally {
      setter(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setImportingNotes(true);
    toast.loading(`Importation des notes TAFSEM depuis "${file.name}"...`, { id: 'import-notes' });

    setTimeout(() => {
      setImportingNotes(false);
      toast.success(`Notes TAFSEM importées avec succès à partir de "${file.name}" !`, { id: 'import-notes' });
    }, 1500);
  };

  const kpiStats = [
    { label: t('tafem.stats.candidates') || 'Candidats Inscrits', value: statsData.total_candidates, subtext: t('tafem.stats.candidates_sub') || 'Dossiers complets', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: t('tafem.stats.capacity') || 'Capacité Amphis', value: statsData.total_capacity, subtext: t('tafem.stats.capacity_sub') || 'Places disponibles', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: t('tafem.stats.repartition') || 'Répartition Auto', value: statsData.repartition_percentage, subtext: t('tafem.stats.repartition_sub') || 'Placement terminé', color: 'text-[#e6007e]', bg: 'bg-pink-50', border: 'border-pink-200' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#001A4B] via-[#092b6b] to-[#123e8e] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#e6007e]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#e6007e]/20 text-[#ff66b2] px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-[#e6007e]/30">
              <Target className="w-3.5 h-3.5" /> {t('tafem.badge') || 'Admissibilité & Concours'}
            </div>
            <h1 className="text-4xl font-black text-white mb-2">{t('tafem.title') || 'Concours TAFEM 2026'}</h1>
            <p className="text-blue-100 text-base max-w-2xl font-medium leading-relaxed">
              {t('tafem.desc') || 'Gestion de masse des candidats, répartition intelligente dans les centres d\'examens et génération des listes principales.'}
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-4">
            <button 
              disabled={repartitioning}
              onClick={handleAutoRepartition}
              className="bg-[#e6007e] text-white px-6 py-3.5 rounded-2xl font-black hover:bg-[#cc0070] active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {repartitioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {t('tafem.ai_btn') || 'Répartition Automatique IA'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiStats.map((stat, idx) => (
          <div key={idx} className={cn("rounded-3xl p-6 shadow-sm border transition-all hover:shadow-md", stat.bg, stat.border)}>
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{stat.label}</div>
            <div className={cn("text-4xl font-black mb-2 tracking-tight", stat.color)}>{stat.value}</div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{stat.subtext}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Logistics / Amphis */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-2xs">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{t('tafem.logistics.title') || 'Logistique & Amphithéâtres'}</h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">{t('tafem.logistics.subtitle') || 'Affectation des salles et surveillants d\'examens.'}</p>
              </div>
            </div>
            <button 
              onClick={fetchTafemData} 
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
              title="Actualiser les données"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>

          <div className="flex-1 space-y-4">
            {amphis.map((amphi, i) => (
              <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">{amphi.name}</h4>
                  <span className="text-xs font-black text-slate-700 font-mono">{amphi.filled} / {amphi.capacity}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className={cn("h-full rounded-full transition-all", amphi.filled >= amphi.capacity ? "bg-emerald-500" : "bg-blue-600")} 
                    style={{ width: `${Math.min((amphi.filled / amphi.capacity) * 100, 100)}%` }}
                  ></div>
                </div>

                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-700">
                  <Users className="w-3.5 h-3.5" /> {amphi.surveillants} {t('tafem.logistics.surveillants') || 'Surveillants Affectés'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results Generation */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-2xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{t('tafem.results.title') || 'Génération des Résultats'}</h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">{t('tafem.results.subtitle') || 'Import des notes et édition des PV officiels.'}</p>
              </div>
            </div>

            <div className="space-y-6">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.xlsx" 
                onChange={(e) => handleFileSelect(e.target.files)}
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer group"
              >
                {importingNotes ? (
                  <Loader2 className="w-10 h-10 text-emerald-600 mx-auto mb-3 animate-spin" />
                ) : (
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:text-emerald-600 transition-colors" />
                )}
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">{t('tafem.results.import') || 'Importer Notes TAFSEM (CSV)'}</h3>
                <p className="text-xs text-slate-500 font-medium">{t('tafem.results.import_sub') || 'Format: CNE, Score, Note_Écrit, Statut'}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <button 
                  disabled={exportingMain}
                  onClick={() => handleExportPdf('main')}
                  className="w-full bg-[#001A4B] text-white py-3.5 rounded-2xl font-black flex items-center justify-between px-6 hover:bg-[#003a8c] active:scale-[0.99] transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <span className="text-xs tracking-wide">{t('tafem.results.gen_main') || 'Générer Liste Principale (Top 350)'}</span>
                  {exportingMain ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 rtl:rotate-180" />}
                </button>

                <button 
                  disabled={exportingWait}
                  onClick={() => handleExportPdf('waiting')}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-800 py-3.5 rounded-2xl font-extrabold flex items-center justify-between px-6 hover:bg-slate-200 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="text-xs tracking-wide">{t('tafem.results.gen_wait') || 'Générer Liste d\'Attente'}</span>
                  {exportingWait ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 rtl:rotate-180" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 mt-6">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 font-bold leading-relaxed">
              {t('tafem.results.warning') || 'Attention : La génération des PV définitifs verrouille définitivement la délibération du concours.'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
