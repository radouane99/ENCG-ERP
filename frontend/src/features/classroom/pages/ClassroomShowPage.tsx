import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Megaphone, BookOpen, MessageSquare, Bot, Folder, Book, FileText, Send, Calendar as CalendarIcon, FileUp, Info } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function ClassroomShowPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState<'annonces' | 'devoirs' | 'chat' | 'ia'>('annonces')

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/classroom" className="flex items-center gap-1 text-[10px] font-bold text-[#0f2863] uppercase tracking-wider hover:underline">
          <ChevronLeft className="w-3 h-3" />
          CLASSROOM
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-lg font-bold text-slate-800">
          Introduction - Génie Informatique <span className="text-blue-600">Génie Informatique - Groupe 1</span>
        </h1>
      </div>

      <div className="bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#9d174d] rounded-[2rem] p-10 text-white shadow-lg relative overflow-hidden mb-8 flex justify-between items-center">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2">GÉNIE INFORMATIQUE - GROUPE 1 • GÉNIE INFORMATIQUE</p>
          <h2 className="text-4xl font-bold mb-2 flex items-center gap-3 italic">
            📚 Introduction - Génie Informatique
          </h2>
          <p className="text-white/80 text-sm">
            Espace d'échange et d'évaluation académique de votre classe.
          </p>
        </div>
        <div className="relative z-10 flex gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[100px]">
            <p className="text-3xl font-bold mb-1">0</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">PUBLICATIONS</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[100px]">
            <p className="text-3xl font-bold mb-1">0</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">DEVOIRS</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <TabButton active={activeTab === 'annonces'} onClick={() => setActiveTab('annonces')} icon={Megaphone} label="Annonces & Cours" color="amber" />
        <TabButton active={activeTab === 'devoirs'} onClick={() => setActiveTab('devoirs')} icon={BookOpen} label="Devoirs & Soumissions" color="emerald" />
        <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={MessageSquare} label="Salon de Discussion" color="purple" />
        <TabButton active={activeTab === 'ia'} onClick={() => setActiveTab('ia')} icon={Bot} label="Tuteur IA" color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'annonces' && <AnnoncesTab />}
          {activeTab === 'devoirs' && <DevoirsTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'ia' && <IaTab />}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 italic flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-500" />
                Supports de Cours
              </h3>
              <span className="w-6 h-6 rounded-full bg-slate-100 text-blue-600 text-[10px] font-bold flex items-center justify-center">0</span>
            </div>
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 mb-3 rounded-full bg-blue-50 flex items-center justify-center text-xl">📬</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider italic">AUCUN SUPPORT DÉPOSÉ</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 italic flex items-center gap-2 mb-6">
              <Info className="w-5 h-5 text-blue-500" />
              Infos du Module
            </h3>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">CODE</span>
                <span className="font-bold text-[#0f2863]">INF-101</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">COEFFICIENT</span>
                <span className="font-bold text-slate-700">2.00</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">GROUPE</span>
                <span className="font-bold text-slate-700">Génie Informatique - Groupe 1</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">FILIÈRE</span>
                <span className="font-bold text-blue-600">Génie Informatique</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label, color }: any) {
  const colorMap: any = {
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    purple: "text-purple-500",
    blue: "text-blue-500"
  }
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold transition-all",
        active 
          ? "bg-white text-[#0f2863] shadow-sm border border-slate-200 shadow-blue-500/10" 
          : "text-slate-500 hover:bg-white hover:text-slate-700 border border-transparent"
      )}
    >
      <Icon className={cn("w-4 h-4", active ? colorMap[color] : "opacity-50")} />
      {label}
    </button>
  )
}

