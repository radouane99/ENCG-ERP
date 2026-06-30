import React from 'react';
import { Trophy, Gift, Target, Flame, ChevronRight, CheckCircle2, Lock, Zap } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@/stores/authStore';

export default function StudentGamification() {
  const { user } = useAuthStore();

  const rewards = [
    { title: 'Café gratuit (Cafétéria)', cost: 50, icon: 'â˜•', available: true },
    { title: 'Sweat Ã  capuche ENCG', cost: 500, icon: 'ðŸ‘•', available: false },
    { title: 'Place VIP Gala Annuel', cost: 1000, icon: 'ðŸŽ­', available: false },
    { title: 'Impression 100 pages', cost: 100, icon: 'ðŸ–¨ï¸', available: true },
  ];

  const quests = [
    { title: 'Zéro Absence', desc: 'Aucune absence ce mois-ci', points: 100, progress: 80, completed: false },
    { title: 'Rat de Bibliothèque', desc: 'Emprunter 5 livres', points: 50, progress: 100, completed: true },
    { title: 'Esprit d\'Équipe', desc: 'Rejoindre 2 clubs', points: 75, progress: 100, completed: true },
    { title: 'Excellence', desc: 'Valider un module > 16/20', points: 200, progress: 0, completed: false },
  ];

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header & Digital Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Digital ENCG Card */}
        <div className="md:col-span-1">
          <div className="w-full aspect-[1.586/1] rounded-[2rem] bg-gradient-to-br from-[#001A4B] via-[#003a8c] to-[#e6007e] p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-transform">
            
            {/* Holographic effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-full group-hover:translate-x-full duration-1000"></div>
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div>
                <img src="/logo-encg.png" alt="ENCG" className="h-8 object-contain mb-2 brightness-0 invert" />
                <div className="text-[8px] font-black uppercase tracking-widest text-blue-200">CARTE PRIVILÈGE</div>
              </div>
              <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>

            <div className="relative z-10">
              <div className="text-sm font-bold text-blue-200 mb-1">Solde Actuel</div>
              <div className="text-4xl font-black flex items-baseline gap-2">
                250 <span className="text-xl font-bold text-yellow-400">ENCG Coins</span>
              </div>
            </div>

            <div className="flex justify-between items-end relative z-10">
              <div className="text-sm font-bold uppercase tracking-wider">{user?.name || 'ANISS EL ALAOUI'}</div>
              <div className="text-[10px] font-bold text-blue-200 bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                NIVEAU 4
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="md:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-white/5 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                Niveau 4 <Flame className="w-6 h-6 text-rose-500 fill-rose-500" />
              </h2>
              <p className="text-white/50 text-sm font-medium">Encore 50 Coins pour atteindre le Niveau 5 !</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">RANG</div>
              <div className="text-xl font-black text-[#003a8c]">Top 15%</div>
            </div>
          </div>

          <div className="relative pt-4">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
              <span>Niveau 4</span>
              <span>Niveau 5</span>
            </div>
            <div className="w-full bg-white/[0.05] rounded-full h-4 overflow-hidden shadow-inner">
              <div className="bg-gradient-to-r from-rose-400 to-rose-600 h-full rounded-full w-[83%] relative">
                <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Quests / Missions */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-[#003a8c]" />
            <h3 className="text-xl font-black text-white">Missions Actuelles</h3>
          </div>
          
          <div className="space-y-4">
            {quests.map((quest, idx) => (
              <div key={idx} className={cn("bg-white rounded-2xl p-6 border transition-all", quest.completed ? "border-emerald-200 shadow-sm" : "border-white/5 shadow-sm")}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {quest.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-white/10"></div>
                    )}
                    <div>
                      <h4 className={cn("font-bold", quest.completed ? "text-emerald-700" : "text-white")}>{quest.title}</h4>
                      <p className="text-xs text-white/50 font-medium">{quest.desc}</p>
                    </div>
                  </div>
                  <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 border border-yellow-200">
                    +{quest.points} <Zap className="w-3 h-3 fill-yellow-700" />
                  </div>
                </div>

                {!quest.completed && (
                  <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#003a8c] h-full rounded-full" style={{ width: `${quest.progress}%` }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rewards Catalog */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-[#e6007e]" />
              <h3 className="text-xl font-black text-white">Boutique ENCG</h3>
            </div>
            <button className="text-[#003a8c] text-sm font-bold hover:underline">Voir tout</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {rewards.map((reward, idx) => (
              <div key={idx} className={cn(
                "rounded-2xl p-6 border flex flex-col items-center justify-center text-center transition-all",
                reward.available ? "bg-white border-blue-100 hover:shadow-md hover:border-blue-300 cursor-pointer" : "bg-white/[0.02] border-white/5 opacity-70 grayscale"
              )}>
                <div className="text-4xl mb-4">{reward.icon}</div>
                <h4 className="font-bold text-white text-sm mb-2">{reward.title}</h4>
                <div className="mt-auto">
                  {reward.available ? (
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1 border border-yellow-200">
                      {reward.cost} Coins
                    </span>
                  ) : (
                    <span className="bg-gray-200 text-white/50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" /> {reward.cost} Coins
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
