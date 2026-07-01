import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Folder, Zap, X, BookOpen } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'

interface Classroom {
  id: number;
  title: string;
  code: string;
  group: string;
  color: string;
  teacher: string;
  pubs: number;
  supports: number;
}

export default function ClassroomPage() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/lms/courses');
        setClasses(res.data.data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] italic">Espace Classroom UPF</h1>
      </div>

      <div className="bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#9d174d] rounded-[2rem] p-10 text-white shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Espaces d'Échange & Cours</h2>
          <p className="text-white/80 max-w-xl text-sm leading-relaxed">
            Bienvenue dans votre espace d'échange académique. Retrouvez vos modules, partagez des supports de cours et échangez avec vos professeurs et collègues.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher un module, un groupe..." 
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-4">
          <button className="h-12 px-6 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Folder className="w-4 h-4 text-amber-500" />
            Tous les groupes
          </button>
          <button className="h-12 px-6 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Zap className="w-4 h-4 text-orange-500" />
            Toutes les classes
          </button>
          <button className="h-12 px-6 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <X className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 italic flex items-center gap-2">
          Mes Classes Actives 📚
        </h2>
        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
          {classes.length} CLASSES
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((c) => (
          <div key={c.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
            <div className={cn("p-6 text-white bg-gradient-to-br", c.color)}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-black/20 px-2 py-1 rounded">
                  {c.group}
                </span>
                <BookOpen className="w-5 h-5 opacity-50" />
              </div>
              <h3 className="text-xl font-bold mb-1 line-clamp-1">{c.title}</h3>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">MODULE ID: {c.code}</p>
            </div>
            
            <div className="p-6 flex-1 flex flex-col bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img src="/logo-encg.png" alt="UPF" className="w-5 object-contain" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ENSEIGNANT</p>
                  <p className="text-xs font-bold text-slate-700">{c.teacher}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[#0f2863]">{c.pubs}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">PUBLICATIONS</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[#c01844]">{c.supports}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SUPPORTS</p>
                </div>
              </div>

              <div className="mt-auto">
                <button 
                  onClick={() => navigate(`/student/classroom/${c.id}`)}
                  className="w-full py-3 bg-[#0f2863] text-white rounded-xl text-sm font-bold hover:bg-[#0f2863]/90 transition-colors flex items-center justify-center gap-2"
                >
                  Ouvrir l'Espace
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
