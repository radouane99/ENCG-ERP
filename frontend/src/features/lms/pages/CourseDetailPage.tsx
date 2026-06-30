import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Download, PlayCircle, FileText } from 'lucide-react'

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 animate-in p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/lms/courses')} className="p-2 bg-card border rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comptabilité Analytique</h1>
          <p className="text-muted-foreground text-sm mt-1">Pr. Tazi • Semestre 3</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <div className="bg-card border rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary"/> Chapitres du cours</h2>
              
              <div className="space-y-3">
                {[1, 2, 3].map(chap => (
                  <div key={chap} className="border rounded-xl p-4 hover:border-primary/40 transition-colors">
                     <h3 className="font-bold mb-2">Chapitre {chap} : Introduction et concepts de base</h3>
                     <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-lg hover:bg-muted/80 font-medium">
                           <FileText className="w-3.5 h-3.5" /> Support PDF
                        </button>
                        <button className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 font-medium">
                           <PlayCircle className="w-3.5 h-3.5" /> Vidéo explicative
                        </button>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
        
        <div className="space-y-6">
           <div className="bg-card border rounded-2xl shadow-sm p-6">
              <h3 className="font-bold mb-4">Progression</h3>
              <div className="text-3xl font-black text-primary mb-2">45%</div>
              <div className="w-full bg-muted rounded-full h-2 mb-4">
                <div className="bg-primary h-2 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" style={{ width: '45%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground">Vous avez complété 4 ressources sur 9.</p>
           </div>
           
           <div className="bg-card border rounded-2xl shadow-sm p-6">
              <h3 className="font-bold mb-4">Prochain devoir</h3>
              <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm">
                 <p className="font-bold mb-1">Étude de cas N°1</p>
                 <p className="text-xs opacity-80">À rendre avant le 30 Juin 2026</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
