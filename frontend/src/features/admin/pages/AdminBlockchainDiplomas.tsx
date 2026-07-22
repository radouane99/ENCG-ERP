import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Link as LinkIcon, Award, FileText, CheckCircle2, Copy, Search, Key, Loader2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blockchainApi } from '@shared/api/blockchain';
import { toast } from 'sonner';

export default function AdminBlockchainDiplomas() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRtl = i18n.language === 'ar';
  const queryClient = useQueryClient();

  const [verifyQuery, setVerifyQuery] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Fetch Ledger
  const { data, isLoading } = useQuery({
    queryKey: ['blockchain-ledger'],
    queryFn: () => blockchainApi.getLedger(),
  });

  const certificates = data?.data || [];

  // Certify Promo Mutation
  const certifyMutation = useMutation({
    mutationFn: () => blockchainApi.certifyPromo('2026'),
    onSuccess: (res: any) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['blockchain-ledger'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la certification.');
    }
  });

  // Verify Mutation
  const verifyMutation = useMutation({
    mutationFn: (q: string) => blockchainApi.verify(q),
    onSuccess: (res: any) => {
      setVerificationResult({ success: true, data: res.data });
    },
    onError: (err: any) => {
      setVerificationResult({ success: false, message: err.response?.data?.message || 'Document non reconnu.' });
    }
  });

  const handleVerify = () => {
    if (!verifyQuery) return;
    setVerificationResult(null);
    verifyMutation.mutate(verifyQuery);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner - Deep Tech Theme */}
      <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Blockchain Polygon Network
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Certification des Diplômes</h1>
            <p className="text-slate-400 text-lg max-w-2xl">
              Ancrez les diplômes de l'ENCG sur un registre distribué (Smart Contract) pour une vérification cryptographique instantanée et mondiale.
            </p>
          </div>
          <div className="shrink-0">
            <button 
              onClick={() => certifyMutation.mutate()}
              disabled={certifyMutation.isPending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-3 disabled:opacity-50"
            >
              {certifyMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Award className="w-6 h-6" />} 
              Certifier la Promo 2026
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Network Status */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><LinkIcon className="w-24 h-24 text-indigo-400" /></div>
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Statut du Réseau</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span> Node ENCG Master
                </span>
                <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-emerald-400 border border-emerald-500/20">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-500" /> Signature SHA-256
                </span>
                <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20">Active</span>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Diplômes Ancrés</div>
                <div className="text-3xl font-black text-white">{certificates.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verifier Tool */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 h-full flex flex-col justify-center">
            <h2 className="text-xl font-black text-slate-800 mb-2">Vérificateur Public Cryptographique</h2>
            <p className="text-slate-500 text-sm mb-6">Saisissez le Hash du document ou l'ID de Transaction pour vérifier l'authenticité d'un diplôme ENCG.</p>
            
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={verifyQuery}
                  onChange={(e) => setVerifyQuery(e.target.value)}
                  placeholder="Ex: 0x8f2a... ou tx_..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>
              <button 
                onClick={handleVerify}
                disabled={verifyMutation.isPending || !verifyQuery}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {verifyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Vérifier'}
              </button>
            </div>
            
            {/* Results */}
            {verificationResult && (
              <div className="mt-6 animate-in fade-in slide-in-from-top-2">
                {verificationResult.success ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-emerald-900 text-base">Diplôme Authentique</h4>
                      <p className="text-sm text-emerald-700 mt-1 mb-2">
                        Ce certificat a été vérifié cryptographiquement. Aucune falsification n'a été détectée.
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-emerald-100 text-xs text-slate-600 space-y-1 font-medium">
                        <div><span className="text-slate-400">Titulaire:</span> <span className="text-slate-800 font-bold">{verificationResult.data.student}</span></div>
                        <div><span className="text-slate-400">Diplôme:</span> <span className="text-slate-800">{verificationResult.data.degree}</span></div>
                        <div><span className="text-slate-400">Date d'ancrage:</span> <span className="text-slate-800">{verificationResult.data.certified_at}</span></div>
                        <div className="pt-1 mt-1 border-t border-emerald-50 flex flex-wrap gap-1 items-center">
                          <span className="text-slate-400">Hash:</span> 
                          <span className="text-emerald-600 font-mono text-[10px] break-all">{verificationResult.data.hash}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-4">
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-rose-900 text-sm">Document Non Reconnu</h4>
                      <p className="text-xs text-rose-700 mt-1">
                        {verificationResult.message} L'empreinte ne correspond à aucun document officiel délivré par l'ENCG.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-800">Registre des Émissions (Blockchain Ledger)</h2>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
            Synchronisation avec le registre...
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            Aucun diplôme n'a été certifié pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Titulaire</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Diplôme</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date d'Ancrage</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Hash de Transaction</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Statut</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert: any) => (
                  <tr key={cert.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{cert.student_name}</td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{cert.degree}</td>
                    <td className="p-4 text-sm text-slate-500">{cert.date}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => {
                        navigator.clipboard.writeText(cert.hash);
                        toast.success('Hash copié dans le presse-papier');
                      }}>
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-1.5 rounded text-slate-600 w-32 truncate" title={cert.hash}>
                          {cert.hash}
                        </span>
                        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-200 flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" /> {cert.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
