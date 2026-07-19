import { useState, useEffect } from 'react'
import { X, Loader2, UserPlus } from 'lucide-react'
import { studentsApi } from '@shared/api/students'
import { academicApi } from '@shared/api/academic'
import { toast } from 'sonner'

export default function AddStudentModal({ 
  onClose, 
  onRefresh 
}: { 
  onClose: () => void; 
  onRefresh: () => void; 
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    cin: '',
    cne: '',
    massar_code: '',
    current_filiere: '',
    current_semester: 1,
  })

  const [saving, setSaving] = useState(false)
  const [filieres, setFilieres] = useState<any[]>([])

  useEffect(() => {
    academicApi.getFilieres().then(setFilieres).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error('Veuillez remplir les champs obligatoires (Prénom, Nom, Email).')
      return
    }

    try {
      setSaving(true)
      await studentsApi.createStudent(formData as any)
      toast.success('Étudiant ajouté avec succès !')
      onRefresh()
      onClose()
    } catch (error: any) {
      console.error('Failed to create student', error)
      const msg = error.response?.data?.message || 'Erreur lors de la création de l\'étudiant.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#0f2863]" />
            <h3 className="font-bold text-[#0f2863]">Ajouter un nouvel étudiant</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Prénom <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="Prénom" 
                value={formData.first_name} 
                onChange={e => setFormData({...formData, first_name: e.target.value})} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nom <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="Nom" 
                value={formData.last_name} 
                onChange={e => setFormData({...formData, last_name: e.target.value})} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Email Académique / Personnel <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              placeholder="etudiant@student.encg.ma" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">CIN</label>
              <input 
                type="text" 
                placeholder="ex: CD123456" 
                value={formData.cin} 
                onChange={e => setFormData({...formData, cin: e.target.value})} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">CNE / Code Massar</label>
              <input 
                type="text" 
                placeholder="ex: N134000123" 
                value={formData.cne} 
                onChange={e => setFormData({ ...formData, cne: e.target.value, massar_code: e.target.value })} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Numéro de Téléphone</label>
            <input 
              type="tel" 
              placeholder="0612345678" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Filière d'affectation</label>
              <select 
                value={formData.current_filiere} 
                onChange={e => setFormData({...formData, current_filiere: e.target.value})} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Sélectionner une filière</option>
                {filieres.map(f => (
                  <option key={f.id} value={f.code}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Semestre</label>
              <select 
                value={formData.current_semester} 
                onChange={e => setFormData({...formData, current_semester: parseInt(e.target.value)})} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                  <option key={s} value={s}>Semestre {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-5 py-2.5 bg-[#0f2863] text-white text-xs font-bold rounded-xl hover:bg-[#1a387e] transition-colors flex items-center gap-2 shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Créer l'étudiant
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
