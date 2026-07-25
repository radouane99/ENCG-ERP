import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserCheck, Clock, FileSignature, CheckCircle2, FileText, Banknote, Plus, Edit2, Trash2, X, Download, LayoutGrid, List, XCircle, ChevronDown, Check, Building2, BookOpen, GraduationCap, Sparkles } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface CustomSelectProps {
  label?: string
  icon?: any
  value: string | number
  onChange: (val: any) => void
  options: { value: string | number; label: string; badge?: string }[]
  placeholder: string
  disabled?: boolean
}

function CustomSelect({ label, icon: Icon, value, onChange, options, placeholder, disabled }: CustomSelectProps) {
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
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {Icon && <Icon className="inline w-3.5 h-3.5 mr-1 text-indigo-500" />}
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs text-left",
          open 
            ? "border-indigo-500 ring-4 ring-indigo-500/15 text-indigo-900 dark:text-indigo-200" 
            : "border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-800 dark:text-slate-100",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span className={cn("truncate font-bold", !selectedOption && "text-slate-400 font-medium")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", open && "rotate-180 text-indigo-600")} />
      </button>

      {open && !disabled && (
        <div className="absolute z-[9999] top-full left-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
          <div
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
          >
            <span>{placeholder}</span>
          </div>
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


interface Vacataire {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  qualification: string;
  module: string;
  module_id: number | null;
  agreed_hours: number;
  hours_completed: number;
  hourly_rate: number;
  status: 'pending' | 'signed' | 'completed' | 'rejected';
  payment_status: 'paid' | 'partial' | 'unpaid';
  payment_amount: number;
}

interface Stats {
  total: number;
  pending: number;
  total_hours: number;
  unpaid_contracts: number;
}

interface Module {
  id: number;
  code: string;
  name: string;
  filiere_id: number;
}

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  qualification: '', department_id: '', filiere_id: '', module_id: '', agreed_hours: 30,
  hourly_rate: 400, status: 'pending', contract_start: '', contract_end: ''
};

const KANBAN_COLUMNS = [
  { id: 'pending', title: 'En attente', icon: FileSignature, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'signed', title: 'Approuvé (Signé)', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'rejected', title: 'Refusé', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  { id: 'completed', title: 'Terminé', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' }
];

export default function VacataireList() {
  const { t } = useTranslation('common')
  const [vacataires, setVacataires] = useState<Vacataire[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, total_hours: 0, unpaid_contracts: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [vacRes, modRes, deptRes, filRes] = await Promise.all([
        api.get('/hr/vacataires', { params: { search: searchQuery } }),
        api.get('/modules'),
        api.get('/departments'),
        api.get('/filieres')
      ])
      setVacataires(vacRes.data.data || [])
      setStats(vacRes.data.stats || {})
      setModules(modRes.data.data || [])
      setDepartments(deptRes.data.data || [])
      setFilieres(filRes.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [searchQuery])

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowModal(true) }
  const openEdit = (v: Vacataire) => {
    setEditingId(v.id)
    const mod = modules.find(m => m.id === v.module_id)
    const fil = filieres.find(f => f.id === mod?.filiere_id)
    setForm({
      first_name: v.first_name, last_name: v.last_name, email: v.email,
      phone: v.phone, qualification: v.qualification,
      department_id: fil?.department_id?.toString() ?? '',
      filiere_id: mod?.filiere_id?.toString() ?? '',
      module_id: v.module_id?.toString() ?? '',
      agreed_hours: v.agreed_hours, hourly_rate: v.hourly_rate,
      status: v.status, contract_start: '', contract_end: ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form, module_id: form.module_id ? parseInt(form.module_id as string) : null, contract_type: 'visiting' }
      if (editingId) {
        await api.put(`/hr/vacataires/${editingId}`, payload)
        toast.success('Contrat mis à jour avec succès !')
      } else {
        await api.post('/hr/vacataires', payload)
        toast.success('Vacataire créé avec succès !')
      }
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la sauvegarde.')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer ce vacataire ?')) {
      try {
        await api.delete(`/hr/vacataires/${id}`)
        toast.success('Vacataire supprimé avec succès')
        fetchData()
      } catch (err) { toast.error('Erreur lors de la suppression.') }
    }
  }
  
  const handleDownloadPdf = async (id: number) => {
    try {
        const response = await api.get(`/hr/vacataires/${id}/contract-pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a') as HTMLAnchorElement;
        link.href = url;
        link.setAttribute('download', `Contrat_Vacataire_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        toast.error('Erreur lors du téléchargement du contrat PDF');
    }
  }

  const handleWhatsAppRelance = (vac: Vacataire) => {
    const phone = vac.phone ? vac.phone.replace(/[^0-9]/g, '') : ''
    const message = encodeURIComponent(`Bonjour Prof. ${vac.last_name} ${vac.first_name},\n\nL'administration RH de l'ENCG Fès vous prie de bien vouloir transmettre votre RIB bancaire, votre attestation et la copie certifiée de votre diplôme pour la régularisation de votre dossier de vacation.\n\nCordialement,\nService RH — ENCG Fès`)
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank')
    }
    toast.success(`Relance WhatsApp préparée pour Prof. ${vac.last_name}`)
  }

  const handleGeneratePaySlipPdf = (vac: Vacataire) => {
    const brut = (vac.agreed_hours || 30) * (vac.hourly_rate || 400)
    const ir = Math.round(brut * 0.17)
    const net = brut - ir

    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bordereau de Réglement Vacations - ${vac.last_name} ${vac.first_name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px double #0f2863; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 18px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 10px; }
            .subtitle { font-size: 11px; color: #64748b; font-weight: 700; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .info-item { font-size: 13px; }
            .info-item strong { color: #0f2863; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background: #0f2863; color: white; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
            .total-row { font-weight: bold; font-size: 14px; background: #f1f5f9; }
            .net-box { background: #ecfdf5; border: 2px solid #10b981; color: #065f46; padding: 18px; border-radius: 16px; text-align: center; margin-top: 25px; font-size: 20px; font-weight: 900; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
            .signature-box { border-top: 1px solid #cbd5e1; width: 200px; text-align: center; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 15px; font-weight: 900; color: #0f2863;">ROYAUME DU MAROC</div>
            <div class="subtitle">UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH — FÈS</div>
            <div class="subtitle">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION (ENCG FÈS)</div>
            <div class="title">BORDEREAU DÉTAILLÉ DE RÈGLEMENT DES VACATIONS</div>
          </div>

          <div class="info-grid">
            <div class="info-item"><strong>Enseignant Vacataire:</strong> ${vac.last_name} ${vac.first_name}</div>
            <div class="info-item"><strong>Email:</strong> ${vac.email}</div>
            <div class="info-item"><strong>Qualification / Grade:</strong> ${vac.qualification || 'Intervenant Professionnel'}</div>
            <div class="info-item"><strong>Module Assigné:</strong> ${vac.module || 'Sciences de Gestion'}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Désignation de la prestation</th>
                <th>Volume Horaire</th>
                <th>Taux Horaire Brut</th>
                <th>Total Brut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Enseignement théorique & travaux dirigés (${vac.module || 'Module de Gestion'})</td>
                <td>${vac.agreed_hours || 30} H</td>
                <td>${vac.hourly_rate || 400} MAD</td>
                <td><strong>${brut.toLocaleString()} MAD</strong></td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right;">DÉDUCTION IMPÔT SUR LE REVENU (IR RETENUE À LA SOURCE 17%) :</td>
                <td style="color: #dc2626;"><strong>- ${ir.toLocaleString()} MAD</strong></td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">NET À PAYER SUR COMPTE BANCAIRE :</td>
                <td style="color: #059669;"><strong>${net.toLocaleString()} MAD</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="net-box">
            NET À VIRER : ${net.toLocaleString()} MAD
          </div>

          <div class="footer">
            <div class="signature-box">Signature de l'Intervenant</div>
            <div class="signature-box">Le Chef de Département</div>
            <div class="signature-box">Le Directeur de l'ENCG Fès</div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Prénom,Nom,Email,Téléphone,Qualification,Module,Heures,Statut\n"
      + vacataires.map(v => `${v.first_name},${v.last_name},${v.email},${v.phone},${v.qualification},${v.module},${v.agreed_hours},${v.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vacataires.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Prénom,Nom,Email,Téléphone,Qualification,Heures Convenues,Taux Horaire\nJean,Dupont,jean.dupont@encg.ma,0600000000,Expert,30,400\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "modele_import_vacataires.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const vacataireId = parseInt(draggableId.replace('vac-', ''));
    const newStatus = destination.droppableId as Vacataire['status'];

    // Optimistic UI update
    setVacataires(prev => prev.map(v => v.id === vacataireId ? { ...v, status: newStatus } : v));

    try {
        await api.put(`/hr/vacataires/${vacataireId}`, { status: newStatus });
        toast.success('Statut mis à jour avec succès');
        fetchData();
    } catch (err) {
        toast.error('Erreur lors de la mise à jour du statut');
        fetchData(); // Revert
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const inputCls = "w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1"

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24">
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <UserCheck className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Corps Enseignant Vacataire & HR ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Gestion des Vacataires
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Suivi des contrats d'enseignement vacataire, masse horaire effectuée et bordereaux de règlement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider border border-white/20 cursor-pointer shadow-md"
            >
              Modèle Import
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider border border-white/20 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 text-amber-300" /> Exporter
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" /> Nouveau Vacataire
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">Total Vacataires</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{stats.total}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-300 block">En Attente</span>
            <span className="text-2xl font-black text-orange-300 font-mono mt-1 block">{stats.pending}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">Heures Effectuées</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{stats.total_hours}h</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Paiements En Règle</span>
            <span className="text-xs font-black text-amber-300 mt-2 block flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Taux Horaire 400 MAD/h
            </span>
          </div>
        </div>
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Total Vacataires</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p></div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><UserCheck className="w-5 h-5" /></div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Contrats en attente</p>
            <p className="text-2xl font-bold text-foreground">{stats.pending}</p></div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center"><FileSignature className="w-5 h-5" /></div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Heures effectuées</p>
            <p className="text-2xl font-bold text-foreground">{stats.total_hours}h</p></div>
          <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center"><Clock className="w-5 h-5" /></div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Non payés</p>
            <p className="text-2xl font-bold text-foreground">{stats.unpaid_contracts}</p></div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><Banknote className="w-5 h-5" /></div>
        </div>
      </div>

      {/* View Toggle & Search */}
      <div className="flex items-center justify-between bg-card border p-2 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-72 md:ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Rechercher (Nom, Module)..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <button onClick={() => setViewMode('kanban')} className={cn("px-3 py-1.5 flex items-center gap-2 rounded-md text-sm font-medium transition-colors", viewMode === 'kanban' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <LayoutGrid className="w-4 h-4" /> Kanban
            </button>
            <button onClick={() => setViewMode('list')} className={cn("px-3 py-1.5 flex items-center gap-2 rounded-md text-sm font-medium transition-colors", viewMode === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <List className="w-4 h-4" /> Liste
            </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && !loading && (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {KANBAN_COLUMNS.map(column => {
                    const columnItems = vacataires.filter(v => v.status === column.id);
                    return (
                        <Droppable droppableId={column.id} key={column.id}>
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="bg-muted/30 rounded-2xl p-4 min-h-[400px] border border-transparent hover:border-border transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", column.bg, column.color)}>
                                                <column.icon className="w-4 h-4" />
                                            </div>
                                            <h3 className="font-bold text-foreground text-sm">{column.title}</h3>
                                        </div>
                                        <div className="px-2.5 py-0.5 rounded-full bg-background border text-xs font-bold text-muted-foreground shadow-sm">
                                            {columnItems.length}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {columnItems.map((vac, index) => (
                                            <Draggable draggableId={`vac-${vac.id}`} index={index} key={`vac-${vac.id}`}>
                                                {(provided, snapshot) => (
                                                    <div 
                                                        ref={provided.innerRef} 
                                                        {...provided.draggableProps} 
                                                        {...provided.dragHandleProps}
                                                        className={cn("bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group", snapshot.isDragging && "shadow-lg border-primary/50 ring-2 ring-primary/20 rotate-2")}
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                                                                    {vac.first_name[0]}{vac.last_name[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-foreground text-sm">{vac.last_name} {vac.first_name}</p>
                                                                    <p className="text-xs text-muted-foreground line-clamp-1">{vac.qualification || 'Aucune qualification'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 mb-4">
                                                            <div className="flex items-center justify-between text-xs bg-muted/50 px-2 py-1.5 rounded-md">
                                                                <span className="text-muted-foreground">Module:</span>
                                                                <span className="font-semibold text-foreground text-right max-w-[120px] truncate" title={vac.module}>{vac.module}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs bg-muted/50 px-2 py-1.5 rounded-md">
                                                                <span className="text-muted-foreground">Heures:</span>
                                                                <span className="font-semibold text-foreground">{vac.agreed_hours}h</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t">
                                                            <button onClick={() => handleDownloadPdf(vac.id)} title="Contrat PDF" className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors border border-blue-200 dark:border-blue-800">
                                                                <FileText className="w-3 h-3" /> Contrat
                                                            </button>
                                                            <button onClick={() => handleGeneratePaySlipPdf(vac)} title="Bordereau de Règlement" className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800">
                                                                <Banknote className="w-3 h-3" /> Paie
                                                            </button>
                                                            <button onClick={() => handleWhatsAppRelance(vac)} title="Relance WhatsApp" className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-lg transition-colors">
                                                                📱 WhatsApp
                                                            </button>
                                                            <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => openEdit(vac)} className="p-1 text-slate-400 hover:text-indigo-600 rounded-md" title="Modifier">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button onClick={() => handleDelete(vac.id)} className="p-1 text-slate-400 hover:text-red-600 rounded-md" title="Supprimer">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    )
                })}
            </div>
        </DragDropContext>
      )}

      {/* Table View */}
      {viewMode === 'list' && (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[300px]">
            {loading ? (
                <div className="flex justify-center items-center p-12 text-muted-foreground">Chargement...</div>
            ) : (
                <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                    <th className="px-6 py-3 font-semibold">Vacataire</th>
                    <th className="px-6 py-3 font-semibold">Module Assigné</th>
                    <th className="px-6 py-3 font-semibold">Progression (Heures)</th>
                    <th className="px-6 py-3 font-semibold">Contrat</th>
                    <th className="px-6 py-3 font-semibold">Paiement</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {vacataires.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucun vacataire trouvé.</td></tr>
                    ) : vacataires.map((vac) => {
                    const progress = vac.agreed_hours > 0 ? (vac.hours_completed / vac.agreed_hours) * 100 : 0
                    return (
                        <tr key={vac.id} className="bg-card hover:bg-muted/50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {vac.first_name[0]}{vac.last_name[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{vac.last_name} {vac.first_name}</p>
                                <p className="text-xs text-muted-foreground">{vac.qualification || vac.email}</p>
                            </div>
                            </div>
                        </td>
                            <td className="px-6 py-4">
                            {vac.module ? (
                                <span className="font-medium text-foreground">{vac.module}</span>
                            ) : (
                                <span className="text-muted-foreground italic text-sm">Non assigné</span>
                            )}
                            </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5 w-36">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-foreground">{vac.hours_completed}h</span>
                                <span className="text-muted-foreground">/ {vac.agreed_hours}h</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                className={cn("h-1.5 rounded-full transition-all", progress >= 100 ? "bg-green-500" : "bg-primary")}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            {vac.status === 'signed' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Signé
                            </span>
                            ) : vac.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                                <XCircle className="w-3.5 h-3.5" /> Refusé
                            </span>
                            ) : vac.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                <Clock className="w-3.5 h-3.5" /> Terminé
                            </span>
                            ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                <FileSignature className="w-3.5 h-3.5" /> En attente
                            </span>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            {vac.payment_status === 'paid' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">Réglé</span>
                            )}
                            {vac.payment_status === 'partial' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">Partiel</span>
                            )}
                            {vac.payment_status === 'unpaid' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">Non calculé</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleDownloadPdf(vac.id)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200 dark:border-blue-800" title="Télécharger le Contrat (PDF)">
                                <FileText className="w-3.5 h-3.5" /> Contrat
                            </button>
                            <button onClick={() => handleGeneratePaySlipPdf(vac)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800" title="Générer Bordereau de Paie (PDF)">
                                <Banknote className="w-3.5 h-3.5" /> Bordereau
                            </button>
                            <button onClick={() => handleWhatsAppRelance(vac)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors shadow-xs" title="Relance WhatsApp Pièces Manquantes">
                                📱 WhatsApp
                            </button>
                            <button onClick={() => openEdit(vac)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Modifier">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(vac.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            </div>
                        </td>

                        </tr>
                    )
                    })}
                </tbody>
                </table>
            )}
            </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{editingId ? 'Modifier le contrat' : 'Nouveau Vacataire'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Prénom *</label>
                  <input required value={form.first_name} onChange={set('first_name')} className={inputCls} placeholder="Karim" /></div>
                <div><label className={labelCls}>Nom *</label>
                  <input required value={form.last_name} onChange={set('last_name')} className={inputCls} placeholder="TAZI" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Email *</label>
                  <input required type="email" value={form.email} onChange={set('email')} className={inputCls} /></div>
                <div><label className={labelCls}>Téléphone</label>
                  <input value={form.phone} onChange={set('phone')} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Qualification / Titre</label>
                <input value={form.qualification} onChange={set('qualification')} className={inputCls} placeholder="Dr., Expert-Comptable..." /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  label="Département"
                  icon={Building2}
                  value={form.department_id}
                  onChange={(val) => setForm(prev => ({ ...prev, department_id: val }))}
                  placeholder="— Aucun département —"
                  options={departments.map(d => ({ value: d.id, label: d.name, badge: `DEP-${d.id}` }))}
                />

                <CustomSelect
                  label="Filière"
                  icon={GraduationCap}
                  value={form.filiere_id}
                  onChange={(val) => setForm(prev => ({ ...prev, filiere_id: val }))}
                  placeholder="— Aucune filière —"
                  options={filieres.filter(f => !form.department_id || f.department_id.toString() === form.department_id.toString()).map(f => ({ value: f.id, label: `${f.code} - ${f.name}`, badge: f.code }))}
                />
              </div>

              <CustomSelect
                label="Module assigné"
                icon={BookOpen}
                value={form.module_id}
                onChange={(val) => setForm(prev => ({ ...prev, module_id: val }))}
                placeholder="— Aucun module —"
                options={modules.filter(m => !form.filiere_id || m.filiere_id.toString() === form.filiere_id.toString()).map(m => ({ value: m.id, label: `${m.code} - ${m.name}`, badge: m.code }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Heures convenues *</label>
                  <input required type="number" min="1" value={form.agreed_hours} onChange={set('agreed_hours')} className={inputCls} /></div>
                <div><label className={labelCls}>Taux horaire (MAD)</label>
                  <input type="number" min="0" value={form.hourly_rate} onChange={set('hourly_rate')} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Date début</label>
                  <input type="date" value={form.contract_start} onChange={set('contract_start')} className={inputCls} /></div>
                <div><label className={labelCls}>Date fin</label>
                  <input type="date" value={form.contract_end} onChange={set('contract_end')} className={inputCls} /></div>
              </div>

              <CustomSelect
                label="Statut du contrat"
                icon={FileSignature}
                value={form.status}
                onChange={(val) => setForm(prev => ({ ...prev, status: val }))}
                placeholder="Sélectionner le statut"
                options={[
                  { value: 'pending', label: 'En attente de signature', badge: 'Attente' },
                  { value: 'signed', label: 'Approuvé (Signé)', badge: 'Signé' },
                  { value: 'rejected', label: 'Refusé', badge: 'Refus' },
                  { value: 'completed', label: 'Terminé', badge: 'Clôturé' }
                ]}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
