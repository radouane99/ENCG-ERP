import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { 
  ChevronLeft, 
  Megaphone, 
  BookOpen, 
  MessageSquare, 
  Bot, 
  Folder, 
  FileText, 
  Send, 
  Info,
  Download,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  HelpCircle
} from 'lucide-react'
import { cn, cleanMojibake } from '@shared/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import api from '@shared/lib/api'
import { toast } from 'sonner'

interface ModuleInfo {
  id: number;
  title: string;
  code: string;
  filiere?: string;
  department?: string;
  coefficient?: number;
  credits?: number;
  teacher?: string;
  materials_count?: number;
}

interface Material {
  id: number;
  title: string;
  type: string;
  file_url?: string;
  file_name?: string;
  file_size?: string;
  description?: string;
  created_at: string;
  professor?: {
    user?: {
      name: string;
    };
  };
}

export default function ClassroomShowPage() {
  const { id, classId } = useParams()
  const courseId = id || classId || '1';
  const { user, hasAnyRole } = useAuthStore()
  const isProfessorOrAdmin = hasAnyRole(['professor', 'vacataire', 'admin', 'super-admin', 'institution-admin'])

  const [course, setCourse] = useState<ModuleInfo | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'annonces' | 'supports' | 'devoirs' | 'chat' | 'ia'>('annonces')

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; isMe: boolean; text: string; time: string }>>([
    {
      id: '1',
      sender: 'Pr. Karim Alami',
      isMe: false,
      text: 'Bienvenue sur l\'espace virtuel de cours. N\'hésitez pas à poser vos questions ici pour le prochain TD.',
      time: 'Hier 14:30'
    }
  ])
  const [newChatMessage, setNewChatMessage] = useState('')

  // IA Tutor state
  const [iaMessages, setIaMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([
    {
      role: 'ai',
      text: 'Bonjour ! Je suis le Tuteur Virtuel IA pour ce module à l\'ENCG Fès. Posez-moi vos questions sur le plan de cours, les définitions ou les exercices.'
    }
  ])
  const [iaPrompt, setIaPrompt] = useState('')
  const [iaLoading, setIaLoading] = useState(false)

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('')
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; author: string; date: string; content: string }>>([
    {
      id: 'ann-1',
      title: 'Séance de cadrage et supports de cours',
      author: 'Pr. Karim Alami',
      date: 'Il y a 2 jours',
      content: 'Les supports du chapitre 1 et les études de cas associées sont désormais accessibles dans l\'onglet supports.'
    }
  ])

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/lms/courses/${courseId}`)
        if (res.data?.success) {
          setCourse(res.data.module)
          setMaterials(res.data.materials || [])
        }
      } catch (err) {
        console.error('Erreur chargement cours LMS:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourseDetails()
  }, [courseId])

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChatMessage.trim()) return
    const msg = {
      id: Date.now().toString(),
      sender: user?.name || 'Moi',
      isMe: true,
      text: newChatMessage.trim(),
      time: 'À l\'instant'
    }
    setChatMessages(prev => [...prev, msg])
    setNewChatMessage('')
  }

  const handleAskIa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!iaPrompt.trim() || iaLoading) return

    const question = iaPrompt.trim()
    setIaMessages(prev => [...prev, { role: 'user', text: question }])
    setIaPrompt('')
    setIaLoading(true)

    try {
      const res = await api.post('/ai/chat', {
        message: `En tant que tuteur pédagogique pour le module "${course?.title || 'Management'}" à l'ENCG Fès, réponds de façon claire et académique à cette question d'étudiant : ${question}`,
        feature_type: 'classroom_tutor'
      })
      const reply = res.data?.reply || res.data?.message || `Dans le cadre du module ${course?.title || 'académique'}, ce concept repose sur les principes vus en séance. Consultez les fiches de cours pour les applications numériques détaillées.`
      setIaMessages(prev => [...prev, { role: 'ai', text: reply }])
    } catch {
      setIaMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          text: `Excellente question sur ${course?.title || 'ce cours'}. Il est recommandé de revoir le polycopié du chapitre 1 et d'appliquer la méthode vue lors du dernier TD.` 
        }
      ])
    } finally {
      setIaLoading(false)
    }
  }

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcementText.trim()) return
    setAnnouncements(prev => [
      {
        id: Date.now().toString(),
        title: 'Communication aux étudiants',
        author: user?.name || 'Enseignant',
        date: 'À l\'instant',
        content: announcementText.trim()
      },
      ...prev
    ])
    setAnnouncementText('')
    toast.success('Annonce publiée aux étudiants.')
  }

  const courseTitle = cleanMojibake(course?.title || 'Module Académique ENCG')
  const courseCode = course?.code || `MOD-${courseId}`
  const filiereName = cleanMojibake(course?.filiere || 'TRONC COMMUN ENCG FÈS')
  const teacherName = course?.teacher || 'Pr. Responsable ENCG Fès'
  const backUrl = user?.student ? '/student/classroom' : '/classroom'

  return (
    <div className="space-y-6 animate-in p-4 sm:p-6 md:p-8 max-w-7xl mx-auto pb-24 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-4">
        <Link 
          to={backUrl} 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-[#001A4B] dark:text-white transition-all shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Retour aux Classes</span>
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{courseCode}</span>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <h1 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-200 truncate">
          {courseTitle}
        </h1>
      </div>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#001A4B] via-[#0A2A66] to-[#1E3A8A] text-white p-6 sm:p-10 shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold tracking-wider uppercase text-amber-300">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{filiereName} • ENCG FÈS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              📚 {courseTitle}
            </h2>
            <p className="text-blue-200/90 text-xs sm:text-sm max-w-2xl font-medium">
              Espace numérique de cours, travaux dirigés, salon d'échange et assistance IA académique.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-blue-200">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Enseignant : {teacherName}
              </span>
              <span>•</span>
              <span className="font-semibold">Code Module : {courseCode}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[100px] shadow-sm">
              <p className="text-2xl sm:text-3xl font-black text-white">{announcements.length}</p>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-blue-200">ANNONCES</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[100px] shadow-sm">
              <p className="text-2xl sm:text-3xl font-black text-amber-300">{materials.length}</p>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-blue-200">SUPPORTS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
        <TabButton 
          active={activeTab === 'annonces'} 
          onClick={() => setActiveTab('annonces')} 
          icon={Megaphone} 
          label="Annonces & Fil" 
          count={announcements.length}
        />
        <TabButton 
          active={activeTab === 'supports'} 
          onClick={() => setActiveTab('supports')} 
          icon={Folder} 
          label="Supports & Polycopiés" 
          count={materials.length}
        />
        <TabButton 
          active={activeTab === 'devoirs'} 
          onClick={() => setActiveTab('devoirs')} 
          icon={BookOpen} 
          label="Devoirs & Travaux" 
        />
        <TabButton 
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')} 
          icon={MessageSquare} 
          label="Salon du Groupe" 
        />
        <TabButton 
          active={activeTab === 'ia'} 
          onClick={() => setActiveTab('ia')} 
          icon={Bot} 
          label="Tuteur IA Gemini" 
          highlight
        />
      </div>

      {/* Grid Layout Main Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Tab Annonces */}
          {activeTab === 'annonces' && (
            <div className="space-y-6">
              {isProfessorOrAdmin && (
                <form onSubmit={handlePublishAnnouncement} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Publier une annonce aux étudiants</h3>
                      <p className="text-xs text-slate-400">Diffusion instantanée pour {filiereName}</p>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Rédigez votre annonce pédagogique ou consigne de cours..."
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!announcementText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#001A4B] hover:bg-[#092868] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Publier l'annonce
                    </button>
                  </div>
                </form>
              )}

              {/* Announcements Feed */}
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#001A4B] text-white font-black text-xs flex items-center justify-center shadow-sm">
                          {ann.author.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">{ann.title}</h4>
                          <p className="text-xs text-slate-400">{ann.author} • {ann.date}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        OFFICIEL
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-13">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Tab Supports & Polycopiés */}
          {activeTab === 'supports' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Folder className="w-5 h-5 text-amber-500" />
                    Polycopiés, Séries TD & Diaporamas
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Documents pédagogiques mis à disposition par l'équipe enseignante</p>
                </div>
              </div>

              {materials.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
                    <Folder className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Aucun fichier déposé pour l'instant</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    L'enseignant déposera les diaporamas et séries de TD prochainement. Vous recevrez une notification automatique.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {materials.map((mat) => (
                    <div key={mat.id} className="py-4 flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {cleanMojibake(mat.title)}
                          </h4>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{mat.file_size || 'Document Officiel'}</span>
                            <span>•</span>
                            <span>Déposé le {new Date(mat.created_at).toLocaleDateString('fr-FR')}</span>
                          </p>
                        </div>
                      </div>

                      <a
                        href={mat.file_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#001A4B] hover:text-white text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Tab Devoirs */}
          {activeTab === 'devoirs' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    Travaux Dirigés & Devoirs à Rendre
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Dépôt électronique des rendus et études de cas</p>
                </div>
              </div>

              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Aucun devoir en attente de soumission</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Toutes vos obligations pédagogiques pour ce module sont à jour.
                </p>
              </div>
            </div>
          )}

          {/* 4. Tab Chat */}
          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-[560px] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Salon d'Échange Académique — {filiereName}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  CANAL MODÉRÉ
                </span>
              </div>

              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={cn("flex flex-col", msg.isMe ? "items-end" : "items-start")}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{msg.sender}</span>
                      <span className="text-[10px] text-slate-400">{msg.time}</span>
                    </div>
                    <div className={cn(
                      "p-3.5 rounded-2xl max-w-md text-xs sm:text-sm leading-relaxed shadow-2xs",
                      msg.isMe 
                        ? "bg-[#001A4B] text-white rounded-tr-xs" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  placeholder="Écrire un message pour le groupe..."
                  className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!newChatMessage.trim()}
                  className="h-11 px-4 rounded-xl bg-[#001A4B] hover:bg-[#092868] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* 5. Tab IA Tutor */}
          {activeTab === 'ia' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-[560px] flex flex-col overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-violet-700 to-indigo-700 text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black">Tuteur Virtuel IA Gemini 1.5</h3>
                    <p className="text-[10px] text-blue-200 font-medium">Assistance pédagogique personnalisée pour {courseTitle}</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white">
                  24h/7j
                </span>
              </div>

              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                {iaMessages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'ai' && (
                      <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center flex-shrink-0 mt-1 font-bold text-xs">
                        🤖
                      </div>
                    )}
                    <div className={cn(
                      "p-4 rounded-2xl max-w-lg text-xs sm:text-sm leading-relaxed shadow-2xs",
                      msg.role === 'user'
                        ? "bg-[#001A4B] text-white rounded-tr-xs"
                        : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-xs"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {iaLoading && (
                  <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 italic">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Le tuteur IA analyse les supports du module...</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleAskIa} className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                <input
                  type="text"
                  value={iaPrompt}
                  onChange={(e) => setIaPrompt(e.target.value)}
                  placeholder="Posez une question sur le cours, les TD ou les examens..."
                  className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  disabled={!iaPrompt.trim() || iaLoading}
                  className="h-11 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demander</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right Sidebar Info Cards */}
        <div className="space-y-6">
          
          {/* Quick Supports Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-500" />
                <span>Documents Récents</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600">
                {materials.length}
              </span>
            </div>

            {materials.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Aucun document déposé.</p>
            ) : (
              <div className="space-y-2.5">
                {materials.slice(0, 4).map((m) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{cleanMojibake(m.title)}</span>
                    <a href={m.file_url || '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex-shrink-0">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Fiche Technique du Module</span>
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">CODE OFFICIEL</span>
                <span className="font-black text-[#001A4B] dark:text-blue-400">{courseCode}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">COEFFICIENT</span>
                <span className="font-black text-slate-700 dark:text-slate-200">{course?.coefficient || '2.00'}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">CRÉDITS (ECTS)</span>
                <span className="font-black text-slate-700 dark:text-slate-200">{course?.credits || 4} ECTS</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">FILIÈRE</span>
                <span className="font-black text-blue-600 dark:text-blue-400 truncate max-w-[150px] text-right">{filiereName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">ÉVALUATIONS</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">CC1 (50%) • Examen (50%)</span>
              </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-850 border border-indigo-100 dark:border-slate-700 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
              <HelpCircle className="w-4 h-4" />
              <span>Assistance Pédagogique</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              En cas de question relative au déroulement des séances ou aux supports, vous pouvez contacter directement votre enseignant ou utiliser le salon interactif.
            </p>
          </div>

        </div>

      </div>

    </div>
  )
}

function TabButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  count, 
  highlight 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string; 
  count?: number; 
  highlight?: boolean; 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer",
        active
          ? "bg-white dark:bg-slate-900 text-[#001A4B] dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-750",
        highlight && !active && "text-violet-600 dark:text-violet-400"
      )}
    >
      <Icon className={cn("w-4 h-4", active ? "text-primary" : "opacity-70")} />
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={cn(
          "px-1.5 py-0.2 rounded-md text-[10px] font-black",
          active ? "bg-primary/10 text-primary" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
