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
    if (selectedCards.length === 0) {
      toast.error('Veuillez sélectionner au moins un étudiant à imprimer.');
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
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body * {
            visibility: hidden !important;
          }
          .print-cards-grid, .print-cards-grid * {
            visibility: visible !important;
          }
          .print-cards-grid {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: white !important;
            z-index: 99999999 !important;
            display: grid !important;
            grid-template-columns: repeat(2, 86mm) !important;
            gap: 8mm !important;
            padding: 8mm !important;
            align-content: start !important;
            justify-content: start !important;
          }
        }
      `}</style>

      <div className="space-y-6 p-6 max-w-7xl mx-auto no-print">

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
      </div>

      {/* Grid wrapper visible only during print */}
      {selectedCards.length > 0 && (
        <div className="print-cards-grid hidden print:grid print:grid-cols-2 print:gap-4 print:p-2">
          {selectedCards.map((cardData) => {
            const cardNumber = cardData.card_number !== 'Non générée' && cardData.card_number
              ? cardData.card_number 
              : `ENCG-${new Date().getFullYear()}-${String(cardData.student_id).padStart(5, '0')}`;
            
            const qrToken = cardData.qr_token || `STUDENT-${cardData.student_id}-${cardData.student.cne}`;
            const verificationUrl = `${window.location.origin}/verify/card/${qrToken}`;
            const academicYear = cardData.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
            
            return (
              <div 
                key={cardData.student_id}
                className="relative bg-white border border-slate-300 rounded-[14px] overflow-hidden flex flex-col justify-between shadow-md font-sans mx-auto box-border"
                style={{ pageBreakInside: 'avoid', width: '86mm', height: '54mm' }}
              >
                {/* Top Gradient Banner Header */}
                <div className="bg-gradient-to-r from-[#0b1f4f] via-[#0f2863] to-[#1d3d82] text-white px-2.5 py-1.5 flex items-center justify-between border-b-2 border-amber-400/90 relative overflow-hidden">
                  {/* Watermark Logo Background */}
                  <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                    <img src="/logo-encg.png" alt="" className="h-16 w-auto" />
                  </div>

                  <div className="flex items-center gap-1.5 z-10">
                    <div className="bg-white p-0.5 rounded-md shadow-sm shrink-0">
                      <img src="/logo-encg.png" alt="ENCG Fès" className="h-5 w-auto object-contain" />
                    </div>
                    <div>
                      <h2 className="text-[7.5px] font-black text-amber-300 uppercase tracking-wide leading-none">
                        ÉCOLE NATIONALE DE COMMERCE ET DE GESTION
                      </h2>
                      <p className="text-[5.5px] text-slate-200 font-bold uppercase tracking-wider leading-none mt-0.5">
                        UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH — FÈS
                      </p>
                    </div>
                  </div>

                  <div className="z-10 text-right shrink-0">
                    <span className="bg-amber-400 text-[#0f2863] text-[6px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
                      {academicYear}
                    </span>
                    <p className="text-[4.5px] text-slate-300 font-extrabold uppercase mt-0.5">CARTE ÉTUDIANT</p>
                  </div>
                </div>

                {/* Main Body */}
                <div className="px-2.5 py-1 flex items-center gap-2.5 flex-1 min-h-0 bg-gradient-to-b from-slate-50/50 to-white">
                  {/* Photo Container */}
                  <div className="relative shrink-0">
                    <div className="w-[19mm] h-[23mm] bg-white rounded-lg border-2 border-[#0f2863] flex items-center justify-center overflow-hidden shadow-sm">
                      {cardData.photo_url ? (
                        <img src={cardData.photo_url} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#0f2863] text-amber-300 flex items-center justify-center font-black text-xs">
                          {cardData.student.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#0f2863] text-amber-300 text-[4.5px] font-black px-1 rounded uppercase tracking-tighter whitespace-nowrap shadow-2xs">
                      OFFICIEL
                    </span>
                  </div>

                  {/* Metadata Details */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div>
                      <span className="text-[4.5px] text-slate-400 font-extrabold uppercase tracking-wider leading-none block">Nom & Prénom / Full Name</span>
                      <h3 className="text-[9.5px] font-black text-slate-900 leading-tight truncate">{cardData.student.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[6px] font-mono font-bold text-slate-700 bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/80">
                      <span>CNE: <strong className="text-slate-900">{cardData.student.cne}</strong></span>
                      <span>CIN: <strong className="text-slate-900">{cardData.student.cin || 'N/A'}</strong></span>
                    </div>

                    {/* Filière & Option */}
                    <div className="space-y-0.2">
                      <div className="flex items-center justify-between text-[6px] font-extrabold">
                        <span className="text-[#0f2863] truncate max-w-[110px]" title={cardData.student.filiere}>
                          📚 {cardData.student.filiere}
                        </span>
                        <span className="bg-amber-100 text-amber-900 px-1 rounded font-black text-[5.5px] shrink-0 border border-amber-200">
                          {cardData.student.group}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Holographic Verification QR */}
                  <div className="flex flex-col items-center justify-center shrink-0 space-y-0.5 border-l border-slate-200 pl-1.5">
                    <div className="bg-white p-0.5 rounded-md border border-slate-300 shadow-2xs">
                      <QRCode value={verificationUrl} size={32} level="H" />
                    </div>
                    <span className="text-[4px] font-extrabold text-blue-900 uppercase tracking-tighter text-center leading-none">
                      SÉCURITÉ QR
                    </span>
                  </div>
                </div>

                {/* Footer Barcode & Legal Disclaimer */}
                <div className="bg-[#0f2863] text-white px-2 py-0.5 flex items-center justify-between text-[5px] border-t border-amber-400/80">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-white px-1 py-0.2 rounded shrink-0">
                      <Barcode value={cardNumber} height={12} className="w-[50px]" />
                    </div>
                    <span className="font-mono text-amber-300 font-bold tracking-wider">{cardNumber}</span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-slate-200 font-semibold block">
                      Valable jusqu'au <strong className="text-amber-300">{cardData.expires_at ? new Date(cardData.expires_at).toLocaleDateString('fr-FR') : '31/08/' + (new Date().getFullYear() + 1)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
