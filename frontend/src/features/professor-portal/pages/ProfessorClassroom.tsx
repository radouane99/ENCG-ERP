import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@shared/lib/api';
import { 
  ChevronLeft, 
  BookOpen, 
  Megaphone, 
  Paperclip, 
  MessageCircle, 
  Bot, 
  Folder, 
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function ProfessorClassroom() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  const { moduleId } = useParams();
  const [activeTab, setActiveTab] = useState<'annonces' | 'devoirs' | 'discussion' | 'ia'>('annonces');
  const [annonceType, setAnnonceType] = useState<'annonce' | 'support'>('annonce');

  const [course, setCourse] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // IA State
  const [qcmTopic, setQcmTopic] = useState('');
  const [qcmCount, setQcmCount] = useState(5);
  const [isGeneratingQcm, setIsGeneratingQcm] = useState(false);
  const [generatedQcm, setGeneratedQcm] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/lms/courses/${moduleId}`);
        setCourse(res.data.module);
        setMaterials(res.data.materials);
      } catch (error) {
        console.error('Failed to fetch course details:', error);
      }
    };
    if (moduleId) fetchCourse();
  }, [moduleId]);

  if (!course) {
    return <div className="p-8 text-center">Chargement de la classe...</div>;
  }

  const handlePublish = async () => {
    if (!title) return alert("Veuillez saisir un titre");
    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', annonceType === 'support' ? 'document' : 'link'); // simple mapping
      if (file) {
        formData.append('file', file);
      }

      const res = await api.post(`/lms/courses/${moduleId}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMaterials([res.data.data, ...materials]);
      setTitle('');
      setDescription('');
      setFile(null);
      alert("Publié avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la publication");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerateQcm = async () => {
    if (!qcmTopic) return alert("Veuillez saisir un sujet");
    setIsGeneratingQcm(true);
    setGeneratedQcm(null);
    try {
      const res = await api.post('/professor/ai/generate-qcm', {
        topic: qcmTopic,
        count: qcmCount
      });
      setGeneratedQcm(res.data.data);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la génération du QCM");
    } finally {
      setIsGeneratingQcm(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm font-bold text-[#003a8c]">
        <Link to="/dashboard" className="flex items-center gap-1 hover:underline">
          <ChevronLeft className="w-4 h-4" /> CLASSROOM
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-white/90">Introduction - Génie Informatique</span>
        <span className="text-gray-400">Â·</span>
        <span className="text-blue-600">Génie Informatique - Groupe 1</span>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-[#001A4B] via-indigo-800 to-purple-800 rounded-3xl p-8 text-white flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/20">
              {course.code}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
            📚 {course.title}
          </h1>
          <p className="text-blue-100 text-sm">
            Espace d'échange et d'évaluation académique de votre classe.
          </p>
        </div>
        
        <div className="relative z-10 flex gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[100px] shadow-lg">
            <div className="text-3xl font-black mb-1">{materials.length}</div>
            <div className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">Publications</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[100px] shadow-lg">
            <div className="text-3xl font-black mb-1">0</div>
            <div className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">Devoirs</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-2">
        <button 
          onClick={() => setActiveTab('annonces')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all",
            activeTab === 'annonces' ? "bg-white text-orange-500 shadow-md border border-white/5" : "text-white/50 hover:bg-white hover:text-white/90"
          )}
        >
          <Megaphone className="w-4 h-4" /> Annonces & Cours
        </button>
        <button 
          onClick={() => setActiveTab('devoirs')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all",
            activeTab === 'devoirs' ? "bg-white text-emerald-600 shadow-md border border-white/5" : "text-white/50 hover:bg-white hover:text-white/90"
          )}
        >
          <BookOpen className="w-4 h-4" /> Devoirs & Soumissions
        </button>
        <button 
          onClick={() => setActiveTab('discussion')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all",
            activeTab === 'discussion' ? "bg-white text-blue-600 shadow-md border border-white/5" : "text-white/50 hover:bg-white hover:text-white/90"
          )}
        >
          <MessageCircle className="w-4 h-4" /> Salon de discussion
        </button>
        <button 
          onClick={() => setActiveTab('ia')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all",
            activeTab === 'ia' ? "bg-white text-purple-600 shadow-md border border-white/5" : "text-white/50 hover:bg-white hover:text-white/90"
          )}
        >
          <Bot className="w-4 h-4" /> Tuteur IA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'annonces' && (
            <>
              {/* Publisher Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Publier dans le Classroom</h2>
                    <p className="text-xs text-white/50">Partagez des cours ou annonces pour Génie Informatique - Groupe 1</p>
                  </div>
                </div>

                <div className="flex bg-white/[0.02] rounded-xl p-1 mb-6">
                  <button 
                    onClick={() => setAnnonceType('annonce')}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                      annonceType === 'annonce' ? "bg-[#003a8c] text-white shadow-md" : "text-white/50 hover:bg-gray-200"
                    )}
                  >
                    <Megaphone className="w-3 h-3" /> Annonce
                  </button>
                  <button 
                    onClick={() => setAnnonceType('support')}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                      annonceType === 'support' ? "bg-[#003a8c] text-white shadow-md" : "text-white/50 hover:bg-gray-200"
                    )}
                  >
                    <Paperclip className="w-3 h-3" /> Support de Cours
                  </button>
                </div>

                <input 
                  type="text"
                  placeholder="Titre de l'annonce ou du support..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-4 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#003a8c] mb-4"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <textarea 
                  rows={4}
                  placeholder="Rédigez votre annonce ou description du support..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#003a8c] resize-none mb-4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>

                <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer mb-6">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center gap-3">
                    <Folder className="w-6 h-6 text-amber-400" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-black/80">
                        {file ? file.name : "Cliquez pour déposer un fichier"}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">PDF, PowerPoint, Word, ZIP — max 50 Mo</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-white/50 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#003a8c] focus:ring-[#003a8c]" />
                    Notifier les étudiants de ce groupe
                  </label>
                  <button 
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="bg-[#003a8c] hover:bg-[#002a66] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-blue-900/20"
                  >
                    {isPublishing ? "Publication..." : "Publier"}
                  </button>
                </div>
              </div>

              {materials.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 shadow-sm border border-white/5 flex flex-col items-center justify-center text-center">
                  <Megaphone className="w-12 h-12 text-orange-300 mb-4" />
                  <h3 className="text-lg font-black text-black/90 mb-2">Aucune annonce pour le moment</h3>
                  <p className="text-sm text-black/50">Vous n'avez pas encore publié d'annonces ou de cours.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {materials.map((mat) => (
                    <div key={mat.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        {mat.type === 'document' ? <BookOpen className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-bold text-gray-900">{mat.title}</h3>
                          <span className="text-xs text-gray-400">{new Date(mat.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{mat.description}</p>
                        {mat.file_path && (
                          <a 
                            href={`${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')}/storage/${mat.file_path}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-[#0f2863] text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                          >
                            <Paperclip className="w-4 h-4" /> Télécharger la pièce jointe
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'devoirs' && (
            <>
              {/* Devoir Publisher Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Publier un Nouveau Devoir</h2>
                    <p className="text-xs text-white/50">Fixez une date limite et fournissez les consignes de travail</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Titre du devoir</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Devoir de Programmation NÂ°1"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#003a8c] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date & Heure Limite (Deadline)</label>
                    <input 
                      type="datetime-local" 
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#003a8c] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Instructions & Barème</label>
                  <textarea 
                    rows={4}
                    placeholder="Détaillez le travail Ã  accomplir..."
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm font-medium text-white/80 focus:outline-none focus:ring-2 focus:ring-[#003a8c] focus:bg-white resize-none"
                  ></textarea>
                </div>

                <div className="space-y-2 mb-8">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fichier de consigne (Optionnel)</label>
                  <div className="border border-dashed border-white/10 rounded-xl p-3 flex items-center bg-white/[0.02]">
                    <input type="file" className="text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-white/80 hover:file:bg-gray-300" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="bg-[#003a8c] hover:bg-[#002a66] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-blue-900/20">
                    Publier Le Devoir
                  </button>
                </div>
              </div>

              {/* Empty State Devoirs */}
              <div className="bg-white rounded-3xl p-12 shadow-sm border border-white/5 flex flex-col items-center justify-center text-center">
                <BookOpen className="w-12 h-12 text-emerald-300 mb-4" />
                <h3 className="text-lg font-black text-white/90 mb-2">Aucun devoir en cours</h3>
                <p className="text-sm text-white/50">Créez un devoir pour évaluer vos étudiants.</p>
              </div>
            </>
          )}

          {activeTab === 'ia' && (
            <>
              {/* IA QCM Generator Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Générateur de QCM par IA</h2>
                    <p className="text-xs text-gray-500">Utilisez Gemini pour créer des évaluations automatiquement</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sujet du QCM</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Les principes de la comptabilité générale..."
                      value={qcmTopic}
                      onChange={(e) => setQcmTopic(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre de questions</label>
                    <input 
                      type="number" 
                      min="1" max="20"
                      value={qcmCount}
                      onChange={(e) => setQcmCount(parseInt(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end mb-8">
                  <button 
                    onClick={handleGenerateQcm}
                    disabled={isGeneratingQcm}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-purple-900/20"
                  >
                    {isGeneratingQcm ? "Génération en cours..." : "Générer le QCM"}
                  </button>
                </div>

                {/* Generated QCM Display */}
                {generatedQcm && (
                  <div className="mt-8 space-y-4 border-t border-gray-100 pt-6">
                    <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-yellow-500" /> Résultat de la génération
                    </h3>
                    
                    {generatedQcm.map((q, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                        <p className="font-bold text-sm text-gray-900 mb-3">{idx + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className={`px-3 py-2 rounded-lg text-xs font-medium border ${oIdx === q.correct_index ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-white border-gray-200 text-gray-600'}`}>
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-end pt-4">
                      <button className="bg-[#003a8c] hover:bg-[#002a66] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-blue-900/20">
                        Enregistrer comme Devoir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Supports Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-500" /> Supports de Cours
              </h3>
              <span className="bg-indigo-50 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">0</span>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-white/[0.02] rounded-full flex items-center justify-center mb-3">
                <Paperclip className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Aucun support déposé</p>
            </div>
          </div>

          {/* Module Info */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
            <h3 className="text-sm font-black text-[#003a8c] flex items-center gap-2 mb-6">
              <Info className="w-4 h-4" /> Infos du Module
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Code</span>
                <span className="text-xs font-bold text-white">INF-101</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coefficient</span>
                <span className="text-xs font-bold text-white">2.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Groupe</span>
                <span className="text-xs font-bold text-white">Génie Informatique - Groupe 1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filière</span>
                <span className="text-xs font-bold text-blue-600">Génie Informatique</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
