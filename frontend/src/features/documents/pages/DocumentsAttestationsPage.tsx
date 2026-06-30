import React, { useState } from 'react';
import {
  FileText, Download, CheckCircle2, Clock, XCircle, Search,
  Plus, Filter, Eye, Send, FileCheck, GraduationCap, Briefcase, Award,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { toast } from 'sonner';

type RequestStatus = 'pending' | 'ready' | 'delivered' | 'rejected';

interface DocRequest {
  id: number;
  student: string;
  cne: string;
  doc_type: string;
  requested_at: string;
  status: RequestStatus;
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending:   { label: 'En attente',  icon: Clock,        color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  ready:     { label: 'Prêt',        icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  delivered: { label: 'Remis',       icon: FileCheck,    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  rejected:  { label: 'Rejeté',      icon: XCircle,      color: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

const DOC_TYPES = [
  { value: 'attestation_inscription',  label: "Attestation d'Inscription",  icon: FileText },
  { value: 'releve_notes',             label: 'Relevé de Notes',            icon: Award },
  { value: 'attestation_reussite',     label: 'Attestation de Réussite',    icon: GraduationCap },
  { value: 'certificat_scolarite',     label: 'Certificat de Scolarité',    icon: Briefcase },
];

const MOCK_REQUESTS: DocRequest[] = [
  { id: 1, student: 'Amina Bennani',   cne: 'N120000001', doc_type: 'Attestation d\'Inscription', requested_at: '2026-06-25', status: 'pending' },
  { id: 2, student: 'Youssef Alaoui',  cne: 'M130000002', doc_type: 'Relevé de Notes',            requested_at: '2026-06-24', status: 'ready' },
  { id: 3, student: 'Sara Idrissi',    cne: 'R140000003', doc_type: 'Certificat de Scolarité',    requested_at: '2026-06-23', status: 'delivered' },
  { id: 4, student: 'Omar Chraibi',    cne: 'J150000004', doc_type: 'Attestation de Réussite',    requested_at: '2026-06-22', status: 'rejected' },
];

export default function DocumentsAttestationsPage() {
  const [requests, setRequests] = useState<DocRequest[]>(MOCK_REQUESTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = requests.filter(r =>
    (!search || r.student.toLowerCase().includes(search.toLowerCase()) || r.cne.includes(search)) &&
    (!statusFilter || r.status === statusFilter)
  );

  const updateStatus = async (id: number, status: RequestStatus) => {
    try {
      await api.patch(`/documents/requests/${id}`, { status });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toast.success('Statut mis à jour avec succès !');
    } catch {
      // offline: update locally
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toast.success('Statut mis à jour.');
    }
  };

  const counts = {
    pending:   requests.filter(r => r.status === 'pending').length,
    ready:     requests.filter(r => r.status === 'ready').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
    rejected:  requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Documents & Attestations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gérez les demandes de documents administratifs des étudiants.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouvelle demande
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'pending',   label: 'En attente',  value: counts.pending,   color: 'text-amber-400',  bg: 'bg-amber-400/10'  },
          { key: 'ready',     label: 'Prêts',       value: counts.ready,     color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { key: 'delivered', label: 'Remis',       value: counts.delivered, color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
          { key: 'rejected',  label: 'Rejetés',     value: counts.rejected,  color: 'text-red-400',    bg: 'bg-red-400/10'    },
        ].map(stat => (
          <div
            key={stat.key}
            onClick={() => setStatusFilter(statusFilter === stat.key ? '' : stat.key)}
            className={cn(
              'p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between cursor-pointer transition-colors',
              statusFilter === stat.key ? 'border-primary/40 bg-primary/5' : 'hover:border-border/80'
            )}
          >
            <div>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
            </div>
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', stat.bg)}>
              <FileText className={cn('w-5 h-5', stat.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Types de documents disponibles */}
      <div className="bg-card border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Types de documents disponibles</h2>
        <div className="flex flex-wrap gap-2">
          {DOC_TYPES.map(dt => (
            <span key={dt.value} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-full text-xs font-medium text-foreground">
              <dt.icon className="w-3.5 h-3.5 text-primary" /> {dt.label}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-center bg-muted/20">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par étudiant ou CNE..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="ready">Prêt</option>
            <option value="delivered">Remis</option>
            <option value="rejected">Rejeté</option>
          </select>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Étudiant</th>
                <th className="px-6 py-3 font-semibold">Type de document</th>
                <th className="px-6 py-3 font-semibold">Date demande</th>
                <th className="px-6 py-3 font-semibold text-center">Statut</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Aucune demande trouvée.</p>
                  </td>
                </tr>
              ) : filtered.map(req => {
                const cfg = STATUS_CONFIG[req.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={req.id} className="bg-card hover:bg-muted/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{req.student}</p>
                        <p className="text-xs text-muted-foreground">{req.cne}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{req.doc_type}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(req.requested_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.color)}>
                        <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(req.id, 'ready')}
                            className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors"
                          >
                            Marquer prêt
                          </button>
                        )}
                        {req.status === 'ready' && (
                          <button
                            onClick={() => updateStatus(req.id, 'delivered')}
                            className="px-2.5 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors"
                          >
                            <Send className="w-3 h-3 inline mr-1" />Remis
                          </button>
                        )}
                        <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
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
      </div>
    </div>
  );
}
