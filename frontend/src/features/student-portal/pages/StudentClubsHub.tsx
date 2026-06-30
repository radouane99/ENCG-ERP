import React from 'react';
import { Users, Calendar, Megaphone, Plus, ChevronRight, Heart, MessageCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function StudentClubsHub() {
  const clubs = [
    { name: 'Club Marketing ENCG', members: 124, active: true, color: 'bg-rose-500' },
    { name: 'Enactus ENCG', members: 89, active: true, color: 'bg-yellow-500' },
    { name: 'Club IT & Innovation', members: 56, active: true, color: 'bg-blue-500' },
    { name: 'Bureau Des Étudiants', members: 15, active: true, color: 'bg-purple-500' },
  ];

  const posts = [
    {
      author: 'BDE ENCG',
      avatar: 'bg-purple-500',
      time: 'Il y a 2 heures',
      content: 'Le grand Gala annuel de l\'ENCG approche ! ðŸŽ­ Préparez-vous pour une soirée inoubliable le 15 Juillet. Les billets seront disponibles demain Ã  la pause.',
      likes: 45,
      comments: 12,
    },
    {
      author: 'Club IT & Innovation',
      avatar: 'bg-blue-500',
      time: 'Il y a 5 heures',
      content: 'Hackathon ENCG Edition 2026 ! ðŸš€ Vous avez une idée de startup ? Montez votre équipe de 3 Ã  5 personnes et rejoignez-nous ce week-end au Lab 4.',
      likes: 89,
      comments: 34,
      image: 'bg-gradient-to-tr from-blue-600 to-indigo-400',
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#001A4B] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-xl border border-[#003a8c]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e6007e]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-sm border border-white/20">
              <Users className="w-3.5 h-3.5" /> Vie Associative ENCG
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Clubs & Événements</h1>
            <p className="text-blue-200 text-lg max-w-2xl">
              Plongez au cÅ“ur de la vie étudiante, rejoignez des clubs passionnants et participez aux événements de votre campus.
            </p>
          </div>
          <button className="shrink-0 bg-[#e6007e] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#c4006c] transition-colors shadow-lg flex items-center gap-2">
            <Plus className="w-5 h-5" /> Créer un Club
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Clubs List */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-[#001A4B] uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" /> Annuaire des Clubs
              </h3>
            </div>
            
            <div className="space-y-4">
              {clubs.map((club, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl shadow-inner flex items-center justify-center text-white font-bold", club.color)}>
                      {club.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm group-hover:text-[#003a8c] transition-colors">{club.name}</h4>
                      <p className="text-xs text-white/50 font-medium">{club.members} membres</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#e6007e] transition-colors" />
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 bg-blue-50 text-[#003a8c] py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors">
              Voir tous les clubs
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#e6007e] to-[#ff66b2] rounded-2xl p-6 shadow-md text-white text-center">
            <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-90" />
            <h3 className="font-black text-lg mb-2">Appel Ã  candidatures !</h3>
            <p className="text-sm text-pink-100 mb-4 font-medium">Le BDE recrute de nouveaux membres pour le pôle communication.</p>
            <button className="bg-white text-[#e6007e] w-full py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-pink-50 transition-colors">
              Postuler au BDE
            </button>
          </div>
        </div>

        {/* Right Col: Feed */}
        <div className="md:col-span-2 space-y-6">
          
          {/* New Post Input */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
            <input 
              type="text" 
              placeholder="Partager une actualité avec les étudiants de l'ENCG..." 
              className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>

          {/* Feed Posts */}
          <div className="space-y-6">
            {posts.map((post, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] p-6 shadow-sm border border-white/5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold", post.avatar)}>
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{post.author}</h4>
                      <p className="text-xs text-white/50 font-medium">{post.time}</p>
                    </div>
                  </div>
                </div>

                <p className="text-white/80 leading-relaxed mb-4">
                  {post.content}
                </p>

                {post.image && (
                  <div className={cn("w-full h-48 rounded-xl mb-4 flex items-center justify-center text-white/50", post.image)}>
                    [Image Événement]
                  </div>
                )}

                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                  <button className="flex items-center gap-2 text-white/50 hover:text-rose-500 transition-colors font-medium text-sm">
                    <Heart className="w-5 h-5" /> {post.likes}
                  </button>
                  <button className="flex items-center gap-2 text-white/50 hover:text-blue-500 transition-colors font-medium text-sm">
                    <MessageCircle className="w-5 h-5" /> {post.comments} Commentaires
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