function AnnoncesTab() {
  return (
    <>
      <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-2xl flex items-center justify-center shrink-0">
            📣
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 italic">Publier dans le Classroom</h3>
            <p className="text-xs text-slate-500">Partagez des cours ou annonces pour Génie Informatique - Groupe 1</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-1 rounded-xl w-full max-w-sm">
          <button className="flex-1 bg-[#0f2863] text-white rounded-lg py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" /> Annonce
          </button>
          <button className="flex-1 text-slate-500 hover:text-slate-700 rounded-lg py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
            <Book className="w-4 h-4" /> Support de Cours
          </button>
        </div>

        <textarea 
          placeholder="Rédigez votre annonce ou message pour les étudiants..."
          className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm resize-none mb-4"
        ></textarea>

        <div className="border border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-center gap-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors mb-6 text-center">
          <Folder className="w-6 h-6 text-amber-500" />
          <div className="text-left">
            <p className="text-xs font-bold text-slate-600">Cliquez pour déposer un fichier</p>
            <p className="text-[10px] text-slate-400">PDF, PowerPoint, Word, ZIP — max 20 Mo</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded text-[#0f2863] focus:ring-[#0f2863] w-4 h-4 border-slate-300" />
            <span className="text-xs text-slate-500">Notifier les étudiants de ce groupe</span>
          </label>
          <button className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
            PUBLIER L'ANNONCE
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="text-4xl mb-4">📣</div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">Aucune annonce pour le moment</h3>
        <p className="text-xs text-slate-400">L'enseignant n'a pas encore publié d'annonces ou de cours.</p>
      </div>
    </>
  )
}

function DevoirsTab() {
  return (
    <>
      <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-2xl flex items-center justify-center shrink-0">
            📅
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 italic">Publier un Nouveau Devoir</h3>
            <p className="text-xs text-slate-500">Fixez une date limite et fournissez les consignes de travail</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">TITRE DU DEVOIR</label>
            <input 
              type="text" 
              placeholder="Ex: Devoir de Programmation N°1" 
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">DATE & HEURE LIMITE (DEADLINE)</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="jj/mm/aaaa --:--" 
                className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
              />
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">INSTRUCTIONS & BARÈME</label>
          <textarea 
            placeholder="Détaillez le travail à accomplir..."
            className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm resize-none"
          ></textarea>
        </div>

        <div className="mb-6">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">FICHIER DE CONSIGNE (OPTIONNEL)</label>
          <div className="border border-dashed border-slate-300 rounded-xl p-4 flex items-center gap-4 bg-slate-50">
            <button className="bg-white border border-slate-200 px-4 py-1.5 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Choisir un fichier
            </button>
            <span className="text-xs text-slate-400">Aucun fichier n'a été sélectionné</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
            PUBLIER LE DEVOIR
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">Aucun devoir publié</h3>
        <p className="text-xs text-slate-400">Les travaux et devoirs s'afficheront ici au fur et à mesure.</p>
      </div>
    </>
  )
}

function ChatTab() {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm h-[600px] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Salon de Discussion Interactif
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          GÉNIE INFORMATIQUE - GROUPE 1
        </span>
      </div>
      
      <div className="flex-1 bg-white p-6 overflow-y-auto">
        {/* Chat messages would go here */}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
          <FileUp className="w-5 h-5" />
        </button>
        <input 
          type="text" 
          placeholder="Écrire un message en temps réel..."
          className="flex-1 h-12 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
        />
        <button className="w-12 h-12 rounded-xl bg-[#0f2863] hover:bg-[#1a387e] text-white flex items-center justify-center transition-colors shadow-sm">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

function IaTab() {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm h-[600px] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/20 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
          🤖
        </div>
        <div>
          <h3 className="text-sm font-bold">Tuteur Virtuel du Module</h3>
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">RÉPOND UNIQUEMENT SUR BASE DES SUPPORTS DE COURS</p>
        </div>
      </div>
      
      <div className="flex-1 bg-slate-50 p-6 overflow-y-auto space-y-6">
        <div className="flex gap-4 max-w-[85%]">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-sm border border-slate-100">
            🤖
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm text-sm text-slate-700 shadow-sm">
            Bonjour ! Je suis l'assistant IA pour ce module. J'ai lu tous les supports PDF déposés par le professeur. Pose-moi une question sur le cours !
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
        <input 
          type="text" 
          placeholder="Poser une question sur le cours..."
          className="flex-1 h-12 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
        />
        <button className="h-12 px-6 rounded-xl bg-[#0f2863] hover:bg-[#1a387e] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm">
          ENVOYER
        </button>
      </div>
    </div>
  )
}
