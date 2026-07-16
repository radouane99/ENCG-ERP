import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  IdCard, Search, Filter, ShieldAlert, CheckCircle, 
  AlertTriangle, RefreshCw, Printer, FileDown, Eye, Check, X, ShieldOff
} from 'lucide-react';
import api from '@/shared/lib/api';
import { Button } from '@/shared/components/ui/Button';
import { toast } from 'sonner';
import Barcode from '../components/Barcode';
import QRCode from 'react-qr-code';

interface StudentCardItem {
  id: number | null;
  student_id: number;
  card_number: string;
  qr_token: string | null;
  status: string;
  expires_at: string | null;
  academic_year: string | null;
  photo_url: string | null;
  student: {
    id: number;
    name: string;
    email: string;
    cne: string;
    cin: string;
    filiere: string;
    group: string;
  };
  institution: {
    name: string;
  };
}

export default function AdminStudentCardsPage() {
  const queryClient = useQueryClient();
  
  // Filters & State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [filiereId, setFiliereId] = useState('all');
  const [groupId, setGroupId] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  
  // Selected cards for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]); // user ids / student ids
  const [selectedCards, setSelectedCards] = useState<StudentCardItem[]>([]);
  
  // Expiration override for bulk generation
  const [bulkExpiresAt, setBulkExpiresAt] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch filieres & groups for filters
  const { data: filieres } = useQuery({
    queryKey: ['filieres-list'],
    queryFn: () => api.get('/filieres').then(res => res.data.data)
  });

  const { data: groups } = useQuery({
    queryKey: ['groups-list'],
    queryFn: () => api.get('/groups').then(res => res.data.data)
  });

  // Fetch cards/students
  const { data: cardResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-student-cards', search, status, filiereId, groupId, page],
    queryFn: () => {
      const params: any = { page, per_page: perPage };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      if (filiereId !== 'all') params.filiere_id = filiereId;
      if (groupId !== 'all') params.group_id = groupId;
      return api.get('/student-cards', { params }).then(res => res.data);
    }
  });

  const cardsData: StudentCardItem[] = cardResponse?.data || [];
  const meta = cardResponse?.meta || { total: 0, current_page: 1, last_page: 1 };

  // Status modification mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ cardId, newStatus }: { cardId: number; newStatus: string }) => {
      return api.patch(`/student-cards/${cardId}/status`, { status: newStatus });
    },
    onSuccess: (res) => {
      toast.success('Statut de la carte mis à jour !');
      queryClient.invalidateQueries({ queryKey: ['admin-student-cards'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    }
  });

  // Bulk Generation mutation
  const bulkGenerateMutation = useMutation({
    mutationFn: (payload: { student_ids: number[]; expires_at?: string }) => {
      return api.post('/student-cards/bulk', payload);
    },
    onSuccess: (res) => {
      toast.success(res.data.message || 'Cartes générées avec succès.');
      setSelectedIds([]);
      setSelectedCards([]);
      setShowBulkModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-student-cards'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur de génération en masse.');
    }
  });

  // Checkbox management
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allStudentIds = cardsData.map(item => item.student_id);
      setSelectedIds(allStudentIds);
      setSelectedCards(cardsData);
    } else {
      setSelectedIds([]);
      setSelectedCards([]);
    }
  };

  const handleSelectRow = (item: StudentCardItem) => {
    if (selectedIds.includes(item.student_id)) {
      setSelectedIds(prev => prev.filter(id => id !== item.student_id));
      setSelectedCards(prev => prev.filter(c => c.student_id !== item.student_id));
    } else {
      setSelectedIds(prev => [...prev, item.student_id]);
      setSelectedCards(prev => [...prev, item]);
    }
  };

  // Launch browser printing
  const handlePrintSelected = () => {
    // Only print students who actually have cards generated
    const cardsToPrint = selectedCards.filter(c => c.status !== 'not_generated');
    if (cardsToPrint.length === 0) {
      toast.error('Aucune carte active ou générée dans votre sélection.');
      return;
    }
    
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  const handleBulkGenerate = () => {
    // Select student ids that don't have cards yet or whose card needs activation
    const studentIdsToGenerate = selectedCards
      .filter(c => c.status === 'not_generated')
      .map(c => c.student_id);

    if (studentIdsToGenerate.length === 0) {
      toast.error('Aucun étudiant sans carte dans la sélection.');
      return;
    }

    bulkGenerateMutation.mutate({
      student_ids: studentIdsToGenerate,
      expires_at: bulkExpiresAt || undefined
    });
  };

  // Render status badge
  const renderStatus = (item: StudentCardItem) => {
    const configs: Record<string, { label: string, classes: string }> = {
      active: { label: 'Active', classes: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' },
      suspended: { label: 'Suspendue', classes: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
      lost: { label: 'Perdue', classes: 'bg-rose-500/10 text-rose-500 border border-rose-500/20' },
      stolen: { label: 'Volée', classes: 'bg-red-500/10 text-red-500 border border-red-500/20' },
      revoked: { label: 'Révoquée', classes: 'bg-gray-500/10 text-gray-500 border border-gray-500/20' },
      expired: { label: 'Expirée', classes: 'bg-slate-500/10 text-slate-500 border border-slate-500/20' },
      not_generated: { label: 'Non Générée', classes: 'bg-muted text-muted-foreground border border-border' },
    };
    const config = configs[item.status] || configs.not_generated;
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto no-print">
      {/* Printable Area Wrapper (rendered hidden on screen, shown in print) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-cards-grid, .print-cards-grid * {
            visibility: visible;
          }
          .print-cards-grid {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <IdCard className="w-7 h-7 text-primary" />
            Gestion des Cartes Étudiants
          </h1>
          <p className="text-muted-foreground mt-1">
            Génération en masse, impression de planches PVC, et gestion du cycle de vie des cartes.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Quick stats summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <IdCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Total Étudiants</p>
            <p className="text-xl font-bold">{meta.total}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Cartes Actives</p>
            <p className="text-xl font-bold">
              {cardsData.filter(c => c.status === 'active').length}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Suspendues / Perdues</p>
            <p className="text-xl font-bold">
              {cardsData.filter(c => ['suspended', 'lost', 'stolen'].includes(c.status)).length}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
            <ShieldOff className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Non Générées</p>
            <p className="text-xl font-bold">
              {cardsData.filter(c => c.status === 'not_generated').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Rechercher par nom, email, CNE, CNI ou N° de carte..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-3 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
          />
        </div>

        {/* Filiere Filter */}
        <div className="w-full md:w-[160px]">
          <select 
            value={filiereId}
            onChange={(e) => { setFiliereId(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="all">Toutes Filières</option>
            {filieres?.map((f: any) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Group Filter */}
        <div className="w-full md:w-[160px]">
          <select 
            value={groupId}
            onChange={(e) => { setGroupId(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="all">Tous Groupes</option>
            {groups?.map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-[160px]">
          <select 
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="all">Tous Statuts</option>
            <option value="not_generated">Non Générée</option>
            <option value="active">Active</option>
            <option value="suspended">Suspendue</option>
            <option value="lost">Perdue</option>
            <option value="stolen">Volée</option>
            <option value="revoked">Révoquée</option>
            <option value="expired">Expirée</option>
          </select>
        </div>
      </div>

      {/* Floating Bulk Actions Bar (visible when checked items exist) */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom duration-250">
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-bold font-mono">
              {selectedIds.length}
            </span>
            <span className="text-sm font-semibold text-foreground">étudiant(s) sélectionné(s)</span>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Check className="w-4 h-4" /> Générer/Activer en masse
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handlePrintSelected}
              className="flex items-center gap-2 bg-card hover:bg-muted"
            >
              <Printer className="w-4 h-4" /> Imprimer la sélection
            </Button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
            <span>Chargement des données...</span>
          </div>
        ) : cardsData.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            Aucun étudiant correspondant aux critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox"
                      checked={selectedIds.length === cardsData.length}
                      onChange={handleSelectAll}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-4">Étudiant</th>
                  <th className="px-6 py-4">Filière / Groupe</th>
                  <th className="px-6 py-4">Numéro Carte</th>
                  <th className="px-6 py-4">Expiration</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cardsData.map((item) => (
                  <tr key={item.student_id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(item.student_id)}
                        onChange={() => handleSelectRow(item)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-border flex items-center justify-center shrink-0 overflow-hidden font-bold text-primary">
                          {item.photo_url ? (
                            <img src={item.photo_url} alt="Photo" className="w-full h-full object-cover" />
                          ) : (
                            item.student.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground leading-tight">{item.student.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.student.cne}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{item.student.filiere}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.student.group}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {item.card_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {item.expires_at ? (
                        new Date(item.expires_at).toLocaleDateString('fr-FR')
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {renderStatus(item)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status !== 'not_generated' ? (
                        <select 
                          value={item.status}
                          onChange={(e) => updateStatusMutation.mutate({ cardId: item.id!, newStatus: e.target.value })}
                          className="px-2 py-1 text-xs bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        >
                          <option value="active">Activer</option>
                          <option value="suspended">Suspendre</option>
                          <option value="lost">Déclarer Perdue</option>
                          <option value="stolen">Déclarer Volée</option>
                          <option value="revoked">Révoquer</option>
                          <option value="expired">Marquer Expirée</option>
                        </select>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            bulkGenerateMutation.mutate({ student_ids: [item.student_id] });
                          }}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Générer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination footer */}
        {!isLoading && meta.last_page > 1 && (
          <div className="bg-muted/10 px-6 py-4 border-t border-border flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              Page {meta.current_page} sur {meta.last_page} • Total {meta.total} étudiants
            </span>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Précédent
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === meta.last_page}
                onClick={() => setPage(p => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Admin bulk generation override modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-foreground">Génération de cartes en masse</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vous allez générer {selectedIds.length} carte(s) d'étudiant.
                </p>
              </div>
              <button 
                onClick={() => setShowBulkModal(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground">
                Date d'expiration personnalisée (Optionnel)
              </label>
              <input 
                type="date"
                value={bulkExpiresAt}
                onChange={(e) => setBulkExpiresAt(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <p className="text-[10px] text-muted-foreground">
                Laisse vide pour appliquer la date d'expiration par défaut calculée selon leur niveau d'étude.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowBulkModal(false)}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                onClick={handleBulkGenerate}
                isLoading={bulkGenerateMutation.isPending}
              >
                Générer les cartes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grid wrapper visible only during print */}
      {selectedCards.length > 0 && (
        <div className="print-cards-grid hidden print:grid print:grid-cols-2 print:gap-10 print:p-8">
          {selectedCards.filter(c => c.status !== 'not_generated').map((cardData) => {
            const verificationUrl = `${window.location.origin}/verify/card/${cardData.qr_token}`;
            
            return (
              <div 
                key={cardData.student_id}
                className="relative w-full max-w-[320px] bg-white border border-slate-300 rounded-3xl overflow-hidden p-6 space-y-6 flex flex-col justify-between shadow-sm"
                style={{ pageBreakInside: 'avoid', height: '480px' }}
              >
                {/* Header */}
                <div className="text-center pb-3 border-b border-slate-200">
                  <h2 className="text-slate-800 font-bold text-sm leading-tight uppercase tracking-wide">
                    {cardData.institution.name}
                  </h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                    Carte d'Étudiant Digitale
                  </p>
                </div>

                {/* Expiration Tag & status info */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                  <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
                    {cardData.academic_year}
                  </span>
                  <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Officiel
                  </span>
                </div>

                {/* Body info */}
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-24 bg-slate-100 rounded-xl border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden">
                    {cardData.photo_url ? (
                      <img src={cardData.photo_url} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200" />
                    )}
                  </div>
                  
                  <div className="space-y-1 pt-1 text-slate-800">
                    <p className="text-[9px] text-slate-500 font-semibold uppercase">Nom & Prénom</p>
                    <p className="text-md font-bold leading-tight">{cardData.student.name}</p>
                    <p className="text-[9px] font-mono text-slate-600 mt-1">CNE: {cardData.student.cne}</p>
                  </div>
                </div>

                <div className="space-y-2 text-slate-800 text-xs pt-1">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Filière</span>
                    <span className="font-semibold truncate block">{cardData.student.filiere}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Niveau / Groupe</span>
                    <span className="font-semibold block">{cardData.student.group}</span>
                  </div>
                </div>

                {/* Barcode & QR Code Section */}
                <div className="border-t border-dashed border-slate-300 pt-4 flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <Barcode value={cardData.card_number} height={35} className="w-[120px]" />
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-1 rounded-lg border border-slate-200">
                      <QRCode value={verificationUrl} size={65} level="H" />
                    </div>
                    <span className="text-[7px] text-slate-500 mt-0.5">Scannez pour valider</span>
                  </div>
                </div>

                {/* Bottom disclaimer */}
                <div className="text-[8px] text-slate-400 text-center border-t border-slate-100 pt-2">
                  Valable jusqu'au {cardData.expires_at ? new Date(cardData.expires_at).toLocaleDateString('fr-FR') : '—'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
