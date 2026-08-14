import React, { useState, useEffect } from 'react';
import { 
  FileText, PlaneTakeoff, Coins, CalendarClock, Download, Sparkles, 
  Plus, CheckCircle2, Clock, X, ShieldCheck, QrCode, Search, 
  ChevronRight, Building2, Send, Loader2, Stamp, Eye
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@/shared/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

interface DocumentType {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  icon: string;
  processing_time: string;
}

interface DocumentRequestItem {
  id: number;
  tracking_code: string;
  type_id: string;
  type_label: string;
  purpose: string;
  destination?: string;
  dates?: string;
  status: 'ready' | 'pending' | 'rejected';
  created_at: string;
  pdf_url: string;
  signer: string;
  download_ready: boolean;
}

export default function ProfessorDocumentsPage() {
  const { user } = useAuthStore();
  const u = user as any;
  const currentProfName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || 'Pr. Abdelhak El Amrani' : 'Pr. Abdelhak El Amrani';

  const [availableTypes, setAvailableTypes] = useState<DocumentType[]>([]);
  const [history, setHistory] = useState<DocumentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('attestation_travail');
  const [purpose, setPurpose] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transportMode, setTransportMode] = useState('Voiture Personnelle');

  const fetchDocumentsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/professor-portal/documents');
      if (res.data?.data) {
        setAvailableTypes(res.data.data.available_types || []);
        setHistory(res.data.data.requests_history || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentsData();
  }, []);

  const handleOpenRequestModal = (typeId: string) => {
    setSelectedType(typeId);
    setPurpose('');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setShowModal(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose) {
      toast.error('Veuillez renseigner le motif de votre demande.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/professor-portal/documents', {
        document_type: selectedType,
        purpose,
        destination: selectedType === 'ordre_de_mission' ? destination : null,
        start_date: startDate || null,
        end_date: endDate || null,
        transport_mode: selectedType === 'ordre_de_mission' ? transportMode : null,
      });

      if (res.data?.data) {
        setHistory(prev => [res.data.data, ...prev]);
      }

      toast.success("✅ Demande de document transmise avec succès !", {
        description: "Votre document officiel est validé et prêt au téléchargement."
      });
      setShowModal(false);
      setPurpose('');
      setDestination('');
    } catch (err) {
      toast.error('Erreur lors de la soumission de la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = (req: DocumentRequestItem) => {
    const url = `/api/professor-portal/documents/${req.id}/pdf`;
    window.open(url, '_blank');
    toast.success(`📄 Téléchargement de l'${req.type_label} PDF Officiel !`);
  };

  const renderIcon = (typeId: string) => {
    switch (typeId) {
      case 'ordre_de_mission':
        return <PlaneTakeoff className="w-6 h-6 text-purple-400" />;
      case 'attestation_salaire':
        return <Coins className="w-6 h-6 text-amber-400" />;
      case 'autorisation_absence':
        return <CalendarClock className="w-6 h-6 text-teal-400" />;
      default:
        return <FileText className="w-6 h-6 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1700px] mx-auto font-sans animate-in fade-in pb-28">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Stamp className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Guichet RH Numérique ENCG Fès
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Demandes de Documents & Ordres de Mission</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Générez instantanément vos attestations certifiées avec signature numérique et code QR anti-fraude.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => handleOpenRequestModal('attestation_travail')}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvelle Demande
          </button>
        </div>
      </div>

      {/* Catalog of Available Documents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Catalogue des Documents Disponibles en 1-Clic
          </h2>
          <span className="text-xs font-bold text-slate-400">Délivrance immédiate & conforme Loi 53-05</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {availableTypes.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => handleOpenRequestModal(doc.id)}
              className="p-6 bg-white border border-slate-200/90 hover:border-indigo-400 rounded-3xl shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-[#0f2863] flex items-center justify-center transition-colors shadow-sm">
                    {renderIcon(doc.id)}
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    Certifié RH
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {doc.title}
                  </h3>
                  <span className="text-xs font-bold text-slate-400 block mt-0.5">
                    {doc.title_ar}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>{doc.processing_time}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History & Tracking Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
              Historique de Vos Demandes & Documents Prêts ({history.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Dossier Administratif de : <strong>{currentProfName}</strong>
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs font-bold text-slate-400">Chargement de votre dossier administratif réel...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 px-6 border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-slate-800 text-base">Aucune demande enregistrée en base de données</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Vos demandes d'Attestation de Travail, Ordre de Mission ou Autorisations apparaîtront ici dès que vous soumettez une nouvelle demande.
              </p>
            </div>
            <button
              onClick={() => handleOpenRequestModal('attestation_travail')}
              className="px-6 py-2.5 bg-[#0f2863] hover:bg-[#001A4B] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Créer une première demande
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((req) => (
              <div key={req.id} className="py-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-2xl transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-black">
                    {renderIcon(req.type_id)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {req.tracking_code}
                      </span>
                      <h4 className="font-black text-sm text-slate-900">{req.type_label}</h4>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Prêt & Signé
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      <strong>Motif :</strong> {req.purpose}
                      {req.destination && <span> • <strong>Destination :</strong> {req.destination}</span>}
                      {req.dates && <span> • <strong>Période :</strong> {req.dates}</span>}
                    </p>

                    <p className="text-[11px] text-slate-400 font-medium">
                      Date de demande : {req.created_at} • Signataire officiel : <strong className="text-slate-600">{req.signer}</strong>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleDownloadPdf(req)}
                    className="px-5 py-2.5 bg-[#0f2863] hover:bg-[#001A4B] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-400" /> Télécharger PDF Certifié
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nouvelle Demande Express */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 space-y-6">
            
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] p-6 text-white relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                <Stamp className="w-3.5 h-3.5 text-amber-400" /> Guichet RH Numérique
              </span>
              <h3 className="font-black text-2xl tracking-tight">Nouvelle Demande de Document</h3>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Le document sera généré automatiquement avec le tampon officiel et la signature certifiée.
              </p>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 md:p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Type de Document</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-indigo-500"
                >
                  <option value="attestation_travail">Attestation de Travail (شهادة العمل)</option>
                  <option value="ordre_de_mission">Ordre de Mission Officiel (أمر بمهمة)</option>
                  <option value="attestation_salaire">Attestation de Salaire / Émoluments (شهادة الأجرة)</option>
                  <option value="autorisation_absence">Autorisation d'Absence / Congé (رخصة التغيب)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Motif / Justification de la Demande</label>
                <textarea
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Ex : Dépôt de dossier de Visa Scientifique / Participation au jury de thèse à l'Université Hassan II..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {selectedType === 'ordre_de_mission' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Lieu / Ville de Destination</label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Ex : Casablanca / Rabat / Tanger..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date de Début</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date de Fin</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Valider & Générer le Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
