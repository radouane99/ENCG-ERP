import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Edit2, Trash2, X, Monitor, Thermometer, Building, CheckCircle, Upload, Sparkles, ChevronDown, Check, MapPin, Users, ShieldCheck, QrCode, Printer, Grid, Eye } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import MassImportView from '@shared/components/ui/MassImportView'

interface Room {
  id: number; name: string; code: string; type: string;
  capacity: number; exam_capacity?: number; has_projector: boolean; has_ac: boolean; is_available: boolean;
}
interface Stats { total: number; available: number; amphitheatres: number; total_capacity: number; total_exam_capacity?: number; }

const TYPE_LABELS: Record<string, string> = { 
  classroom: 'Salle TD', 
  amphitheatre: 'Amphithéâtre', 
  lab: 'Laboratoire TP', 
  seminar: 'Salle de Séminaire', 
  admin: 'Bureau Admin' 
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'Toutes les catégories', badge: 'TOUT' },
  { value: 'amphitheatre', label: 'Amphithéâtres (Grands Amphis)', badge: 'AMPHI' },
  { value: 'classroom', label: 'Salles TD (Travaux Dirigés)', badge: 'TD' },
  { value: 'lab', label: 'Laboratoires Informatique TP', badge: 'LABO' },
  { value: 'seminar', label: 'Salles de Séminaire / Master', badge: 'SÉMINAIRE' }
]

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

const EMPTY = { name: '', code: '', type: 'classroom', capacity: 40, exam_capacity: 20, has_projector: true, has_ac: true, is_available: true }

