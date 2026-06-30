import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, User, FileText, Mail, Phone, MapPin, GraduationCap, Calendar, Clock, Edit2 } from 'lucide-react'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/students/${id}`)
        setStudent(res.data.data)
      } catch (err) {
        toast.error('Étudiant introuvable.')
        navigate('/students')
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [id, navigate])

  if (loading) return <div className="p-12 text-center text-muted-foreground">Chargement des données de l'étudiant...</div>
  if (!student) return null

  return (
    <div className="space-y-6 animate-in p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/students')} className="p-2 bg-card border rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{student.first_name} {student.last_name}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="font-mono text-primary font-medium">{student.student_number}</span>
              •
              <span>{student.cne}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 border rounded-lg font-medium hover:bg-muted text-sm flex items-center gap-2">
             <Edit2 className="w-4 h-4" /> Modifier
           </button>
           <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm flex items-center gap-2">
             <FileText className="w-4 h-4" /> Attestation
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Quick Info */}
        <div className="space-y-6">
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden text-center p-6">
            <div className="w-24 h-24 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-4">
              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold">{student.first_name} {student.last_name}</h2>
            <p className="text-sm text-muted-foreground">{student.status === 'active' ? 'Étudiant(e) actif(ve)' : 'Inactif'}</p>
            
            <div className="flex flex-col gap-3 mt-6 text-left text-sm border-t pt-4">
              <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-muted-foreground"/> <span>{student.email}</span></div>
              {student.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-muted-foreground"/> <span>{student.phone}</span></div>}
              {student.city && <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-muted-foreground"/> <span>{student.city}</span></div>}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-2xl shadow-sm p-6">
             <h3 className="font-bold text-lg border-b pb-3 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-primary"/> Informations d'identité</h3>
             <div className="grid grid-cols-2 gap-y-4">
                <div><p className="text-xs text-muted-foreground uppercase font-bold">CIN</p><p className="font-medium">{student.cin}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase font-bold">CNE</p><p className="font-medium">{student.cne}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase font-bold">Code Massar</p><p className="font-medium">{student.massar_code || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase font-bold">Date de naissance</p><p className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground"/> {student.birth_date || '—'}</p></div>
             </div>
          </div>

          <div className="bg-card border rounded-2xl shadow-sm p-6">
             <h3 className="font-bold text-lg border-b pb-3 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary"/> Dossier Académique</h3>
             <div className="grid grid-cols-3 gap-y-4">
                <div><p className="text-xs text-muted-foreground uppercase font-bold">Année d'inscription</p><p className="font-medium">{student.enrollment_year || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase font-bold">Baccalauréat</p><p className="font-medium">{student.bac_series || '—'} ({student.bac_year || '—'})</p></div>
                <div><p className="text-xs text-muted-foreground uppercase font-bold">Mention</p><p className="font-medium">{student.bac_mention || '—'}</p></div>
             </div>
          </div>
          
          <div className="bg-card border rounded-2xl shadow-sm p-6">
             <div className="flex justify-between items-center border-b pb-3 mb-4">
               <h3 className="font-bold text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Inscriptions & Parcours</h3>
               <button className="text-sm text-primary hover:underline font-medium">+ Nouvelle inscription</button>
             </div>
             
             {/* Stub for now, would fetch registrations */}
             <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-xl">
                Aucune inscription pédagogique trouvée pour cet étudiant.
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
