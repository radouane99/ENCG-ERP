import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import api from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';

export function ActivityTimeline() {
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['activity-timeline'],
    queryFn: () => api.get('/dashboard/timeline').then(res => res.data.data.data),
  });

  const getEventDetails = (description: string, subjectType: string) => {
    const type = subjectType.split('\\').pop() || 'Entité';
    switch (description) {
      case 'created':
        return { icon: <Plus className="w-4 h-4 text-emerald-500" />, text: `Création de ${type}`, color: 'bg-emerald-500/10 border-emerald-500/20' };
      case 'updated':
        return { icon: <Edit2 className="w-4 h-4 text-blue-500" />, text: `Mise Ã  jour de ${type}`, color: 'bg-blue-500/10 border-blue-500/20' };
      case 'deleted':
        return { icon: <Trash2 className="w-4 h-4 text-red-500" />, text: `Suppression de ${type}`, color: 'bg-red-500/10 border-red-500/20' };
      default:
        return { icon: <Activity className="w-4 h-4 text-primary" />, text: `Action sur ${type}`, color: 'bg-primary/10 border-primary/20' };
    }
  };

  const getRoleBadge = (roles: any[]) => {
    if (!roles || roles.length === 0) return null;
    const role = roles[0].name;
    if (role === 'admin') return <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-600 font-bold uppercase">Admin</span>;
    if (role === 'professor') return <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-600 font-bold uppercase">Prof</span>;
    return <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-500/10 text-slate-600 font-bold uppercase">Étudiant</span>;
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[300px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Fil d'Activité
        </h3>
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          Audit Log
        </span>
      </div>

      <div className="relative border-l-2 border-border/50 ml-4 space-y-8 pb-4">
        {timelineData?.map((item: any) => {
          const details = getEventDetails(item.description, item.subject_type);
          return (
            <div key={item.id} className="relative pl-6 animate-in fade-in slide-in-from-bottom-2">
              <span className={cn("absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center border", details.color)}>
                {details.icon}
              </span>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{item.causer?.name || 'Système'}</span>
                  {getRoleBadge(item.causer?.roles)}
                  <span className="text-sm text-muted-foreground">a effectué</span>
                  <span className="text-sm font-medium text-foreground">{details.text.toLowerCase()}</span>
                </div>
                
                <span className="text-xs font-medium text-muted-foreground/80">
                  {new Date(item.created_at).toLocaleString('fr-FR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>

                {item.properties?.attributes && (
                  <div className="mt-2 text-xs bg-muted/50 p-2 rounded-lg border border-border/50 font-mono text-muted-foreground">
                    {JSON.stringify(item.properties.attributes)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
