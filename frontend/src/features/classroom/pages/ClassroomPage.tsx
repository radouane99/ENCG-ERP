import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Folder, 
  Zap, 
  X, 
  BookOpen, 
  Sparkles, 
  FileText, 
  MessageSquare,
  GraduationCap,
  ArrowRight,
  Filter
} from 'lucide-react'
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
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'supports' | 'pubs'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/lms/courses');
        if (res.data && res.data.data) {
          setClasses(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredClasses = classes.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'supports') return c.supports > 0;
    if (activeFilter === 'pubs') return c.pubs > 0;
    return true;
  });

  const totalSupports = classes.reduce((sum, c) => sum + (c.supports || 0), 0);
  const totalPubs = classes.reduce((sum, c) => sum + (c.pubs || 0), 0);

  return (
    <div className="space-y-8 animate-in p-6 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Portail Pédagogique Officiel — ENCG Fès</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Espace Classes Virtuelles & LMS
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="text-xs font-bold text-indigo-900">Tuteur IA Gemini 1.5 Actif</span>
          </div>
        </div>
      </div>

      {/* Hero Banner WOW Design */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-8 md:p-10 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-md border border-white/10">
              <BookOpen className="w-3.5 h-3.5 text-pink-400" />
              Plateforme Numérique d'Échange Académique
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Consultez vos Modules, Supports de Cours & Classrooms ENCG Fès
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Accédez instantanément aux espaces de cours interactifs, aux polycopiés PDF, aux devoirs et posez vos questions directement au Tuteur Virtuel IA ancré sur votre programme d'enseignement.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider">
                <Folder className="w-3.5 h-3.5" />
                <span>Modules</span>
              </div>
              <p className="text-3xl font-black text-white">{classes.length}</p>
              <p className="text-[10px] text-slate-400">Espaces de cours</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Supports PDF</span>
              </div>
              <p className="text-3xl font-black text-white">{totalSupports}</p>
              <p className="text-[10px] text-slate-400">Documents en ligne</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un module par nom, code ou professeur..." 
            className="w-full h-11 pl-11 pr-10 rounded-xl border border-slate-200 text-sm font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => setActiveFilter('all')}
            className={cn(
              "h-11 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border",
              activeFilter === 'all' 
                ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Toutes les classes ({classes.length})
          </button>

          <button 
            onClick={() => setActiveFilter('supports')}
            className={cn(
              "h-11 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border",
              activeFilter === 'supports' 
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            Avec Supports ({classes.filter(c => c.supports > 0).length})
          </button>

          <button 
            onClick={() => setActiveFilter('pubs')}
            className={cn(
              "h-11 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border",
              activeFilter === 'pubs' 
                ? "bg-pink-600 text-white border-pink-600 shadow-sm" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Zap className="w-3.5 h-3.5 text-pink-500" />
            Avec Publications ({classes.filter(c => c.pubs > 0).length})
          </button>
        </div>
      </div>

      {/* Classroom Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-3xl border border-slate-200 h-80 animate-pulse p-6 flex flex-col justify-between">
              <div className="h-28 bg-slate-200 rounded-2xl mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
              <div className="h-10 bg-slate-200 rounded-xl mt-auto"></div>
            </div>
          ))}
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800 mb-2">Aucun espace de cours trouvé</h3>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            Aucun module ne correspond à vos critères de recherche. Essayez de réinitialiser vos filtres.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Réinitialiser la recherche
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((c) => (
            <div 
              key={c.id} 
              className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
            >
              {/* Header Gradient */}
              <div className={cn("p-6 text-white bg-gradient-to-br relative overflow-hidden", c.color)}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    {c.group}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 bg-white/10 px-2.5 py-1 rounded-md">
                    {c.code}
                  </span>
                </div>
                
                <h3 className="text-xl font-black mb-1 line-clamp-1 text-white leading-snug group-hover:text-white/90 transition-colors relative z-10">
                  {c.title}
                </h3>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest relative z-10">
                  ÉTABLISSEMENT ENCG FÈS
                </p>
              </div>
              
              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col bg-white justify-between space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center p-1.5 shadow-sm">
                    <img src="/logo-encg.png" alt="ENCG Fès" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ENSEIGNANT RESPONSABLE</p>
                    <p className="text-xs font-extrabold text-slate-800">{c.teacher}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                    <p className="text-xl font-black text-indigo-900">{c.pubs}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                      <MessageSquare className="w-3 h-3 text-indigo-500" />
                      Publications
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                    <p className="text-xl font-black text-pink-600">{c.supports}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                      <FileText className="w-3 h-3 text-pink-500" />
                      Supports PDF
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/student/classroom/${c.id}`)}
                  className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-extrabold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 group/btn shadow-md hover:shadow-indigo-600/20"
                >
                  <span>Accéder au Classroom</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
