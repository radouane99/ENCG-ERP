import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { FileText, CheckCircle, Bot, Loader2 } from 'lucide-react'
import { studentsApi, api } from '@shared/api/students'
import { toast } from 'sonner'
import EditStudentModal from '../components/EditStudentModal'

export default function AdminStudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const fetchStudent = async () => {
    if (!id) return;
    try {
      const data = await studentsApi.getStudent(id)
      setStudent(data)
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'étudiant')
      navigate('/admin/students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchStudent()
  }, [id, navigate])

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?'

  const handleDocumentClick = async (type: string) => {
    const year = student.latest_pathway?.academic_year_id || '2025-2026'; // Defaulting to 2025/2026 string or id
    // Since backend expects year string in route like 2025/2026 but URL can't have slash, we encode or use a safe string. Let's just use 2025-2026
    const encodedYear = '2025-2026';
    
    let url = '';
    if (type === 'releve') {
      url = `/admin/students/${student.id}/releve-notes/${encodedYear}`;
    } else {
      url = `/admin/students/${student.id}/attestation-reussite/${encodedYear}`;
    }

    try {
      toast.loading(`Génération du ${type === 'releve' ? 'Relevé' : 'Attestation'} en cours...`, { id: 'pdf' });
      const response = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${type}_${student.student_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Document généré avec succès !', { id: 'pdf' });
    } catch (error) {
      toast.error('Erreur lors de la génération du document', { id: 'pdf' });
    }
  }

  const handleGenerateAI = async () => {
    try {
      toast.loading('Analyse du dossier par Gemini en cours...', { id: 'ai' });
      // In a real scenario we'd call a specific AI endpoint. For now we use the chat endpoint with a system prompt
      const response = await api.post('/chatbot/message', {
        message: `Génère un bilan pédagogique professionnel pour l'étudiant ${student.first_name} ${student.last_name} (Matricule: ${student.student_number}). Fais-le en 3 paragraphes concis.`,
        role: 'Admin'
      });
      toast.success('Bilan pédagogique généré avec succès !', { id: 'ai' });
      // We could display this in a modal, but for now an alert will do
      alert("Bilan Pédagogique IA :\n\n" + response.data.reply);
    } catch (error) {
      toast.error('Erreur lors de la génération du bilan', { id: 'ai' });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!student) return null;

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
          {getInitials(student.first_name)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Dossier Étudiant</h1>
          <p className="text-slate-500 mt-1 text-sm">Consultation du profil et des accès</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8 md:p-12 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
          
          {/* IDENTITÉ */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identité</h3>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nom Complet</span>
              <p className="font-bold text-slate-800 text-lg">{student.first_name} {student.last_name}</p>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Adresse Email</span>
              <p className="font-bold text-[#0f2863] text-lg">{student.email}</p>
            </div>
          </div>

          {/* SCOLARITÉ */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scolarité</h3>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Matricule / CNE</span>
              <p className="font-bold text-slate-800 text-lg">{student.student_number} <span className="text-slate-400 text-sm font-normal">/ {student.cne}</span></p>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filière Actuelle</span>
              <p className="font-bold text-slate-800 text-lg">
                {student.latest_pathway?.filiere?.name 
                  ? `${student.latest_pathway.filiere.name} (S${student.latest_pathway.current_semester})` 
                  : 'Non affecté'}
              </p>
            </div>

            {/* DOCUMENTS OFFICIELS */}
            <div className="pt-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Documents Officiels (2025/2026)</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleDocumentClick("releve")} className="flex flex-col items-center justify-center p-6 bg-[#0f2863] rounded-2xl hover:bg-[#1a387e] transition-colors shadow-sm group">
                  <FileText className="w-8 h-8 text-blue-200 mb-3 group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center">Relevé de notes</span>
                </button>
                <button onClick={() => handleDocumentClick("attestation")} className="flex flex-col items-center justify-center p-6 bg-[#0f2863] rounded-2xl hover:bg-[#1a387e] transition-colors shadow-sm group">
                  <CheckCircle className="w-8 h-8 text-blue-200 mb-3 group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center">Attestation de réussite</span>
                </button>
              </div>
            </div>

            {/* CONSEILLER PÉDAGOGIQUE IA */}
            <div className="pt-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Conseiller Pédagogique IA</h3>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <Bot className="w-32 h-32 text-indigo-500" />
                </div>
                <div className="relative z-10">
                  <h4 className="text-[#0f2863] font-bold mb-2">Bilan Pédagogique Intelligent</h4>
                  <p className="text-sm text-indigo-900/70 font-medium mb-4 pr-12">
                    Gemini 1.5 Pro analysera le dossier pour rédiger un rapport professionnel.
                  </p>
                  <button onClick={handleGenerateAI} className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-xs uppercase tracking-wider shadow-sm">
                    <Bot className="w-4 h-4" /> Générer le bilan IA
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-12 flex items-center justify-end gap-4 border-t border-slate-100 pt-8">
          <Link to="/admin/students" className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide">
            Retour à la liste
          </Link>
          <button onClick={() => setIsEditing(true)} className="px-8 py-3 bg-[#f59e0b] text-white font-bold rounded-xl hover:bg-[#d97706] transition-colors text-sm uppercase tracking-wide shadow-md">
            Modifier le Profil
          </button>
        </div>
      </div>
      
      {isEditing && (
        <EditStudentModal
          student={student}
          onClose={() => setIsEditing(false)}
          onRefresh={fetchStudent}
        />
      )}
    </div>
  )
}
