import { useState, useEffect } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { studentsApi } from '@shared/api/students'
import { academicApi } from '@shared/api/academic'

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  current_filiere: string;
  current_semester: number;
  student_number: string;
  cne: string;
}

export default function EditStudentModal({ 
  student, 
  onClose, 
  onRefresh 
}: { 
  student: any; 
  onClose: () => void; 
  onRefresh: () => void; 
}) {
  const [formData, setFormData] = useState({
    ...student,
    current_filiere: student.current_filiere || student.latest_pathway?.filiere?.code || student.pathways?.[0]?.filiere?.code || '',
    current_semester: student.current_semester || student.latest_pathway?.current_semester || student.pathways?.[0]?.current_semester || 1
  });
  const [saving, setSaving] = useState(false);
  const [filieres, setFilieres] = useState<any[]>([]);

  useEffect(() => {
    academicApi.getFilieres().then(setFilieres).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await studentsApi.updateStudent(student.id, formData);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to update student', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-[#0f2863]">Modifier l'étudiant</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Prénom</label>
              <input value={formData.first_name || ''} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nom</label>
              <input value={formData.last_name || ''} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
            <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Filière</label>
              <select value={formData.current_filiere || ''} onChange={e => setFormData({...formData, current_filiere: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Sélectionner une filière</option>
                {filieres.map(f => (
                  <option key={f.id} value={f.code}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Semestre</label>
              <input type="number" value={formData.current_semester || 1} onChange={e => setFormData({...formData, current_semester: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="pt-4 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#0f2863] text-white text-sm font-medium rounded-lg hover:bg-[#1a387e] transition-colors flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
