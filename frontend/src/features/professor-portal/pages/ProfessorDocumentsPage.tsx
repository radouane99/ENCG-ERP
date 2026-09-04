import React, { useState, useEffect } from 'react';
import { 
  FileText, PlaneTakeoff, Coins, CalendarClock, Download, Sparkles, 
  Plus, CheckCircle2, Clock, X, ShieldCheck, 
  ChevronRight, Send, Loader2, Stamp, Award, AlertCircle, GraduationCap
} from 'lucide-react';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@shared/lib/utils';

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
  status: 'ready' | 'pending' | 'rejected' | 'approved';
  department_visa?: 'pending' | 'favorable' | 'unfavorable';
  direction_decision?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  pdf_url: string;
  signer: string;
  download_ready: boolean;
  digital_seal?: string;
  mission_category?: string;
  expense_coverage?: string;
}

export default function ProfessorDocumentsPage() {
  const { user, hasRole } = useAuthStore();
  const u = user as any;
  const currentProfName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || '' : '';

  const [availableTypes, setAvailableTypes] = useState<DocumentType[]>([]);
  const [history, setHistory] = useState<DocumentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isVacataire, setIsVacataire] = useState<boolean>(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('ordre_de_mission');
  const [purpose, setPurpose] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transportMode, setTransportMode] = useState<'voiture_personnelle' | 'train' | 'avion' | 'autre'>('voiture_personnelle');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [missionCategory, setMissionCategory] = useState('colloque_international');
  const [expenseCoverage, setExpenseCoverage] = useState('charge_ecole');

  const fetchDocumentsData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/professor-portal/documents');
      if (res.data?.data) {
        setAvailableTypes(res.data.data.available_types || []);
        setHistory(res.data.data.requests_history || []);
        setIsVacataire(Boolean(res.data.data.is_vacataire) || hasRole('vacataire'));
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentsData(false);
    const interval = setInterval(() => {
      fetchDocumentsData(true);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenRequestModal = (typeId?: string) => {
    const defaultType = typeId || availableTypes[0]?.id || (isVacataire ? 'attestation_vacation' : 'attestation_travail');
    setSelectedType(defaultType);
    setPurpose('');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setTransportMode('voiture_personnelle');
    setVehicleRegistration('');
    setMissionCategory('colloque_international');
    setExpenseCoverage('charge_ecole');
    setShowModal(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose) {
      toast.error('Veuillez renseigner le motif de votre demande.');
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      toast.error('La date de fin ne peut pas être antérieure à la date de début.');
      return;
    }

    if (selectedType === 'ordre_de_mission' && transportMode === 'voiture_personnelle') {
      if (!vehicleRegistration.trim()) {
        toast.error('Veuillez renseigner l\'immatriculation de votre véhicule personnel.');
        return;
      }
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
        vehicle_registration: selectedType === 'ordre_de_mission' ? vehicleRegistration : null,
        mission_category: selectedType === 'ordre_de_mission' ? missionCategory : null,
        expense_coverage: selectedType === 'ordre_de_mission' ? expenseCoverage : null,
      });

      if (res.data?.data) {
        setHistory(prev => [res.data.data, ...prev]);
      }

      toast.success("✅ Demande transmise avec succès au Parapheur Électronique !", {
        description: "Votre dossier a été soumis au Chef de Département pour visa préalable."
      });
      setShowModal(false);
      setPurpose('');
      setDestination('');
      setVehicleRegistration('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de la soumission de la demande.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = (req: DocumentRequestItem) => {
    const url = `/api/professor-portal/documents/${req.id}/pdf`;
    openAuthenticatedUrl(url);
    toast.success(`📄 Téléchargement de l'${req.type_label} PDF Officiel !`);
  };

  const renderIcon = (typeId: string) => {
    switch (typeId) {
      case 'ordre_de_mission':
        return <PlaneTakeoff className="w-6 h-6 text-purple-500" />;
      case 'attestation_vacation':
        return <Award className="w-6 h-6 text-amber-500" />;
      case 'bordereau_decompte_vacation':
        return <Coins className="w-6 h-6 text-emerald-500" />;
      case 'attestation_salaire':
        return <Coins className="w-6 h-6 text-amber-500" />;
      case 'autorisation_absence':
        return <CalendarClock className="w-6 h-6 text-teal-500" />;
      case 'attestation_service_fait':
        return <ShieldCheck className="w-6 h-6 text-emerald-500" />;
      default:
        return <FileText className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1700px] mx-auto font-sans animate-in fade-in pb-28">
      
      {/* Role Detection Header Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 pl-2">
          <GraduationCap className="w-4 h-4 text-[#001A4B] dark:text-blue-400" />
          <span>Statut Enseignant Détecté :</span>
          <span className={cn(
            "px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider",
            isVacataire 
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60" 
              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300/60"
          )}>
            {isVacataire ? "Enseignant Vacataire (Contrat de Vacation)" : "Professeur Permanent (Statutaire MESRSFC)"}
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-400 pr-2">
          Guichet Numérique des Attestations ENCG Fès
        </span>
      </div>

      {/* Hero Header Banner */}
      <div className={cn(
        "rounded-3xl p-8 text-white shadow-xl border flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden",
        isVacataire
          ? "bg-gradient-to-r from-slate-950 via-slate-900 to-[#1e1b4b] border-amber-500/30"
          : "bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] border-indigo-900/60"
      )}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0",
            isVacataire 
              ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/30 text-slate-950 font-black" 
              : "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/30 text-white font-black"
          )}>
            <Stamp className="w-7 h-7" />
          </div>
          <div>
            <span className={cn(
              "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1 border",
              isVacataire 
                ? "bg-amber-500/20 text-amber-300 border-amber-400/30" 
                : "bg-indigo-500/20 text-indigo-200 border border-indigo-400/30"
            )}>
              <Sparkles className="w-3 h-3 text-amber-400" /> Parapheur Électronique & Guichet RH
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {isVacataire 
                ? "Attestations de Vacation & Décomptes d'Indemnités" 
                : "Demandes de Documents & Ordres de Mission"}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Circuit des visas à 3 niveaux : Chef de Département ➔ Direction / SG ➔ Scellement SHA-256 avec QR Code.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => handleOpenRequestModal(isVacataire ? 'attestation_vacation' : 'attestation_travail')}
            className={cn(
              "px-5 py-3 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center gap-2",
              isVacataire
                ? "bg-amber-400 hover:bg-amber-300 text-[#001A4B] shadow-amber-400/20"
                : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20"
            )}
          >
            <Plus className="w-4 h-4" /> 
            {isVacataire ? "Demander Attestation de Vacation" : "Demander Attestation de Travail"}
          </button>
          <button
            onClick={() => handleOpenRequestModal('ordre_de_mission')}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-white/20 cursor-pointer flex items-center gap-2"
          >
            <PlaneTakeoff className="w-4 h-4" /> Ordre de Mission
          </button>
        </div>
      </div>

      {/* Regulatory Context Banner for Vacataires */}
      {isVacataire && (
        <div className="p-5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-3xl flex items-start gap-4 text-xs animate-in fade-in">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-sm text-amber-900 dark:text-amber-200">
              Réglementation Académique MESRSFC — Spécificité Enseignant Vacataire
            </h3>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
              Conformément à la réglementation universitaire en vigueur, les enseignants vacataires accomplissant des prestations d'enseignement à la vacation bénéficient d'<strong>Attestations d'Heures de Vacation</strong> certifiant les modules et volumes horaires effectués, ainsi que de <strong>Bordereaux de Vacation pour Paiement</strong>. L'Attestation de Travail statutaire et l'Attestation de Salaire de la Fonction Publique sont légalement réservées aux professeurs titulaires / permanents d'État.
            </p>
          </div>
        </div>
      )}

      {/* Catalog of Available Documents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> 
            {isVacataire ? "Catalogue des Documents Dédiés aux Vacataires" : "Catalogue des Demandes Administratives Statutaires"}
          </h2>
          <span className="text-xs font-bold text-slate-400">Workflow officiel conforme Loi 53-05</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableTypes.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => handleOpenRequestModal(doc.id)}
              className="p-6 bg-card border border-border hover:border-indigo-400 rounded-3xl shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 group-hover:bg-[#0f2863] flex items-center justify-center transition-colors shadow-sm">
                    {renderIcon(doc.id)}
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    3 Niveaux
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-foreground group-hover:text-indigo-600 transition-colors">
                    {doc.title}
                  </h3>
                  <span className="text-xs font-bold text-muted-foreground block mt-0.5">
                    {doc.title_ar}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>{doc.processing_time}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History & 3-Tier Workflow Tracking */}
      <div className="bg-card border border-border rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              Suivi en Temps Réel du Parapheur & Documents Prêts ({history.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            Dossier de : <strong className="text-foreground">{currentProfName}</strong>
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-foreground">Aucune demande enregistrée</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Sélectionnez un document dans le catalogue ci-dessus pour initialiser une demande dans le Parapheur Électronique.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((req) => {
              const isReady = req.status === 'ready' || req.status === 'approved' || req.download_ready;
              const isRejected = req.status === 'rejected';
              
              return (
                <div 
                  key={req.id} 
                  className="p-5 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-indigo-200 transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 mt-0.5">
                        {renderIcon(req.type_id)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-muted-foreground">{req.tracking_code}</span>
                          <span className="font-extrabold text-foreground text-sm">{req.type_label}</span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isReady ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            isRejected ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {isReady ? 'Approuvé & Prêt' : isRejected ? 'Rejeté' : 'En cours de validation'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          Motif : {req.purpose} {req.destination && `• Destination : ${req.destination}`} {req.dates && `• ${req.dates}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {req.created_at}
                      </span>
                      {isReady ? (
                        <button
                          onClick={() => handleDownloadPdf(req)}
                          className="px-4 py-2 bg-[#001A4B] hover:bg-[#082663] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" /> Télécharger PDF
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200/50">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> En attente de signature
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3-Tier Step Tracker */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/40">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        ✓
                      </div>
                      <div>
                        <div className="font-bold text-foreground">1. Dépôt Initial</div>
                        <div className="text-[10px] text-muted-foreground">Transmis par l'Enseignant</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/40">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isReady || req.department_visa === 'favorable' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                      }`}>
                        {isReady || req.department_visa === 'favorable' ? '✓' : '2'}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">2. Visa Chef de Département</div>
                        <div className="text-[10px] text-muted-foreground">
                          {isReady || req.department_visa === 'favorable' ? 'Avis Favorable Accordé' : 'En cours d\'instruction'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/40">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isReady ? 'bg-blue-600 text-white' : isRejected ? 'bg-rose-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {isReady ? '✓' : isRejected ? '✕' : '3'}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">3. Signature Direction &amp; QR</div>
                        <div className="text-[10px] text-muted-foreground">
                          {isReady ? 'Scellé & Prêt au Téléchargement' : isRejected ? 'Non validé' : 'En attente Direction'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nouvelle Demande */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-border animate-in zoom-in-95 space-y-6">
            
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] p-6 text-white relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                <Stamp className="w-3.5 h-3.5 text-amber-400" /> Parapheur Électronique ENCG Fès
              </span>
              <h3 className="font-black text-2xl tracking-tight">Nouvelle Demande Administrative</h3>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Votre dossier sera instruit par le Chef de Département puis scellé électroniquement par la Direction.
              </p>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 md:p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Type de Document {isVacataire && <span className="text-amber-500">(Documents autorisés pour Vacataire)</span>}
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {availableTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.title_ar})
                    </option>
                  ))}
                </select>
              </div>

              {selectedType === 'ordre_de_mission' && (
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Catégorie de la Mission *
                  </label>
                  <select
                    value={missionCategory}
                    onChange={(e) => setMissionCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="colloque_international">Colloque / Congrès Scientifique International</option>
                    <option value="seminaire_national">Séminaire de Recherche / Journée d'Études Nationale</option>
                    <option value="jury_these">Participation à un Jury de Thèse / Habilitation (HDR)</option>
                    <option value="visite_entreprise">Visite d'Entreprise &amp; Encadrement PFE / Stages</option>
                    <option value="reunion_pedagogique">Réunion Pédagogique Inter-Universitaire</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Motif / Justification Détaillée *</label>
                <textarea
                  rows={3}
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={
                    selectedType === 'attestation_vacation'
                      ? "Ex : Démarches administratives, dossier de candidature, justificatif auprès d'un établissement partenaire..."
                      : selectedType === 'bordereau_decompte_vacation'
                      ? "Ex : Présentation comptable, décompte d'honoraires pour le semestre en cours..."
                      : "Ex : Présentation d'une communication scientifique sur la gouvernance financière / Jury de thèse de doctorat..."
                  }
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {selectedType === 'ordre_de_mission' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Lieu / Ville de Destination *</label>
                    <input
                      type="text"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Ex : Casablanca / Rabat / Tanger / Paris..."
                      className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Date de Début *</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Date de Fin *</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Moyen de Transport *
                      </label>
                      <select
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value as any)}
                        className="w-full px-4 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="voiture_personnelle">🚗 Voiture Personnelle</option>
                        <option value="train">🚆 Train ONCF (Al Boraq / Al Atlas)</option>
                        <option value="avion">✈️ Transport Aérien (Avion)</option>
                        <option value="autre">🚌 Transport Public / Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Prise en Charge des Frais
                      </label>
                      <select
                        value={expenseCoverage}
                        onChange={(e) => setExpenseCoverage(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="charge_ecole">Budget ENCG Fès (Décret 2-97-511)</option>
                        <option value="charge_organisme_accueil">Organisme / Université d'Accueil</option>
                        <option value="sans_frais">Sans Incidence Financière</option>
                      </select>
                    </div>
                  </div>

                  {transportMode === 'voiture_personnelle' && (
                    <div className="animate-in fade-in zoom-in-95">
                      <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2">
                        Immatriculation du Véhicule Personnel *
                      </label>
                      <input
                        type="text"
                        required
                        value={vehicleRegistration}
                        onChange={(e) => setVehicleRegistration(e.target.value)}
                        placeholder="Ex : 12345-A-15 ou 67890 | B | 26"
                        className="w-full px-4 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-mono font-bold text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-muted-foreground hover:bg-muted rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Transmettre au Parapheur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