export default function ClassroomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, available: 0, amphitheatres: 0, total_capacity: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

  // Modal 2D Seating Layout
  const [selectedSeatMapRoom, setSelectedSeatMapRoom] = useState<Room | null>(null)

  const fetchData = async () => {
    try { 
      setLoading(true); 
      const realFilter = typeFilter === 'all' ? '' : typeFilter
      const r = await api.get('/rooms', { params: { search, type: realFilter } }); 
      setRooms(r.data.data || []); 
      setStats(r.data.stats || {}) 
    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { fetchData() }, [search, typeFilter])

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY }); setShowModal(true) }
  const openEdit = (r: Room) => {
    setEditingId(r.id)
    setForm({ name: r.name, code: r.code || r.name.substring(0, 5), type: r.type, capacity: r.capacity, exam_capacity: r.exam_capacity || Math.floor(r.capacity / 2), has_projector: r.has_projector, has_ac: r.has_ac, is_available: r.is_available })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      editingId ? await api.put(`/rooms/${editingId}`, form) : await api.post('/rooms', form)
      toast.success(editingId ? 'Salle mise à jour avec succès !' : 'Salle créée avec succès !')
      setShowModal(false); fetchData()
    } catch (err: any) { 
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'enregistrement.') 
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette salle ?')) return
    try { 
      await api.delete(`/rooms/${id}`); 
      toast.success('Salle supprimée.'); 
      fetchData() 
    } catch { 
      toast.error('Erreur lors de la suppression.') 
    }
  }

  const handlePrintDoorNotice = (r: Room) => {
    const win = window.open('', '_blank')
    if (!win) return
    const examCap = r.exam_capacity ?? Math.floor(r.capacity / 2)
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Affiche de Porte - ${r.name} ENCG Fès</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; text-align: center; color: #0f2863; }
            .badge { display: inline-block; background: #0f2863; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
            .name { font-size: 42px; font-weight: 900; margin: 10px 0; color: #0f2863; }
            .grid { display: flex; justify-content: center; gap: 40px; margin: 40px 0; }
            .card { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 20px; padding: 25px 40px; }
            .val { font-size: 36px; font-weight: 900; color: #1e3a8a; }
            .lbl { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 5px; }
            .footer { margin-top: 60px; font-size: 12px; color: #94a3b8; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="badge">ECOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
          <div class="name">${r.name}</div>
          <div style="font-size: 16px; font-weight: bold; color: #475569;">${TYPE_LABELS[r.type] || r.type} — CODE: ${r.code || 'ENCG-SALLE'}</div>

          <div class="grid">
            <div class="card">
              <div class="val">${r.capacity}</div>
              <div class="lbl">Capacité Cours Magistral</div>
            </div>
            <div class="card" style="border-color: #9333ea; background: #faf5ff;">
              <div class="val" style="color: #7e22ce;">${examCap}</div>
              <div class="lbl" style="color: #7e22ce;">Capacité Examen (Anti-Triche)</div>
            </div>
          </div>

          <div style="margin: 30px 0; font-size: 14px; font-weight: bold; color: #334155;">
            Équipements : ${r.has_projector ? '📹 Vidéoprojecteur HD' : 'Aucun proj.'} | ${r.has_ac ? '❄️ Climatisation' : 'Chauffage/Ventilation'}
          </div>

          <div class="footer">
            SIGNALÉTIQUE OFFICIELLE — DIRECTION DES INFRASTRUCTURES & DE LA LOGISTIQUE
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    win.document.close()
    toast.success(`Fiche A4 générée pour ${r.name} !`)
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.type === 'number' ? +e.target.value : e.target.value;
    setForm(p => {
      const next = { ...p, [k]: val };
      if (k === 'capacity' && typeof val === 'number') {
        next.exam_capacity = Math.floor(val / 2);
      }
      return next;
    });
  }

  if (isImporting) {
    return (
      <MassImportView
        title="Importation Massive de Salles (Excel/CSV)"
        bannerTitle="Importateur de Locaux & Salles de Cours"
        bannerSubtitle="Gérez l'infrastructure physique de l'ENCG Fès en ajoutant des dizaines d'amphis, salles de TD ou laboratoires TP instantanément."
        modelName="Salles"
        templateName="Fichier Modèle d'Infrastructure"
        templateDesc={
          <>Téléchargez et remplissez le gabarit pré-formaté. Il contient les colonnes requises : <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">name</span> (nom de la salle), <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">capacity</span> (places cours), et <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">type</span> (catégorie de salle).</>
        }
        instructions={<>Les types de salles autorisés sont : <strong>amphitheatre</strong> (Amphithéâtre), <strong>classroom</strong> (Travaux Dirigés), et <strong>lab</strong> (Laboratoire informatique TP).</>}
        apiModel="rooms"
        onBack={() => setIsImporting(false)}
        onSuccess={() => { fetchData() }}
      />
    )
  }

  const totalCap = rooms.reduce((acc, r) => acc + r.capacity, 0)
  const totalExamCap = rooms.reduce((acc, r) => acc + (r.exam_capacity ?? Math.floor(r.capacity / 2)), 0)

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24">
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Building className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Parc Immobilier & Capacités d'Accueil ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Infrastructures & Salles
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Gestion centralisée des amphithéâtres, salles de cours TD, laboratoires TP et contrôle des jauges d'examens.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button 
              onClick={() => setIsImporting(true)} 
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-lg cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-300" /> Importer CSV/Excel
            </button>
            <button 
              onClick={openCreate} 
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" /> Ajouter Salle
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">TOTAL LOCAUX</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{rooms.length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">CAPACITÉ COURS</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">{totalCap} Sièges</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">CAPACITÉ EXAMEN</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">{totalExamCap} Places</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">AMPHITHÉÂTRES</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {rooms.filter(r => r.type === 'amphitheatre').length} Amphis
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom de salle, code ou capacité..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all"
          />
        </div>

        <div className="w-full md:w-72">
          <CustomSelect
            label="CATÉGORIE DE SALLE"
            icon={Building}
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
            placeholder="Toutes les catégories"
            options={TYPE_OPTIONS}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden p-6 space-y-4">
        <div className="overflow-x-auto min-h-[350px] border border-slate-100 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">NOM DE LA SALLE</th>
                <th className="px-6 py-4 text-center">CATÉGORIE</th>
                <th className="px-6 py-4 text-center">CAPACITÉ COURS</th>
                <th className="px-6 py-4 text-center">CAPACITÉ EXAMEN</th>
                <th className="px-6 py-4 text-center">ÉQUIPEMENTS</th>
                <th className="px-6 py-4 text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 font-bold text-xs">
                    Aucune salle trouvée dans la base de données.
                  </td>
                </tr>
              ) : rooms.map(r => {
                let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
                let displayType = TYPE_LABELS[r.type] || r.type;
                if (r.type === 'amphitheatre') {
                  badgeClass = "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200";
                  displayType = "AMPHITHÉÂTRE";
                } else if (r.type === 'classroom') {
                  badgeClass = "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200";
                  displayType = "SALLE TD";
                } else if (r.type === 'lab') {
                  badgeClass = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200";
                  displayType = "LABO TP";
                }

                const examCap = r.exam_capacity ?? Math.floor(r.capacity / 2);

                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-black text-xs shrink-0 shadow-md">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-xs">{r.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{r.code || 'CODE-ENCG'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", badgeClass)}>
                        {displayType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-slate-700 dark:text-slate-300 text-xs">
                      {r.capacity} SIÈGES
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-xl text-xs border border-purple-200 dark:border-purple-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> {examCap} PLACES
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border", r.has_projector ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200")}>
                          📹 PROJ.
                        </span>
                        <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border", r.has_ac ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-slate-100 text-slate-400 border-slate-200")}>
                          ❄️ CLIM.
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedSeatMapRoom(r)}
                          className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-black text-xs rounded-xl transition-all border border-indigo-200 dark:border-indigo-800 cursor-pointer shadow-xs flex items-center gap-1"
                          title="Plan 2D de Placement d'Examen"
                        >
                          <Grid className="w-3.5 h-3.5" /> Plan 2D
                        </button>
                        <button 
                          onClick={() => handlePrintDoorNotice(r)}
                          className="px-3 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl transition-all border border-blue-200 dark:border-blue-800 cursor-pointer shadow-xs flex items-center gap-1"
                          title="Imprimer Signalétique de Porte A4"
                        >
                          <Printer className="w-3.5 h-3.5" /> Affiche A4
                        </button>
                        <button onClick={() => openEdit(r)} className="p-2 bg-slate-100 hover:bg-slate-200 text-amber-600 rounded-xl transition-colors cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-2 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 2D Seating Map Layout */}
      {selectedSeatMapRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Plan de Placement d'Examen Anti-Triche</span>
                <h2 className="text-lg font-black">{selectedSeatMapRoom.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedSeatMapRoom(null)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                <span>Capacité Examen : <strong>{selectedSeatMapRoom.exam_capacity || Math.floor(selectedSeatMapRoom.capacity / 2)} places numérotées</strong> (Espacement 1 table vide sur 2)</span>
                <span className="px-3 py-1 bg-emerald-500 text-white font-black text-[10px] uppercase rounded-full">🟢 Grille Validée</span>
              </div>

              {/* 2D Visual Seat Grid */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="w-full bg-slate-800 text-white py-2 rounded-xl text-center text-xs font-black uppercase tracking-widest shadow-md">
                  🖥️ ESTTRADE / CHAIRE DU PROFESSEUR & SURVEILLANTS
                </div>

                <div className="grid grid-cols-6 gap-2 pt-4">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const isExamSeat = i % 2 === 0
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "p-2.5 rounded-xl text-center text-[10px] font-black border transition-all",
                          isExamSeat 
                            ? "bg-purple-100 dark:bg-purple-950/80 border-purple-300 text-purple-800 dark:text-purple-200 shadow-xs" 
                            : "bg-slate-200/60 dark:bg-slate-700/40 border-slate-300/40 text-slate-400 line-through"
                        )}
                      >
                        {isExamSeat ? `T-${i + 1}` : 'VIDE'}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button 
                onClick={() => setSelectedSeatMapRoom(null)}
                className="px-6 py-2.5 bg-slate-900 dark:bg-slate-700 text-white font-black rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fermer Le Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CRUD (New/Edit Room) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <h3 className="font-black text-lg">{editingId ? 'Modifier la salle' : 'Nouvelle Salle'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Nom de la Salle *</label>
                  <input required value={form.name} onChange={set('name')} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all" placeholder="Amphi Ibn Khaldoun" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Code / Repère *</label>
                  <input required value={form.code} onChange={set('code')} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all" placeholder="AMPH-1" />
                </div>
              </div>

              <div>
                <CustomSelect
                  label="Catégorie de la salle *"
                  icon={Building}
                  value={form.type}
                  onChange={(val) => setForm(p => ({ ...p, type: val }))}
                  placeholder="Sélectionner la catégorie"
                  options={Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Capacité Cours *</label>
                  <input required type="number" min="1" value={form.capacity} onChange={set('capacity')} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Capacité Examen *</label>
                  <input type="number" min="1" value={form.exam_capacity} onChange={set('exam_capacity')} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">ANNULER</button>
                <button type="submit" className="px-6 py-2.5 text-xs font-black bg-[#0f2863] text-white hover:bg-blue-900 rounded-xl shadow-md transition-colors cursor-pointer">{editingId ? 'METTRE À JOUR' : 'ENREGISTRER'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
