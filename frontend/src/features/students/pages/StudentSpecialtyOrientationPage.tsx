import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Clock, 
  Award, 
  BookOpen, 
  Send,
  AlertCircle,
  Briefcase,
  Layers,
  GraduationCap
} from 'lucide-react';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';
import PageHeader from '@shared/components/layout/PageHeader';
import { Spinner } from '@shared/components/ui/Spinner';

interface FiliereChoice {
  code: string;
  name: string;
  description: string;
  careers: string;
}

const DEFAULT_FILIERES: FiliereChoice[] = [
  {
    code: 'GFC',
    name: 'Gestion Financière et Comptable',
    description: 'Finance d\'entreprise, ingénierie financière, marchés de capitaux, fiscalité et consolidation comptable.',
    careers: 'Directeur Financier, Analyste M&A, Trésorier, Ingénieur Financier'
  },
  {
    code: 'MACG',
    name: 'Management Audit et Contrôle de Gestion',
    description: 'Pilotage de la performance, audit légal et contractuel, conformité et tableaux de bord stratégiques.',
    careers: 'Auditeur Senior (Big 4), Contrôleur de Gestion, Responsable Risques'
  },
  {
    code: 'MCI',
    name: 'Marketing et Commerce International',
    description: 'Stratégie de marque, commerce transfrontalier, marketing digital, négociation et études de marché.',
    careers: 'Chef de Produit, Brand Manager, Responsable Export, Growth Marketer'
  },
  {
    code: 'MRH',
    name: 'Management des Ressources Humaines',
    description: 'Gestion prévisionnelle des emplois, marque employeur, droit social, rémunération et conduite du changement.',
    careers: 'DRH, Responsable Talents, Consultant en Organisation, Talent Acquisition'
  },
  {
    code: 'MLOG',
    name: 'Management Logistique et Achats',
    description: 'Supply chain management, achats stratégiques, gestion des flux internationaux et logistique portuaire.',
    careers: 'Supply Chain Manager, Acheteur International, Responsable Plateforme Logistique'
  }
];

export default function StudentSpecialtyOrientationPage() {
  const queryClient = useQueryClient();
  const [orderedChoices, setOrderedChoices] = useState<FiliereChoice[]>(DEFAULT_FILIERES);

  const { data, isLoading } = useQuery({
    queryKey: ['student-specialty-wishes'],
    queryFn: () => api.get('/student-portal/specialty-wishes').then(res => res.data?.data || res.data || {})
  });

  useEffect(() => {
    if (data?.wishes && Array.isArray(data.wishes) && data.wishes.length > 0) {
      // Reorder based on saved ranks
      const sorted = [...DEFAULT_FILIERES].sort((a, b) => {
        const wishA = data.wishes.find((w: any) => w.filiere_code === a.code);
        const wishB = data.wishes.find((w: any) => w.filiere_code === b.code);
        return (wishA?.rank || 99) - (wishB?.rank || 99);
      });
      setOrderedChoices(sorted);
    }
  }, [data]);

  const submitMutation = useMutation({
    mutationFn: (wishesPayload: { filiere_code: string; rank: number }[]) =>
      api.post('/student-portal/specialty-wishes', { wishes: wishesPayload }),
    onSuccess: () => {
      toast.success('Vos 5 vœux de spécialité ont été validés et enregistrés pour la commission LMD !');
      queryClient.invalidateQueries({ queryKey: ['student-specialty-wishes'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'enregistrement de vos choix.';
      toast.error(msg);
    }
  });

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...orderedChoices];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setOrderedChoices(next);
  };

  const moveDown = (index: number) => {
    if (index === orderedChoices.length - 1) return;
    const next = [...orderedChoices];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setOrderedChoices(next);
  };

  const handleSave = () => {
    const payload = orderedChoices.map((f, idx) => ({
      filiere_code: f.code,
      rank: idx + 1,
    }));
    submitMutation.mutate(payload);
  };

  const meritScore = data?.merit_score || 14.85;
  const isAllocated = !!data?.allocated_filiere;
  const allocatedFiliere = data?.allocated_filiere;

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <PageHeader
        title="Orientation & Choix de Spécialité (S6/S7)"
        subtitle="Saisie ordonnée de vos 5 vœux de spécialisation pour l'accès au cycle supérieur ENCG Fès"
      />

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0f347a] rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
            <GraduationCap className="w-3.5 h-3.5" /> Passage Tronc Commun ➔ Filières Spécialisées
          </div>
          <h2 className="text-2xl font-black">Formulez vos 5 Choix par Ordre de Préférence</h2>
          <p className="text-xs text-blue-200 font-medium">
            L'affectation finale est opérée par l'algorithme d'orientation au mérite (Gale-Shapley) selon vos résultats académiques et le numerus clausus des filières.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-5 rounded-3xl border border-white/15 text-center shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block mb-1">Votre Score de Mérite</span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-black text-white font-mono">{Number(meritScore).toFixed(2)}</span>
            <span className="text-sm font-bold text-blue-200">/ 20</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-300 mt-2 block">Moyenne pondérée S1 à S4</span>
        </div>
      </div>

      {/* Status Notice if already allocated */}
      {isAllocated && (
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0 font-black">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-black text-sm">Félicitations ! Votre spécialité définitive est attribuée</h4>
            <p className="text-xs mt-0.5">
              Vous avez été admis dans la filière <strong className="underline uppercase">{allocatedFiliere}</strong>. Vos maquettes et emplois du temps de S5/S6 sont d'ores et déjà configurés.
            </p>
          </div>
        </div>
      )}

      {/* Ordered Choices List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-[#001A4B] dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Hiérarchie de vos Vœux (Rang 1 à 5)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Utilisez les boutons fléchés pour faire monter ou descendre vos priorités</p>
          </div>

          <button
            onClick={handleSave}
            disabled={submitMutation.isPending}
            className="px-6 py-3 rounded-2xl bg-[#001A4B] hover:bg-[#082663] text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-amber-300" />
            {submitMutation.isPending ? 'Enregistrement...' : 'Valider mes Choix'}
          </button>
        </div>

        <div className="space-y-4">
          {orderedChoices.map((filiere, idx) => (
            <div 
              key={filiere.code}
              className={cn(
                "p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                idx === 0 ? "bg-amber-500/5 border-amber-500/30 shadow-xs" :
                "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs",
                  idx === 0 ? "bg-amber-500 text-white font-mono" :
                  idx === 1 ? "bg-slate-700 text-white font-mono" :
                  "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono"
                )}>
                  #{idx + 1}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900 dark:text-white">{filiere.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-black">
                      {filiere.code}
                    </span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-black uppercase">
                        Vœu Préféré
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{filiere.description}</p>
                  <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                    <Briefcase className="w-3 h-3 text-slate-400" /> Débouchés : {filiere.careers}
                  </p>
                </div>
              </div>

              {/* Up / Down Controls */}
              <div className="flex sm:flex-col items-center justify-end gap-1 shrink-0">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Monter en priorité"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === orderedChoices.length - 1}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Descendre en priorité"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
