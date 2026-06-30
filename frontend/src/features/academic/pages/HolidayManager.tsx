import React, { useState, useEffect } from 'react';
import { CalendarOff, Plus, Trash2, Edit2, X, CalendarDays, Palmtree, School, AlertTriangle } from 'lucide-react';
import api from '@shared/lib/api';
import { toast } from 'sonner';

interface Holiday {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  type: 'national' | 'religious' | 'academic' | 'other';
  description?: string;
}

const TYPE_LABELS: Record<string, string> = {
  national: 'Fête Nationale',
  religious: 'Fête Religieuse',
  academic: 'Vacances Académiques',
  other: 'Autre',
};

const TYPE_COLORS: Record<string, string> = {
  national: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  religious: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  academic: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  other: 'bg-muted text-muted-foreground border-border',
};

const TYPE_DOT: Record<string, string> = {
  national: 'bg-blue-400',
  religious: 'bg-emerald-400',
  academic: 'bg-amber-400',
  other: 'bg-muted-foreground',
};

const EMPTY_FORM = {
  name: '',
  start_date: '',
  end_date: '',
  type: 'academic' as const,
  description: '',
};

export default function HolidayManager() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ name: string; start_date: string; end_date: string; type: Holiday['type']; description: string }>({ ...EMPTY_FORM });

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await api.get('/holidays');
      setHolidays(res.data.data || res.data || []);
    } catch {
      // Use mock data if endpoint not available
      setHolidays([
        { id: 1, name: 'Fête du Trône', start_date: '2025-07-30', end_date: '2025-07-31', type: 'national' },
        { id: 2, name: 'Aïd Al-Adha', start_date: '2025-06-06', end_date: '2025-06-08', type: 'religious' },
        { id: 3, name: 'Vacances de mi-semestre', start_date: '2025-11-01', end_date: '2025-11-09', type: 'academic', description: 'Pause pédagogique de mi-semestre' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHolidays(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (h: Holiday) => {
    setEditingId(h.id);
    setForm({ name: h.name, start_date: h.start_date, end_date: h.end_date, type: h.type, description: h.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.end_date && form.start_date > form.end_date) {
      toast.error('La date de fin doit être après la date de début.');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/holidays/${editingId}`, form);
        toast.success('Période modifiée avec succès !');
      } else {
        await api.post('/holidays', form);
        toast.success('Période ajoutée avec succès !');
      }
      setShowModal(false);
      fetchHolidays();
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette période ?')) return;
    try {
      await api.delete(`/holidays/${id}`);
      toast.success('Période supprimée.');
      fetchHolidays();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const getDuration = (start: string, end: string) => {
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff === 1 ? '1 jour' : `${diff} jours`;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const inputCls = 'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground';
  const labelCls = 'block text-xs font-bold text-muted-foreground uppercase mb-1';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Palmtree className="w-6 h-6 text-primary" />
            Jours Fériés & Vacances
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez les périodes de suspension des cours et examens.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Ajouter une période
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center"><CalendarDays className="w-5 h-5" /></div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Fêtes Nationales</p>
            <p className="text-2xl font-bold text-foreground">{holidays.filter(h => h.type === 'national').length}</p>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Palmtree className="w-5 h-5" /></div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Fêtes Religieuses</p>
            <p className="text-2xl font-bold text-foreground">{holidays.filter(h => h.type === 'religious').length}</p>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center"><School className="w-5 h-5" /></div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Vacances Académiques</p>
            <p className="text-2xl font-bold text-foreground">{holidays.filter(h => h.type === 'academic').length}</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-16 text-muted-foreground">Chargement...</div>
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <CalendarOff className="w-14 h-14 text-muted-foreground/30 mb-4" />
            <p className="font-medium text-muted-foreground">Aucun jour férié ou période de vacance configuré.</p>
            <button onClick={openCreate} className="mt-4 text-sm text-primary hover:underline">+ Ajouter la première période</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {holidays.map(h => (
              <div key={h.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${TYPE_DOT[h.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-foreground">{h.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_COLORS[h.type]}`}>
                      {TYPE_LABELS[h.type]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(h.start_date)} → {formatDate(h.end_date)} &nbsp;·&nbsp; <span className="font-medium">{getDuration(h.start_date, h.end_date)}</span>
                  </p>
                  {h.description && <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{h.description}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(h)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Modifier">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(h.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg text-foreground">{editingId ? 'Modifier la période' : 'Nouvelle période'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Nom *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Ex: Fête du Trône" />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))} className={inputCls}>
                  <option value="national">Fête Nationale</option>
                  <option value="religious">Fête Religieuse</option>
                  <option value="academic">Vacances Académiques</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date de début *</label>
                  <input required type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date de fin *</label>
                  <input required type="date" value={form.end_date} min={form.start_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Description (optionnel)</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Notes ou précisions..." />
              </div>
              {form.start_date && form.end_date && form.start_date <= form.end_date && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Durée : <span className="font-bold text-foreground">{getDuration(form.start_date, form.end_date)}</span>
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
