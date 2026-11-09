import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  PlaneTakeoff,
  Coins,
  CalendarClock,
  Download,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  X,
  ShieldCheck,
  ChevronRight,
  Send,
  Loader2,
  Stamp,
  Award,
  AlertCircle,
  GraduationCap,
  Building2,
  CreditCard,
  Copy,
  Check,
  QrCode,
  Search,
  Filter,
  ArrowRight,
  FileCheck2,
  HelpCircle,
  Shield,
  Car,
  Train,
  Plane,
  Bus,
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

interface AdministrativeDossier {
  is_vacataire: boolean;
  is_complete: boolean;
  status_label: string;
  rib_status: string;
  rib_number: string;
  bank_name: string;
  employer_authorization: string;
  diploma_status: string;
  cin_status: string;
  last_verified_at: string;
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
  const [administrativeDossier, setAdministrativeDossier] = useState<AdministrativeDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isVacataire, setIsVacataire] = useState<boolean>(false);
  const [copiedRib, setCopiedRib] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'pending' | 'rejected'>('all');

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

  const fetchDocumentsData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/professor-portal/documents');
      if (res.data?.data) {
        setAvailableTypes(res.data.data.available_types || []);
        setHistory(res.data.data.requests_history || []);
        setIsVacataire(Boolean(res.data.data.is_vacataire) || hasRole('vacataire'));
        if (res.data.data.administrative_dossier) {
          setAdministrativeDossier(res.data.data.administrative_dossier);
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => {
    fetchDocumentsData(false);
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        fetchDocumentsData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDocumentsData]);

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
    if (!purpose.trim()) {
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
        purpose: purpose.trim(),
        destination: selectedType === 'ordre_de_mission' ? destination.trim() : null,
        start_date: startDate || null,
        end_date: endDate || null,
        transport_mode: selectedType === 'ordre_de_mission' ? transportMode : null,
        vehicle_registration: selectedType === 'ordre_de_mission' ? vehicleRegistration.trim() : null,
        mission_category: selectedType === 'ordre_de_mission' ? missionCategory : null,
        expense_coverage: selectedType === 'ordre_de_mission' ? expenseCoverage : null,
      });

      if (res.data?.data) {
        setHistory(prev => [res.data.data, ...prev]);
      }

      toast.success("Demande transmise avec succès au Parapheur Électronique !", {
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
    toast.success(`Téléchargement de l'${req.type_label} PDF Officiel !`);
  };

  const handleDownloadContract = () => {
    const url = '/api/professor-portal/vacation-contract/pdf';
    openAuthenticatedUrl(url);
    toast.success("Téléchargement du Contrat Officiel de Vacation (PDF) !");
  };

  const copyRib = (rib: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(rib.replace(/\s+/g, ''));
      setCopiedRib(true);
      toast.success('RIB copié dans le presse-papier');
      setTimeout(() => setCopiedRib(false), 2000);
    }
  };

  // Thematic card styles for documents
  const getDocumentCardStyle = (typeId: string) => {
    switch (typeId) {
      case 'attestation_travail':
        return {
          bgBadge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-[#1a3673] group-hover:text-white',
          hoverBorder: 'hover:border-[#1a3673]/60',
          accent: 'text-blue-600 dark:text-blue-400',
        };
      case 'ordre_de_mission':
        return {
          bgBadge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
          hoverBorder: 'hover:border-purple-400',
          accent: 'text-purple-600 dark:text-purple-400',
        };
      case 'attestation_salaire':
        return {
          bgBadge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
          hoverBorder: 'hover:border-emerald-400',
          accent: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'autorisation_absence':
        return {
          bgBadge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
          hoverBorder: 'hover:border-amber-400',
          accent: 'text-amber-600 dark:text-amber-400',
        };
      case 'attestation_service_fait':
        return {
          bgBadge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
          iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white',
          hoverBorder: 'hover:border-teal-400',
          accent: 'text-teal-600 dark:text-teal-400',
        };
      case 'attestation_vacation':
        return {
          bgBadge: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700',
          iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
          hoverBorder: 'hover:border-amber-400',
          accent: 'text-amber-600 dark:text-amber-400',
        };
      case 'bordereau_decompte_vacation':
        return {
          bgBadge: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
          iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
          hoverBorder: 'hover:border-emerald-400',
          accent: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'attestation_igr_vacation':
        return {
          bgBadge: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700',
          iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-[#1a3673] group-hover:text-white',
          hoverBorder: 'hover:border-blue-400',
          accent: 'text-blue-600 dark:text-blue-400',
        };
      default:
        return {
          bgBadge: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 group-hover:bg-[#1a3673] group-hover:text-white',
          hoverBorder: 'hover:border-slate-400',
          accent: 'text-primary',
        };
    }
  };

  const renderIcon = (typeId: string, className = "w-6 h-6") => {
    switch (typeId) {
      case 'ordre_de_mission':
        return <PlaneTakeoff className={className} />;
      case 'attestation_vacation':
        return <Award className={className} />;
      case 'bordereau_decompte_vacation':
        return <Coins className={className} />;
      case 'attestation_igr_vacation':
        return <ShieldCheck className={className} />;
      case 'attestation_salaire':
        return <Coins className={className} />;
      case 'autorisation_absence':
        return <CalendarClock className={className} />;
      case 'attestation_service_fait':
        return <ShieldCheck className={className} />;
      default:
        return <FileText className={className} />;
    }
  };

  // Filtered history
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = searchFilter === '' || 
        item.tracking_code?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.type_label?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.purpose?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.destination && item.destination.toLowerCase().includes(searchFilter.toLowerCase()));

      const isReady = item.status === 'ready' || item.status === 'approved' || item.download_ready;
      const isRejected = item.status === 'rejected';
      const isPending = !isReady && !isRejected;

      if (statusFilter === 'ready') return matchesSearch && isReady;
      if (statusFilter === 'pending') return matchesSearch && isPending;
      if (statusFilter === 'rejected') return matchesSearch && isRejected;
      return matchesSearch;
    });
  }, [history, searchFilter, statusFilter]);

  const readyCount = useMemo(() => history.filter(h => h.status === 'ready' || h.status === 'approved' || h.download_ready).length, [history]);
  const pendingCount = useMemo(() => history.filter(h => h.status === 'pending' || (!h.download_ready && h.status !== 'rejected')).length, [history]);

  return (
    <div className="space-y-7 max-w-[1720px] mx-auto font-sans animate-in fade-in pb-28">
      
      {/* 1. Official Academic Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1a3673]/10 dark:bg-blue-900/30 text-[#1a3673] dark:text-blue-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 font-medium">Espace Enseignant</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-700 dark:text-slate-200 font-bold">Statut Académique :</span>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide",
              isVacataire 
                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-800" 
                : "bg-blue-50 text-[#1a3673] dark:bg-blue-950/70 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
            )}>
              <span className={cn("w-2 h-2 rounded-full", isVacataire ? "bg-amber-500" : "bg-emerald-500")}></span>
              {isVacataire ? "Enseignant Vacataire (Contrat de Vacation MESRSFC)" : "Professeur Permanent (Statutaire MESRSFC • PPR Actif)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Shield className="w-3 h-3 text-[#1a3673] dark:text-blue-400" /> Année 2026-2027
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            Guichet Numérique des Attestations ENCG Fès
          </span>
        </div>
      </div>

      {/* 2. Executive Hero Banner */}
      <div className="rounded-2xl p-7 md:p-8 text-white shadow-xl border border-[#1a3673]/30 bg-gradient-to-r from-[#0c1f4a] via-[#162f6b] to-[#1a3673] relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Stamp className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Parapheur Électronique &amp; Guichet RH
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-blue-200 border border-white/15">
                  Loi 53-05 • Scellement SHA-256
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {isVacataire 
                  ? "Attestations d'Heures de Vacation & Décomptes d'Indemnités" 
                  : "Demandes de Documents Administratifs & Ordres de Mission"}
              </h1>
              <p className="text-xs md:text-sm text-blue-100/90 font-medium mt-1 max-w-2xl leading-relaxed">
                Circuit numérique à 3 niveaux : Visa Chef de Département ➔ Approbation Direction / SG ➔ Scellement cryptographique avec QR Code officiel vérifiable.
              </p>
            </div>
          </div>

          {/* Action Button Group */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenRequestModal(isVacataire ? 'attestation_vacation' : 'attestation_travail')}
              className="px-5 py-3 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> 
              {isVacataire ? "Demander Attestation Vacation" : "Demander Attestation de Travail"}
            </button>

            {isVacataire && (
              <button
                onClick={handleDownloadContract}
                className="px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-white/25 cursor-pointer flex items-center gap-2 shadow-sm backdrop-blur-sm active:scale-95"
                title="Télécharger votre Contrat d'Engagement de Vacation signé"
              >
                <Download className="w-4 h-4 text-amber-300" /> Contrat Vacation (PDF)
              </button>
            )}

            <button
              onClick={() => handleOpenRequestModal('ordre_de_mission')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-white/20 cursor-pointer flex items-center gap-2 shadow-sm backdrop-blur-sm active:scale-95"
            >
              <PlaneTakeoff className="w-4 h-4 text-blue-200" /> Ordre de Mission
            </button>
          </div>
        </div>
      </div>

      {/* 3. Regulatory Context Banner for Vacataires (Law 53-05 / Article 73-II-F CGI) */}
      {isVacataire && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl flex items-start gap-4 text-xs animate-in fade-in shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-md shadow-amber-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-amber-950 dark:text-amber-200">
                Réglementation Académique MESRSFC — Statut Enseignant Vacataire
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                CGI Art. 73-II-F
              </span>
            </div>
            <p className="text-amber-900/90 dark:text-amber-300/90 leading-relaxed font-medium">
              Conformément à la réglementation universitaire marocaine et au Code Général des Impôts, les enseignants vacataires accomplissant des prestations d'enseignement à la vacation bénéficient d'<strong>Attestations d'Heures de Vacation</strong>, de <strong>Bordereaux de Vacation pour Paiement</strong>, et d'<strong>Attestations Fiscales de Retenue à la Source IGR (17%)</strong>. L'Attestation de Travail et de Salaire statutaires sont réservées aux professeurs titulaires de la fonction publique.
            </p>
          </div>
        </div>
      )}

      {/* 4. Mon Dossier Administratif RH & Conformité */}
      {administrativeDossier && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 md:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-slate-800 dark:text-white">
                    Dossier Administratif RH &amp; Conformité
                  </h3>
                  {administrativeDossier.is_complete ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Dossier Conforme
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60">
                      <Clock className="w-3 h-3 text-amber-600" /> En Révision
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {administrativeDossier.status_label} • Contrôlé et vérifié le {administrativeDossier.last_verified_at}
                </p>
              </div>
            </div>

            {isVacataire && (
              <button
                onClick={handleDownloadContract}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto border border-amber-400/30"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" /> Contrat d'Engagement (PDF)
              </button>
            )}
          </div>

          {/* 4 Executive Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* RIB Bancaire */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> RIB Bancaire Paiement
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Validé
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs font-bold text-slate-800 dark:text-white tracking-wide">
                  {administrativeDossier.rib_number}
                </div>
                <button
                  type="button"
                  onClick={() => copyRib(administrativeDossier.rib_number)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                  title="Copier le RIB"
                >
                  {copiedRib ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {administrativeDossier.bank_name}
              </div>
            </div>

            {/* Autorisation Employeur */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Autorisation Employeur
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Conforme
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">
                {administrativeDossier.employer_authorization}
              </div>
              <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                Circulaire Ministérielle MESRSFC
              </div>
            </div>

            {/* Qualification & Diplôme */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Qualification &amp; Diplôme
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Certifié
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">
                {administrativeDossier.diploma_status}
              </div>
              <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                Contrôle Académique &amp; Équivalence
              </div>
            </div>

            {/* Identité & Statut Légal */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition-colors space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Identité &amp; Statut Légal
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> À Jour
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">
                {administrativeDossier.cin_status}
              </div>
              <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                Dossier Numérique RH National
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. Catalogue des Demandes Administratives (Responsive Layout) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#1a3673] dark:text-blue-400" />
              {isVacataire 
                ? "Catalogue des Documents Dédiés aux Vacataires" 
                : "Catalogue des Demandes Administratives Statutaires"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cliquez sur un document pour formuler votre demande et l'insérer dans le circuit de signature
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 self-start sm:self-auto">
            Procédure conforme Loi 53-05 sur l'échange électronique
          </span>
        </div>

        {/* Dynamic Balanced Grid: 5 columns on XL screens, 3 on LG, 2 on MD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {availableTypes.map((doc) => {
            const style = getDocumentCardStyle(doc.id);
            return (
              <div 
                key={doc.id}
                onClick={() => handleOpenRequestModal(doc.id)}
                className={cn(
                  "p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden",
                  style.hoverBorder
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm",
                      style.iconBg
                    )}>
                      {renderIcon(doc.id, "w-5 h-5")}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                      style.bgBadge
                    )}>
                      3 Niveaux
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-[#1a3673] dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {doc.title}
                    </h3>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mt-0.5">
                      {doc.title_ar}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
                  <span className={style.accent}>{doc.processing_time}</span>
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-[#1a3673] group-hover:text-white flex items-center justify-center transition-all">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Suivi en Temps Réel du Parapheur & Traçabilité */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-6 md:p-7 space-y-6">
        
        {/* Parapheur Header + Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                Suivi en Temps Réel du Parapheur &amp; Documents Prêts
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#1a3673] dark:bg-blue-950 dark:text-blue-300">
                  {history.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Dossier de : <strong className="text-slate-700 dark:text-slate-200">{currentProfName}</strong>
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all",
                  statusFilter === 'all' 
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Tous ({history.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ready')}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all",
                  statusFilter === 'ready' 
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Prêts ({readyCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all",
                  statusFilter === 'pending' 
                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                En Cours ({pendingCount})
              </button>
            </div>

            {history.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrer code, type..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary w-40"
                />
              </div>
            )}
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3673] dark:text-blue-400" />
            <span className="text-xs text-slate-400 font-medium">Chargement du parapheur électronique...</span>
          </div>
        ) : history.length === 0 ? (
          /* Refined Executive Empty State */
          <div className="p-8 md:p-12 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800/80 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 text-[#1a3673] dark:text-blue-400 shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center justify-center mx-auto">
              <FileCheck2 className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="font-bold text-base text-slate-800 dark:text-white">
                Votre Parapheur Électronique est Actuellement Vide
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Aucune demande en cours d'instruction. Sélectionnez une attestation ou un ordre de mission ci-dessus pour initialiser le circuit de visa officiel.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleOpenRequestModal(isVacataire ? 'attestation_vacation' : 'attestation_travail')}
                className="px-4 py-2.5 bg-[#1a3673] hover:bg-[#0f2454] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                {isVacataire ? "Nouvelle Demande Vacation" : "Demander Attestation de Travail"}
              </button>

              <button
                type="button"
                onClick={() => handleOpenRequestModal('ordre_de_mission')}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-2"
              >
                <PlaneTakeoff className="w-3.5 h-3.5 text-purple-500" />
                Déclarer un Ordre de Mission
              </button>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400 font-medium">
            Aucune demande ne correspond à vos critères de recherche.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((req) => {
              const isReady = req.status === 'ready' || req.status === 'approved' || req.download_ready;
              const isRejected = req.status === 'rejected';
              
              return (
                <div 
                  key={req.id} 
                  className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#1a3673] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        {renderIcon(req.type_id, "w-5 h-5")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {req.tracking_code}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-white text-sm">
                            {req.type_label}
                          </span>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                            isReady 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60" 
                              : isRejected 
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/60" 
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60"
                          )}>
                            {isReady ? 'Approuvé & Scellé QR' : isRejected ? 'Rejeté' : 'En cours d\'instruction'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          Motif : <strong className="text-slate-700 dark:text-slate-300 font-medium">{req.purpose}</strong> 
                          {req.destination && ` • Destination : ${req.destination}`} 
                          {req.dates && ` • ${req.dates}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                      <span className="text-[11px] font-medium text-slate-400">
                        {req.created_at}
                      </span>
                      {isReady ? (
                        <button
                          onClick={() => handleDownloadPdf(req)}
                          className="px-4 py-2 bg-[#1a3673] hover:bg-[#0f2454] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-300" /> Télécharger PDF
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> En attente de signature
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3-Tier Step Tracker */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    
                    {/* Step 1 */}
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                        ✓
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">1. Dépôt Initial</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Transmis par l'Enseignant</div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm",
                        isReady || req.department_visa === 'favorable' 
                          ? "bg-emerald-500 text-white" 
                          : "bg-amber-500 text-white animate-pulse"
                      )}>
                        {isReady || req.department_visa === 'favorable' ? '✓' : '2'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">2. Visa Chef de Département</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {isReady || req.department_visa === 'favorable' ? 'Avis Favorable Accordé' : 'En cours d\'instruction'}
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm",
                        isReady 
                          ? "bg-[#1a3673] text-white" 
                          : isRejected 
                          ? "bg-rose-500 text-white" 
                          : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      )}>
                        {isReady ? '✓' : isRejected ? '✕' : '3'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">3. Signature Direction &amp; QR</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
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

      {/* 7. Modal Nouvelle Demande Parapheur */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-0">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0c1f4a] via-[#162f6b] to-[#1a3673] p-6 text-white relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                <Stamp className="w-3.5 h-3.5 text-amber-300" /> Parapheur Électronique ENCG Fès
              </span>
              <h3 className="font-bold text-xl tracking-tight text-white">Nouvelle Demande Administrative</h3>
              <p className="text-xs text-blue-100 font-medium mt-1">
                Instruction par le Chef de Département puis validation Direction avec scellement SHA-256.
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitRequest} className="p-6 md:p-7 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Type de Document {isVacataire && <span className="text-amber-500">(Documents autorisés pour Vacataire)</span>}
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30 rounded-xl"
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
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Catégorie de la Mission *
                  </label>
                  <select
                    value={missionCategory}
                    onChange={(e) => setMissionCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30 rounded-xl"
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
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Motif / Justification Détaillée *
                </label>
                <textarea
                  rows={3}
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={
                    selectedType === 'attestation_vacation'
                      ? "Ex : Démarches administratives, dossier de candidature auprès d'un établissement partenaire..."
                      : selectedType === 'bordereau_decompte_vacation'
                      ? "Ex : Présentation comptable, décompte d'honoraires pour le semestre en cours..."
                      : "Ex : Présentation d'une communication scientifique sur la gouvernance financière / Jury de doctorat..."
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30 rounded-xl"
                />
              </div>

              {selectedType === 'ordre_de_mission' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Lieu / Ville de Destination *
                    </label>
                    <input
                      type="text"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Ex : Casablanca / Rabat / Tanger / Paris..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Date de Début *
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Date de Fin *
                      </label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Moyen de Transport *
                      </label>
                      <select
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value as any)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30 rounded-xl"
                      >
                        <option value="voiture_personnelle">Voiture Personnelle</option>
                        <option value="train">Train ONCF (Al Boraq / Al Atlas)</option>
                        <option value="avion">Transport Aérien (Avion)</option>
                        <option value="autre">Transport Public / Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Prise en Charge des Frais
                      </label>
                      <select
                        value={expenseCoverage}
                        onChange={(e) => setExpenseCoverage(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30 rounded-xl"
                      >
                        <option value="charge_ecole">Budget ENCG Fès (Décret 2-97-511)</option>
                        <option value="charge_organisme_accueil">Organisme / Université d'Accueil</option>
                        <option value="sans_frais">Sans Incidence Financière</option>
                      </select>
                    </div>
                  </div>

                  {transportMode === 'voiture_personnelle' && (
                    <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800 space-y-1.5">
                      <label className="block text-[10px] font-bold text-[#1a3673] dark:text-blue-300 uppercase tracking-wider">
                        Immatriculation du Véhicule Personnel *
                      </label>
                      <input
                        type="text"
                        required
                        value={vehicleRegistration}
                        onChange={(e) => setVehicleRegistration(e.target.value)}
                        placeholder="Ex : 12345-A-15 ou 67890 | B | 26"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30 rounded-lg"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#1a3673] to-[#2b59ba] hover:opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
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
