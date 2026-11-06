import { Coffee, Gift, Target, Flame, CheckCircle2, Lock, Printer, Shirt, Ticket, Zap } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';

export default function StudentGamification() {
  const { t } = useTranslation('students', { keyPrefix: 'rewards' });
  const { user } = useAuthStore();

  const rewards = [
    { title: t('coffee'), cost: 50, Icon: Coffee, available: true },
    { title: t('shirt'), cost: 500, Icon: Shirt, available: false },
    { title: t('ticket'), cost: 1000, Icon: Ticket, available: false },
    { title: t('print'), cost: 100, Icon: Printer, available: true },
  ];

  const quests = [
    { title: t('absence'), desc: t('absence_desc'), points: 100, progress: 80, completed: false },
    { title: t('library'), desc: t('library_desc'), points: 50, progress: 100, completed: true },
    { title: t('team'), desc: t('team_desc'), points: 75, progress: 100, completed: true },
    { title: t('excellence'), desc: t('excellence_desc'), points: 200, progress: 0, completed: false },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 md:p-8">
      <header className="space-y-2">
        <h1 className="erp-page-title">{t('heading')}</h1>
        <p className="text-sm text-muted-foreground">{t('demo')}</p>
      </header>
      
      {/* Header & Digital Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Digital ENCG Card */}
        <div className="md:col-span-1">
          <div className="w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-[#1a3673] via-[#003a8c] to-[#e6007e] p-6 text-white shadow-sm relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-transform">
            
            {/* Holographic effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-full group-hover:translate-x-full duration-1000"></div>
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div>
                <img src="/logo-encg.png" alt="ENCG" className="mb-2 h-8 rounded bg-white px-1.5 py-0.5 object-contain" />
                <div className="text-[8px] font-bold uppercase tracking-widest text-blue-200">{t('card')}</div>
              </div>
              <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>

            <div className="relative z-10">
              <div className="mb-1 text-sm font-bold text-blue-200">{t('balance')}</div>
              <div className="text-2xl font-bold text-yellow-400">{t('coins', { count: 250 })}</div>
            </div>

            <div className="flex justify-between items-end relative z-10">
              <div className="text-sm font-bold uppercase tracking-wider"><bdi>{user?.name || t('student')}</bdi></div>
              <div className="text-[10px] font-bold text-blue-200 bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                {t('level', { level: 4 })}
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="flex flex-col justify-center rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-8 md:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-card-foreground">
                {t('level', { level: 4 })} <Flame className="w-6 h-6 text-rose-500 fill-rose-500" />
              </h2>
              <p className="text-sm font-medium text-muted-foreground">{t('progress')}</p>
            </div>
            <div className="shrink-0 text-end">
              <div className="mb-1 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('rank')}</div>
              <div className="text-xl font-bold text-primary">{t('ranking')}</div>
            </div>
          </div>

          <div className="relative pt-4">
            <div className="mb-2 flex justify-between text-xs font-bold text-muted-foreground">
              <span>{t('level', { level: 4 })}</span>
              <span>{t('level', { level: 5 })}</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-muted shadow-inner">
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
            <Target className="size-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">{t('quests')}</h2>
          </div>
          
          <div className="space-y-4">
            {quests.map((quest, idx) => (
              <div key={idx} className={cn("rounded-2xl border bg-card p-4 shadow-sm sm:p-6", quest.completed ? "border-success/40" : "border-border")}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {quest.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <div className="size-6 shrink-0 rounded-full border-2 border-border"></div>
                    )}
                    <div>
                      <h3 className="font-bold text-card-foreground">{quest.title}</h3>
                      <p className="text-xs font-medium text-muted-foreground">{quest.desc}</p>
                    </div>
                  </div>
                  <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-yellow-200">
                    +{quest.points} <Zap className="w-3 h-3 fill-yellow-700" />
                  </div>
                </div>

                {!quest.completed && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${quest.progress}%` }}></div>
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
              <h2 className="text-xl font-bold text-foreground">{t('shop')}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {rewards.map((reward, idx) => (
              <div key={idx} className={cn(
                "flex flex-col items-center justify-center rounded-2xl border p-3 text-center sm:p-6",
                reward.available ? "border-primary/20 bg-card" : "border-border bg-muted/40"
              )}>
                <reward.Icon aria-hidden="true" className="mb-4 size-8 text-primary" />
                <h3 className="mb-2 text-sm font-bold text-foreground">{reward.title}</h3>
                <div className="mt-auto">
                  {reward.available ? (
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-yellow-200">
                      {t('coins', { count: reward.cost })}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                      <Lock className="w-3 h-3" /> {t('coins', { count: reward.cost })}
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
