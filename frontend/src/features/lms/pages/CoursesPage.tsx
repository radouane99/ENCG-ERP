import { useState } from 'react'
import { Search, Book, PlayCircle, Clock, Star } from 'lucide-react'

export default function CoursesPage() {
  const [courses] = useState([
    { id: 1, title: 'Comptabilité Analytique', prof: 'Pr. Tazi', semester: 'S3', duration: '30h', students: 120, progress: 45 },
    { id: 2, title: 'Marketing Stratégique', prof: 'Pr. Alaoui', semester: 'S5', duration: '40h', students: 150, progress: 10 },
    { id: 3, title: 'Droit des Affaires', prof: 'Pr. Bennis', semester: 'S4', duration: '20h', students: 90, progress: 80 },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plateforme E-Learning (LMS)</h1>
          <p className="text-muted-foreground text-sm mt-1">Accédez aux supports de cours, vidéos et ressources pédagogiques.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative w-full max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
           <input type="text" placeholder="Rechercher un cours ou un module..." className="w-full bg-card border pl-9 pr-4 py-2 text-sm rounded-lg" />
        </div>
        <select className="bg-card border px-4 py-2 text-sm rounded-lg outline-none">
           <option>Tous les semestres</option>
           <option>S1</option>
           <option>S3</option>
           <option>S5</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(c => (
          <div key={c.id} className="bg-card border rounded-2xl shadow-sm overflow-hidden group hover:border-primary/40 transition-all cursor-pointer">
             <div className="h-32 bg-muted/50 relative flex items-center justify-center">
                <Book className="w-10 h-10 text-muted-foreground opacity-30" />
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur text-xs font-bold px-2 py-1 rounded border">
                  {c.semester}
                </div>
             </div>
             <div className="p-5">
               <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{c.title}</h3>
               <p className="text-sm text-muted-foreground mb-4">Par {c.prof}</p>
               
               <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-4">
                 <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {c.duration}</span>
                 <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5"/> 4.8/5</span>
               </div>
               
               <div className="space-y-1">
                 <div className="flex justify-between text-xs">
                   <span>Progression globale</span>
                   <span className="font-bold">{c.progress}%</span>
                 </div>
                 <div className="w-full bg-muted rounded-full h-1.5">
                   <div className="bg-primary h-1.5 rounded-full" style={{ width: `${c.progress}%` }}></div>
                 </div>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
