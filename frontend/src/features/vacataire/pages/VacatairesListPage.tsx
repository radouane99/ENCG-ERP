import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Search, Filter, Download, Eye, Edit2,
  Trash2, FileText, ChevronLeft, ChevronRight,
  SortAsc, SortDesc, X, Briefcase
} from 'lucide-react';
import api from '@/shared/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import ExcelActions from '@shared/components/ui/ExcelActions';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Vacataire {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialty: string;
  hourly_rate: number;
  status: 'active' | 'inactive';
  total_hours_taught: number;
  unpaid_hours: number;
}

type SortField = 'last_name' | 'specialty' | 'total_hours_taught';
type SortOrder = 'asc' | 'desc';

// â”€â”€ Mock Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MOCK_VACATAIRES: Vacataire[] = [
  { id: 1, first_name: 'Driss', last_name: 'BENNIS', email: 'd.bennis@expert.ma', phone: '0661234567', specialty: 'Droit des Affaires', hourly_rate: 350, status: 'active', total_hours_taught: 45, unpaid_hours: 15 },
  { id: 2, first_name: 'Amina', last_name: 'CHAKIR', email: 'a.chakir@consulting.ma', phone: '0669876543', specialty: 'Marketing Digital', hourly_rate: 400, status: 'active', total_hours_taught: 24, unpaid_hours: 24 },
  { id: 3, first_name: 'Yassine', last_name: 'EL FASSI', email: 'yassine.elfassi@gmail.com', phone: '0612345678', specialty: 'Finance de Marché', hourly_rate: 450, status: 'inactive', total_hours_taught: 60, unpaid_hours: 0 },
];

const VacatairesListPage: React.FC = () => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('last_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['vacataires', { search, sortField, sortOrder, page }],
    queryFn: () => api.get('/vacataires', {
      params: { search, sort: sortField, order: sortOrder, page, per_page: perPage },
    }).then(r => r.data).catch(() => ({ data: MOCK_VACATAIRES, meta: { total: MOCK_VACATAIRES.length } })),
    placeholderData: { data: MOCK_VACATAIRES, meta: { total: MOCK_VACATAIRES.length } }
  });

  const vacataires: Vacataire[] = data?.data ?? [];

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />;
  };

  const filtered = vacataires.filter(v => {
    const s = search.toLowerCase();
    return v.first_name.toLowerCase().includes(s) || v.last_name.toLowerCase().includes(s) || v.specialty.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase size={20} className="text-indigo-400" />
            Gestion des Vacataires
          </h1>
          <p className="text-white/40 text-sm mt-0.5">Intervenants externes et vacataires professionnels</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExcelActions model="vacataires" label="Vacataires" onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['vacataires'] })} />
          <button className="flex items-center gap-1.5 text-sm text-white font-medium bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-all">
            <Plus size={14} /> Nouveau vacataire
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Rechercher par nom, spécialité..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('last_name')}>
                  <span className="flex items-center gap-1">Intervenant <SortIcon field="last_name" /></span>
                </th>
                <th className="p-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('specialty')}>
                  <span className="flex items-center gap-1">Spécialité <SortIcon field="specialty" /></span>
                </th>
                <th className="p-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Statut</th>
                <th className="p-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Taux horaire</th>
                <th className="p-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('total_hours_taught')}>
                  <span className="flex items-center gap-1">Heures (Non payées) <SortIcon field="total_hours_taught" /></span>
                </th>
                <th className="p-4 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-white/3 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {v.first_name[0]}{v.last_name[0]}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{v.last_name} {v.first_name}</p>
                        <p className="text-white/40 text-xs">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-white/70">{v.specialty}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${v.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-white/10 text-white/50 border-white/10'}`}>
                      {v.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-mono text-white/70">{v.hourly_rate} MAD</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{v.total_hours_taught}h</span>
                      {v.unpaid_hours > 0 && (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 rounded">
                          {v.unpaid_hours}h Ã  payer
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-white/50 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg" title="Contrats & Heures">
                        <FileText size={14} />
                      </button>
                      <button className="p-1.5 text-white/50 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-white/30">Aucun vacataire trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VacatairesListPage;
