import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, User, FileText, MapPin, GraduationCap } from 'lucide-react'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'

export default function StudentCreatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    cin: '',
    cne: '',
    massar_code: '',
    birth_date: '',
    gender: 'M',
    address: '',
    city: '',
    bac_year: new Date().getFullYear(),
    bac_series: '',
    bac_mention: '',
    enrollment_year: new Date().getFullYear(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post('/students', form)
      toast.success('Étudiant créé avec succès')
      navigate('/students')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setForm(p => ({ ...p, [k]: e.target.value }))

  const inputCls = "w-full px-4 py-2.5 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1.5"

  return (
    <div className="space-y-6 animate-in p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-card border rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nouvel Étudiant</h1>
            <p className="text-sm text-muted-foreground mt-1">Saisir les informations du nouvel étudiant</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations Personnelles */}
          <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 border-b pb-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg">Informations Personnelles</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Prénom *</label><input required value={form.first_name} onChange={set('first_name')} className={inputCls} placeholder="Ahmed" /></div>
              <div><label className={labelCls}>Nom *</label><input required value={form.last_name} onChange={set('last_name')} className={inputCls} placeholder="Alami" /></div>
            </div>

            <div><label className={labelCls}>Email *</label><input required type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="ahmed.alami@email.com" /></div>
            <div><label className={labelCls}>Téléphone</label><input value={form.phone} onChange={set('phone')} className={inputCls} placeholder="+212 6..." /></div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Date de naissance</label><input type="date" value={form.birth_date} onChange={set('birth_date')} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Genre</label>
                <select value={form.gender} onChange={set('gender')} className={inputCls}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Informations Académiques & Identifiants */}
          <div className="space-y-6">
            <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 border-b pb-3 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Identifiants Officiels</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>CIN *</label><input required value={form.cin} onChange={set('cin')} className={inputCls} placeholder="AB123456" /></div>
                <div><label className={labelCls}>CNE *</label><input required value={form.cne} onChange={set('cne')} className={inputCls} placeholder="1234567890" /></div>
              </div>
              <div><label className={labelCls}>Code MASSAR</label><input value={form.massar_code} onChange={set('massar_code')} className={inputCls} placeholder="R123456789" /></div>
            </div>

            <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 border-b pb-3 mb-4">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Dossier Académique</h2>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelCls}>Année Bac</label><input type="number" value={form.bac_year} onChange={set('bac_year')} className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Série Bac</label>
                  <select value={form.bac_series} onChange={set('bac_series')} className={inputCls}>
                    <option value="">—</option>
                    <option value="PC">PC</option>
                    <option value="SVT">SVT</option>
                    <option value="SMA">SMA</option>
                    <option value="SMB">SMB</option>
                    <option value="ECO">Économie</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Mention</label>
                  <select value={form.bac_mention} onChange={set('bac_mention')} className={inputCls}>
                    <option value="">—</option>
                    <option value="Passable">Passable</option>
                    <option value="Assez Bien">Assez Bien</option>
                    <option value="Bien">Bien</option>
                    <option value="Très Bien">Très Bien</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 border-b pb-3 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Adresse et Coordonnées</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><label className={labelCls}>Adresse complète</label><input value={form.address} onChange={set('address')} className={inputCls} placeholder="N°, Rue, Quartier..." /></div>
            <div><label className={labelCls}>Ville</label><input value={form.city} onChange={set('city')} className={inputCls} placeholder="Ex: Casablanca" /></div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 font-medium text-muted-foreground hover:bg-muted rounded-lg">Annuler</button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 font-medium bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm flex items-center gap-2">
            <Save className="w-4 h-4" /> {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
