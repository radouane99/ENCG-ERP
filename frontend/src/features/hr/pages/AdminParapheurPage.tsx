import React, { useState, useEffect } from 'react';
import { 
  FileSignature, 
  Stamp, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Search, 
  Eye, 
  Send, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  CheckSquare, 
  Square, 
  Loader2,
  FileText,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';

interface ParapheurItem {
  id: number;
  user_id: number;
  professor_id?: number;
  department_id?: number;
  document_type: string;
  tracking_code: string;
  purpose: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  transport_mode?: string;
  vehicle_registration?: string;
  expense_coverage?: string;
  mission_category?: string;
  status: 'pending' | 'ready' | 'approved' | 'rejected';
  department_visa: 'pending' | 'favorable' | 'unfavorable';
  department_visa_at?: string;
  department_notes?: string;
  direction_decision: 'pending' | 'approved' | 'rejected';
  direction_signed_by?: string;
  direction_signed_at?: string;
  direction_notes?: string;
  signed_by?: string;
  signed_at?: string;
  digital_seal?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
  department?: {
    id: number;
    name: string;
    code?: string;
  };
  department_visa_user?: {
    id: number;
    name: string;
  };
}

interface Counters {
  pending_dept: number;
  pending_direction: number;
  approved_ready: number;
  rejected: number;
  total_this_month: number;
  total: number;
}

export default function AdminParapheurPage() {
  const [items, setItems] = useState<ParapheurItem[]>([]);
  const [counters, setCounters] = useState<Counters>({
    pending_dept: 0,
    pending_direction: 0,
    approved_ready: 0,
    rejected: 0,
    total_this_month: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  
  // Selection for Batch Sign
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Drawer / Modal states
  const [activeItem, setActiveItem] = useState<ParapheurItem | null>(null);
  const [showVisaModal, setShowVisaModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [visaType, setVisaType] = useState<'favorable' | 'unfavorable'>('favorable');
  const [visaNotes, setVisaNotes] = useState('');
  const [directionDecision, setDirectionDecision] = useState<'approved' | 'rejected'>('approved');
  const [directionNotes, setDirectionNotes] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('LE DIRECTEUR DE L\'ENCG FÈS');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchParapheurData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [listRes, countRes] = await Promise.all([
        api.get('/parapheur/inbox', {
          params: {
            stage: activeStage !== 'all' ? activeStage : undefined,
            document_type: selectedDocType !== 'all' ? selectedDocType : undefined,
            search: searchTerm || undefined,
          },
        }),
        api.get('/parapheur/counters'),
      ]);

      if (listRes.data?.success) {
        setItems(listRes.data.data || []);
      }
      if (countRes.data?.success) {
        setCounters(countRes.data.data);
      }
    } catch (err: any) {
      console.error('Erreur chargement Parapheur:', err);
      toast.error('Impossible de charger les données du parapheur.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchParapheurData(false);
  }, [activeStage, selectedDocType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParapheurData(false);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleOpenVisaModal = (item: ParapheurItem) => {
    setActiveItem(item);
    setVisaType('favorable');
    setVisaNotes('');
    setShowVisaModal(true);
  };

  const handleOpenSignModal = (item: ParapheurItem) => {
    setActiveItem(item);
    setDirectionDecision('approved');
    setDirectionNotes('');
    setSignatoryTitle('LE DIRECTEUR DE L\'ENCG FÈS');
    setShowSignModal(true);
  };

  const handleSubmitVisa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    try {
      setProcessingAction(true);
      const res = await api.post(`/parapheur/${activeItem.id}/department-visa`, {
        visa: visaType,
        notes: visaNotes || null,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Visa enregistré avec succès !');
        setShowVisaModal(false);
        fetchParapheurData(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement du visa.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSubmitSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    try {
      setProcessingAction(true);
      const res = await api.post(`/parapheur/${activeItem.id}/direction-sign`, {
        decision: directionDecision,
        notes: directionNotes || null,
        signatory_title: signatoryTitle,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Décision et signature scellées !');
        setShowSignModal(false);
        fetchParapheurData(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la signature.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBatchSign = async () => {
    if (selectedIds.length === 0) {
      toast.error('Veuillez sélectionner au moins un dossier à signer.');
      return;
    }

    try {
      setProcessingAction(true);
      const res = await api.post('/parapheur/batch-sign', {
        request_ids: selectedIds,
        signatory_title: 'LE DIRECTEUR DE L\'ENCG FÈS',
      });

      if (res.data?.success) {
        toast.success(`Signature groupée réussie pour ${res.data.signed_count} dossier(s) !`);
        setSelectedIds([]);
        fetchParapheurData(true);
      }
    } catch  {
      toast.error('Erreur lors de la signature par lot.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePreviewPdf = (id: number) => {
    openAuthenticatedUrl(`/parapheur/${id}/preview-pdf`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs tracking-wider uppercase">
            <Stamp className="w-4 h-4" />
            Parapheur Électronique & Direction
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-3">
            Circuit des Visas & Ordres de Mission
            <span className="bg-amber-400/20 text-amber-300 text-xs px-2.5 py-1 rounded-full border border-amber-400/30">
              Workflow à 3 Niveaux
            </span>
          </h1>
          <p className="text-blue-200/80 text-sm mt-1">
            Validation hiérarchique, signature électronique certifiée SHA-256 et scellement d'ordres de mission.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchParapheurData(false)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition flex items-center gap-2 backdrop-blur-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchSign}
              disabled={processingAction}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Signer le Lot ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* KPI Synoptic Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveStage('pending_dept')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            activeStage === 'pending_dept'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
              : 'bg-card border-border hover:border-amber-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              1. Visa Chef Dept
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-foreground">
            {counters.pending_dept}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Demandes en attente d'avis de département
          </div>
        </div>

        <div 
          onClick={() => setActiveStage('pending_direction')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            activeStage === 'pending_direction'
              ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-card border-border hover:border-blue-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              2. Signature Direction
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileSignature className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-foreground">
            {counters.pending_direction}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Visas favorables prêts pour signature finale
          </div>
        </div>

        <div 
          onClick={() => setActiveStage('approved')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            activeStage === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-card border-border hover:border-emerald-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              3. Scellés & Prêts
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-foreground">
            {counters.approved_ready}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Ordres de mission certifiés & téléchargeables
          </div>
        </div>

        <div 
          onClick={() => setActiveStage('rejected')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            activeStage === 'rejected'
              ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
              : 'bg-card border-border hover:border-rose-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Dossiers Rejetés
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-foreground">
            {counters.rejected}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Avis défavorables ou refus motivés
          </div>
        </div>
      </div>

      {/* Control Filters & Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Stage Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1.5 rounded-xl text-xs font-semibold w-full md:w-auto">
          <button
            onClick={() => setActiveStage('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeStage === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tous ({counters.total})
          </button>
          <button
            onClick={() => setActiveStage('pending_dept')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeStage === 'pending_dept' ? 'bg-background text-amber-600 font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Attente Dept ({counters.pending_dept})
          </button>
          <button
            onClick={() => setActiveStage('pending_direction')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeStage === 'pending_direction' ? 'bg-background text-blue-600 font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Attente Direction ({counters.pending_direction})
          </button>
          <button
            onClick={() => setActiveStage('approved')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeStage === 'approved' ? 'bg-background text-emerald-600 font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Validés ({counters.approved_ready})
          </button>
          <button
            onClick={() => setActiveStage('rejected')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeStage === 'rejected' ? 'bg-background text-rose-600 font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Refusés ({counters.rejected})
          </button>
        </div>

        {/* Search & Type Select */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Tous les types</option>
            <option value="ordre_de_mission">Ordre de Mission</option>
            <option value="attestation_travail">Attestation de Travail</option>
            <option value="attestation_salaire">Attestation de Salaire</option>
            <option value="autorisation_absence">Autorisation d'Absence</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Réf, Enseignant, Ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Chargement du parapheur...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Aucune demande dans cette vue</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Toutes les demandes de cette catégorie ont été traitées ou aucun dossier ne correspond à vos filtres.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center">
                    <button onClick={handleSelectAll} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.length === items.length && items.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Référence & Document</th>
                  <th className="px-4 py-3.5">Enseignant & Département</th>
                  <th className="px-4 py-3.5">Mission / Motif & Période</th>
                  <th className="px-4 py-3.5 text-center">Visa Département</th>
                  <th className="px-4 py-3.5 text-center">Décision Direction</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-muted/30 transition ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <button onClick={() => toggleSelectItem(item.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground/60" />
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono font-black text-xs text-primary">
                          {item.tracking_code}
                        </div>
                        <div className="font-semibold text-xs text-foreground mt-0.5 flex items-center gap-1.5">
                          {item.document_type === 'ordre_de_mission' ? (
                            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <MapPin className="w-3 h-3" /> Ordre de Mission
                            </span>
                          ) : (
                            <span className="capitalize">{item.document_type.replace(/_/g, ' ')}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-xs text-foreground">
                          {item.user?.name || 'Enseignant Chercheur'}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {item.department?.name || 'Département Sciences de Gestion'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-medium text-xs text-foreground truncate" title={item.purpose}>
                          {item.purpose}
                        </div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-2">
                          {item.destination && (
                            <span className="font-semibold">📍 {item.destination}</span>
                          )}
                          {item.start_date && (
                            <span>🗓️ {new Date(item.start_date).toLocaleDateString('fr-FR')}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {item.department_visa === 'favorable' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Favorable
                          </span>
                        ) : item.department_visa === 'unfavorable' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                            <XCircle className="w-3 h-3" /> Défavorable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                            <Clock className="w-3 h-3" /> En attente
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {item.direction_decision === 'approved' || item.status === 'ready' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300">
                            <ShieldCheck className="w-3 h-3" /> Scellé (SHA-256)
                          </span>
                        ) : item.direction_decision === 'rejected' || item.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                            <XCircle className="w-3 h-3" /> Refusé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">
                            <Clock className="w-3 h-3" /> À signer
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Visa Chef Dept Action */}
                          {item.department_visa === 'pending' && item.status !== 'rejected' && (
                            <button
                              onClick={() => handleOpenVisaModal(item)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 transition"
                            >
                              Visa Dept
                            </button>
                          )}

                          {/* Signature Direction Action */}
                          {item.department_visa === 'favorable' && item.status !== 'ready' && item.status !== 'rejected' && (
                            <button
                              onClick={() => handleOpenSignModal(item)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
                            >
                              Signer
                            </button>
                          )}

                          {/* PDF Preview / Download */}
                          <button
                            onClick={() => handlePreviewPdf(item.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="Aperçu PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Visa Chef de Département */}
      {showVisaModal && activeItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Avis du Chef de Département</h3>
                  <p className="text-xs text-muted-foreground">Réf: {activeItem.tracking_code}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVisaModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-muted/40 p-3.5 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-foreground">
                Enseignant : {activeItem.user?.name}
              </div>
              <div className="text-muted-foreground">
                Objet : {activeItem.purpose}
              </div>
              {activeItem.destination && (
                <div className="text-muted-foreground">
                  Destination : {activeItem.destination} ({activeItem.start_date} au {activeItem.end_date})
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitVisa} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">
                  Décision d'Avis Départemental :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label 
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      visaType === 'favorable'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visaType"
                      value="favorable"
                      checked={visaType === 'favorable'}
                      onChange={() => setVisaType('favorable')}
                      className="hidden"
                    />
                    <CheckCircle2 className="w-4 h-4" />
                    Avis Favorable
                  </label>

                  <label 
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      visaType === 'unfavorable'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visaType"
                      value="unfavorable"
                      checked={visaType === 'unfavorable'}
                      onChange={() => setVisaType('unfavorable')}
                      className="hidden"
                    />
                    <XCircle className="w-4 h-4" />
                    Avis Défavorable
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Observations / Remarques (Optionnel) :
                </label>
                <textarea
                  value={visaNotes}
                  onChange={(e) => setVisaNotes(e.target.value)}
                  placeholder="Mentionnez d'éventuelles conditions ou justification..."
                  rows={3}
                  className="w-full text-xs p-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVisaModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-input hover:bg-muted transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition flex items-center gap-2"
                >
                  {processingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Valider le Visa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Signature Direction / SG */}
      {showSignModal && activeItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Signature Numérique & Scellement</h3>
                  <p className="text-xs text-muted-foreground">Réf: {activeItem.tracking_code}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSignModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-muted/40 p-3.5 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-foreground">
                Bénéficiaire : {activeItem.user?.name}
              </div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Visa Département : Favorable
              </div>
              <div className="text-muted-foreground">
                Objet : {activeItem.purpose}
              </div>
            </div>

            <form onSubmit={handleSubmitSign} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">
                  Décision Finale de la Direction :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label 
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      directionDecision === 'approved'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="directionDecision"
                      value="approved"
                      checked={directionDecision === 'approved'}
                      onChange={() => setDirectionDecision('approved')}
                      className="hidden"
                    />
                    <ShieldCheck className="w-4 h-4" />
                    Approuver & Sceller
                  </label>

                  <label 
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      directionDecision === 'rejected'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="directionDecision"
                      value="rejected"
                      checked={directionDecision === 'rejected'}
                      onChange={() => setDirectionDecision('rejected')}
                      className="hidden"
                    />
                    <XCircle className="w-4 h-4" />
                    Rejeter
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Qualité / Titulature du Signataire :
                </label>
                <select
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                >
                  <option value="LE DIRECTEUR DE L'ENCG FÈS">LE DIRECTEUR DE L'ENCG FÈS</option>
                  <option value="LE SECRÉTAIRE GÉNÉRAL DE L'ENCG FÈS">LE SECRÉTAIRE GÉNÉRAL DE L'ENCG FÈS</option>
                  <option value="LE DIRECTEUR ADJOINT">LE DIRECTEUR ADJOINT</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Motif ou Note de Clôture (Optionnel) :
                </label>
                <textarea
                  value={directionNotes}
                  onChange={(e) => setDirectionNotes(e.target.value)}
                  placeholder="Notes de notification..."
                  rows={2}
                  className="w-full text-xs p-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-input hover:bg-muted transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition flex items-center gap-2 shadow-lg"
                >
                  {processingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Confirmer le Scellement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
