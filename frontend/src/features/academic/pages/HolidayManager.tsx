import React, { useState, useEffect, useRef } from 'react';
import { CalendarOff, Plus, Trash2, Edit2, X, CalendarDays, Palmtree, School, AlertTriangle, Sparkles, Download, Check, ChevronDown, Bell, Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@shared/lib/utils';
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
  national: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200',
  religious: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200',
  academic: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200',
  other: 'bg-slate-100 text-slate-600 border-slate-200',
};

const TYPE_DOT: Record<string, string> = {
  national: 'bg-blue-500',
  religious: 'bg-emerald-500',
  academic: 'bg-amber-500',
  other: 'bg-slate-400',
};

interface CustomSelectProps {
  label?: string
  icon?: any
  value: string | number
  onChange: (val: any) => void
  options: { value: string | number; label: string; badge?: string }[]
  placeholder: string
}

function CustomSelect({ label, icon: Icon, value, onChange, options, placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => String(o.value) === String(value))

  return (
    <div ref={ref} className={cn("relative space-y-1.5 w-full", open ? "z-[100]" : "z-10")}>
      {label && (
        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
          {Icon && <Icon className="inline w-3 h-3 mr-1 text-indigo-500" />}
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs text-left",
          open 
            ? "border-indigo-500 ring-4 ring-indigo-500/15 text-indigo-900 dark:text-indigo-200" 
            : "border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-800 dark:text-slate-100"
        )}
      >
        <span className={cn("truncate font-bold", !selectedOption && "text-slate-400 font-medium")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", open && "rotate-180 text-indigo-600")} />
      </button>

      {open && (
        <div className="absolute z-[9999] top-full left-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  "px-4 py-2.5 text-xs font-bold cursor-pointer flex items-center justify-between transition-colors group",
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{opt.label}</span>
                  {opt.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

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
      const res = await api.get('/admin/holidays');
      setHolidays(res.data.data || res.data || []);
    } catch {
      toast.error('Erreur lors du chargement des jours fériés.');
      setHolidays([]);
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
        await api.put(`/admin/holidays/${editingId}`, form);
        toast.success('Période modifiée avec succès !');
      } else {
        await api.post('/admin/holidays', form);
        toast.success('Période ajoutée avec succès !');
      }
      setShowModal(false);
      fetchHolidays();
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette période ?')) return;
    try {
      await api.delete(`/admin/holidays/${id}`);
      toast.success('Période supprimée.');
      fetchHolidays();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const handleExportIcal = () => {
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ENCG FES//ACADEMIC HOLIDAYS//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...holidays.map(h => `BEGIN:VEVENT\r\nSUMMARY:Vacances ENCG - ${h.name}\r\nDESCRIPTION:${h.description || TYPE_LABELS[h.type]}\r\nDTSTART:${h.start_date.replace(/-/g, '')}\r\nDTEND:${h.end_date.replace(/-/g, '')}\r\nEND:VEVENT`),
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Calendrier_Vacances_ENCG.ics`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast.success('Calendrier iCal de l\'ensemble des vacances exporté !')
  }

  const handleWhatsAppBroadcast = () => {
    const message = encodeURIComponent(`RAPPEL ACADÉMIQUE — ENCG Fès:\nChers Étudiants et Enseignants, nous vous informons des prochaines périodes d'interruption des cours:\n\n${holidays.map(h => `🌴 ${h.name} : Du ${h.start_date} au ${h.end_date}`).join('\n')}\n\nBonnes vacances à tous !`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
    toast.success('Alerte WhatsApp préparée pour la diffusion aux étudiants !')
  }

  const getDuration = (start: string, end: string) => {
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff === 1 ? '1 jour' : `${diff} jours`;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24">
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Palmtree className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Calendrier Académique Officiel ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Jours Fériés & Vacances
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Gestion des périodes de suspension des cours, congés légaux et planification des vacances universitaires.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={handleWhatsAppBroadcast}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              📱 Diffusion WhatsApp
            </button>
            <button
              onClick={handleExportIcal}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" /> Export iCal (.ics)
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" /> Ajouter Période
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">TOTAL PÉRIODES</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{holidays.length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 block">FÊTES NATIONALES</span>
            <span className="text-2xl font-black text-blue-300 font-mono mt-1 block">
              {holidays.filter(h => h.type === 'national').length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">FÊTES RELIGIEUSES</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {holidays.filter(h => h.type === 'religious').length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">VACANCES ACADÉMIQUES</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {holidays.filter(h => h.type === 'academic').length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content List Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Périodes de Suspension des Cours</h3>
            <span className="px-3.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 text-[10px] font-black uppercase tracking-wider rounded-full shadow-xs flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-600" /> Verrouillage Planning Examens Actif
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-16 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <CalendarOff className="w-14 h-14 text-slate-300 mb-4" />
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">Aucun jour férié ou période de vacances configuré en base de données.</p>
            <button onClick={openCreate} className="mt-4 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">+ Ajouter la première période</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
            {holidays.map(h => (
              <div key={h.id} className="flex items-center justify-between p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${TYPE_DOT[h.type]}`} />
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-black text-slate-900 dark:text-white text-sm">{h.name}</p>
                      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${TYPE_COLORS[h.type]}`}>
                        {TYPE_LABELS[h.type]}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                      {formatDate(h.start_date)} → {formatDate(h.end_date)} &nbsp;·&nbsp; <span className="font-black text-indigo-600 dark:text-indigo-400">{getDuration(h.start_date, h.end_date)}</span>
                    </p>
                    {h.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">{h.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(h)} className="p-2 bg-slate-100 hover:bg-slate-200 text-amber-600 rounded-xl transition-colors cursor-pointer" title="Modifier">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(h.id)} className="p-2 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <h3 className="font-black text-lg">{editingId ? 'Modifier la période' : 'Nouvelle Période'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Intitulé / Nom *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all" placeholder="Ex: Fête du Trône / Vacances d'Hiver" />
              </div>

              <div>
                <CustomSelect
                  label="Catégorie de Vacance *"
                  icon={Palmtree}
                  value={form.type}
                  onChange={(val) => setForm(p => ({ ...p, type: val as any }))}
                  placeholder="Sélectionner le type"
                  options={Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Date de Début *</label>
                  <input required type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Date de Fin *</label>
                  <input required type="date" value={form.end_date} min={form.start_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Description (Optionnel)</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all resize-none" placeholder="Notes ou précisions..." />
              </div>

              {form.start_date && form.end_date && form.start_date <= form.end_date && (
                <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 p-3 rounded-2xl border border-indigo-200 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  Durée totale : <span className="font-black text-indigo-900">{getDuration(form.start_date, form.end_date)}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">ANNULER</button>
                <button type="submit" className="px-6 py-2.5 text-xs font-black bg-[#0f2863] text-white hover:bg-blue-900 rounded-xl shadow-md transition-colors cursor-pointer">{editingId ? 'METTRE À JOUR' : 'ENREGISTRER'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
