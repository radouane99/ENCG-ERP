import React, { useState } from 'react';
import { BookOpen, Search, Filter, Book, Download, Clock, Star, PlayCircle, Heart } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function StudentDigitalLibrary() {
  const [activeTab, setActiveTab] = useState('RECOMMANDÉ'); // RECOMMANDÉ, EBOOKS, EMPRUNTS

  const recommendedBooks = [
    { title: 'Marketing Management', author: 'Philip Kotler', rating: 4.8, type: 'E-BOOK', cover: 'bg-indigo-600', recommendedBy: 'Pr. Radouane' },
    { title: 'Finance d\'Entreprise', author: 'Pierre Vernimmen', rating: 4.9, type: 'LIVRE PHYSIQUE', cover: 'bg-emerald-700', recommendedBy: 'Pr. Tazi' },
    { title: 'Data Science pour l\'Entreprise', author: 'Foster Provost', rating: 4.7, type: 'E-BOOK', cover: 'bg-purple-600', recommendedBy: 'Pr. Alaoui' },
    { title: 'Stratégie Océan Bleu', author: 'W. Chan Kim', rating: 4.9, type: 'AUDIOBOOK', cover: 'bg-blue-600', recommendedBy: 'Pr. Idrissi' },
  ];

  const borrowings = [
    { title: 'Comptabilité Générale', dueDate: 'Dans 3 jours', status: 'WARNING' },
    { title: 'Droit des Affaires', dueDate: 'Dans 12 jours', status: 'OK' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#001A4B] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-500/30">
              <BookOpen className="w-3.5 h-3.5" /> Médiathèque ENCG
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Bibliothèque Numérique</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Accédez instantanément Ã  des milliers d'ouvrages, e-books et cours magistraux recommandés par vos professeurs.
            </p>
          </div>

          <div className="w-full md:w-[400px] space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Mes Emprunts Actifs
              </h3>
              <div className="space-y-3">
                {borrowings.map((b, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm truncate pr-4">{b.title}</span>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                      b.status === 'WARNING' ? "bg-amber-500/20 text-amber-300 border border-amber-500/50" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                    )}>
                      {b.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 mt-8">
          <div className="relative max-w-2xl">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher un livre, un auteur, un ISBN..." 
              className="w-full bg-white/10 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#e6007e] focus:bg-white/15 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-white/10 overflow-x-auto custom-scrollbar pb-2">
        {['RECOMMANDÉ', 'EBOOKS & PDF', 'LIVRES PHYSIQUES', 'AUDIOBOOKS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 font-bold text-sm transition-colors whitespace-nowrap border-b-2",
              activeTab === tab 
                ? "text-[#001A4B] border-[#001A4B]" 
                : "text-white/50 border-transparent hover:text-white/90"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid of Books */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">Sélection pour vous</h2>
          <button className="flex items-center gap-2 text-sm font-bold text-white/50 hover:text-[#e6007e] transition-colors">
            <Filter className="w-4 h-4" /> Filtrer
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recommendedBooks.map((book, idx) => (
            <div key={idx} className="group relative">
              
              {/* Book Cover */}
              <div className={cn("aspect-[2/3] rounded-2xl shadow-md overflow-hidden relative mb-4 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl", book.cover)}>
                {/* Simulated Book Cover Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-white/90 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex justify-end">
                    <span className="bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-white/20">
                      {book.type}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-tight mb-1">{book.title}</h3>
                    <p className="text-xs font-medium text-white/70">{book.author}</p>
                  </div>
                </div>
                
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                  {book.type === 'E-BOOK' && (
                    <button className="bg-white text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/[0.05] transition-colors shadow-lg">
                      <BookOpen className="w-4 h-4" /> Lire
                    </button>
                  )}
                  {book.type === 'AUDIOBOOK' && (
                    <button className="bg-white text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/[0.05] transition-colors shadow-lg">
                      <PlayCircle className="w-4 h-4" /> Écouter
                    </button>
                  )}
                  {book.type === 'LIVRE PHYSIQUE' && (
                    <button className="bg-white text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/[0.05] transition-colors shadow-lg">
                      <Book className="w-4 h-4" /> Réserver
                    </button>
                  )}
                  <button className="text-white/80 hover:text-white flex items-center gap-2 text-xs font-bold transition-colors">
                    <Heart className="w-4 h-4" /> Ajouter aux favoris
                  </button>
                </div>
              </div>

              {/* Meta info below cover */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-bold text-white/80">{book.rating}</span>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                  Recommandé par {book.recommendedBy}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
