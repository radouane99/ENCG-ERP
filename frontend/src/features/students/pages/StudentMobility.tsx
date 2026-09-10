import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe2, MapPin, Star, CheckCircle2, Send, Zap, GraduationCap,
  Filter, Search, Users, Building2, Award, ChevronRight, RotateCcw,
  BookOpen, Clock, AlertCircle
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';

// Country flag emoji helper
const getFlag = (country: string): string => {
  const flags: Record<string, string> = {
    'France': '🇫🇷', 'Canada': '🇨🇦', 'Allemagne': '🇩🇪',
    'Espagne': '🇪🇸', 'Belgique': '🇧🇪', 'Italie': '🇮🇹',
    'Pays-Bas': '🇳🇱', 'Mexique': '🇲🇽', 'Tunisie': '🇹🇳',
    'Turquie': '🇹🇷', 'Corée du Sud': '🇰🇷', 'Maroc': '🇲🇦',
    'Portugal': '🇵🇹', 'Suisse': '🇨🇭',
  };
  return flags[country] ?? '🌍';
};

const getTypeColor = (type: string) => {
  if (type.toLowerCase().includes('double')) return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
  if (type.toLowerCase().includes('semestre')) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
  return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
};

const getMatchColor = (chance: number) => {
  if (chance >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (chance >= 65) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-500 dark:text-rose-400';
};

const getMatchLabel = (chance: number) => {
  if (chance >= 85) return 'Très bon profil';
  if (chance >= 65) return 'Profil compatible';
  return 'Profil insuffisant';
};

export default function StudentMobility() {
  const queryClient = useQueryClient();
  const [selectedVoeux, setSelectedVoeux] = useState<number[]>([]);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [motivationText, setMotivationText] = useState('');
  const [toeicScore, setToeicScore] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch partners and existing voeux from real API
  const { data: mobilityData, isLoading } = useQuery({
    queryKey: ['student-mobility-partners'],
    queryFn: async () => {
      const res = await api.get('/student-portal/mobility/partners');
      return res.data?.data;
    }
  });

  // Fetch student GPA from dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['student-stats-mobility'],
    queryFn: async () => {
      const res = await api.get('/student-portal/dashboard');
      return res.data?.data;
    }
  });

  const studentGpa = dashboardData?.gpa !== undefined && dashboardData?.gpa !== null
    ? Number(dashboardData.gpa)
    : null;
  const partners: any[] = mobilityData?.partners ?? [];

  // Restore saved voeux on load
  React.useEffect(() => {
    if (mobilityData?.voeux && Array.isArray(mobilityData.voeux) && selectedVoeux.length === 0) {
      setSelectedVoeux(mobilityData.voeux);
      if (mobilityData.voeux.length > 0) setApplicationSubmitted(true);
    }
  }, [mobilityData]);

  // Build filter options
  const countries = useMemo(() => Array.from(new Set<string>(partners.map((p: any) => p.country))).sort(), [partners]);
  const types = useMemo(() => Array.from(new Set<string>(partners.map((p: any) => p.type))).sort(), [partners]);

  const filteredPartners = useMemo(() => partners.filter((p: any) => {
    const q = searchQuery.toLowerCase();
    return (!searchQuery || p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q) || (p.city ?? '').toLowerCase().includes(q))
      && (selectedCountry === 'all' || p.country === selectedCountry)
      && (selectedType === 'all' || p.type === selectedType);
  }), [partners, searchQuery, selectedCountry, selectedType]);

  const voeuxMutation = useMutation({
    mutationFn: async (voeux: number[]) => {
      const res = await api.post('/student-portal/mobility/voeux', { voeux });
      return res.data;
    },
    onSuccess: () => {
      setApplicationSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['student-mobility-partners'] });
      toast.success("🚀 Votre dossier de mobilité a été soumis avec succès au Jury de sélection !");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erreur lors de l'enregistrement de vos vœux.");
    }
  });

  const handleToggleVoeu = (partnerId: number) => {
    if (selectedVoeux.includes(partnerId)) {
      setSelectedVoeux(prev => prev.filter(id => id !== partnerId));
    } else {
      if (selectedVoeux.length >= 3) { toast.error("Vous ne pouvez sélectionner que 3 vœux maximum."); return; }
      setSelectedVoeux(prev => [...prev, partnerId]);
    }
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVoeux.length === 0) { toast.error("Veuillez sélectionner au moins 1 vœu d'université partenaire."); return; }
    voeuxMutation.mutate(selectedVoeux);
  };

  const handleReset = () => {
    setApplicationSubmitted(false);
    setSelectedVoeux([]);
    setMotivationText('');
    setToeicScore('');
    queryClient.invalidateQueries({ queryKey: ['student-mobility-partners'] });
  };

  const totalSlots = partners.reduce((acc: number, p: any) => acc + (Number(p.slots) || 0), 0);
  const eligibleCount = partners.filter((p: any) => {
    const req = Number(p.gpaRequired ?? p.gpa_required ?? 12);
    return studentGpa !== null && studentGpa >= req;
  }).length;

  return (
    <div className="space-y-7 font-sans animate-in fade-in duration-500 pb-24">

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#0d2a6e] to-[#0d1d3d] rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-2xl border border-white/10 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-start justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-amber-300 border border-white/10">
                Relations Internationales & Mobilité Académique
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Campagne 2026/2027
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-start gap-3 leading-tight">
              <Globe2 className="w-8 h-8 text-amber-300 shrink-0 mt-0.5" />
              Programmes d'Échange & Doubles Diplômes Internationaux
            </h1>
            <p className="text-sm text-blue-200 font-medium leading-relaxed max-w-2xl">
              Sélectionnez jusqu'à <strong className="text-white">3 vœux</strong> d'affectation auprès de nos universités et Business Schools partenaires accréditées en Europe, Amérique du Nord, Asie et Afrique.
            </p>
            <div className="flex flex-wrap gap-5 pt-1">
              {[
                { icon: Building2, label: `${partners.length} Partenaires`, color: 'text-blue-300' },
                { icon: Users, label: `${totalSlots} Places ouvertes`, color: 'text-amber-300' },
                { icon: Award, label: studentGpa !== null ? `${eligibleCount} établissements éligibles` : 'GPA non disponible', color: 'text-emerald-300' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-1.5 text-[11px] font-bold">
                  <Icon className={cn('w-3.5 h-3.5', color)} />
                  <span className={color}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/15 text-center shrink-0 min-w-[160px] space-y-1.5">
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">Votre Score</span>
            <div className="text-4xl font-black text-white">{studentGpa !== null ? studentGpa.toFixed(2) : '—'}</div>
            <div className="text-[11px] text-blue-200 font-bold">/ 20</div>
            <p className="text-[10px] text-emerald-300 font-bold mt-1">
              {studentGpa !== null ? 'Moyenne certifiée' : 'En attente résultats'}
            </p>
            {selectedVoeux.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-amber-200 font-bold">
                {selectedVoeux.length} vœu(x) choisi(s)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher un établissement, une ville, un pays..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="all">Tous les pays</option>
            {countries.map(c => <option key={c} value={c}>{getFlag(c)} {c}</option>)}
          </select>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="all">Tous les types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Partners List */}
        <div className="xl:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Établissements Partenaires
            </h2>
            <span className="text-xs text-slate-400 font-bold">
              {filteredPartners.length} affiché(s) · {selectedVoeux.length}/3 sélectionné(s)
            </span>
          </div>

          {isLoading ? (
            <div className="p-16 flex flex-col items-center gap-3">
              <Spinner />
              <span className="text-xs text-slate-400 font-medium">Chargement des partenaires...</span>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Globe2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-bold">Aucun résultat pour cette recherche</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCountry('all'); setSelectedType('all'); }}
                className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 mx-auto"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPartners.map((partner: any) => {
                const isSelected = selectedVoeux.includes(partner.id);
                const voeuRank = selectedVoeux.indexOf(partner.id) + 1;
                const gpaReq = Number(partner.gpaRequired ?? partner.gpa_required ?? 12.0);
                const isEligible = studentGpa !== null && studentGpa >= gpaReq;
                const matchChance = (() => {
                  if (!studentGpa) return 70;
                  if (studentGpa >= gpaReq + 1.5) return 95;
                  if (studentGpa >= gpaReq + 0.5) return 85;
                  if (studentGpa >= gpaReq) return 75;
                  if (studentGpa >= gpaReq - 1.0) return 55;
                  return 35;
                })();

                return (
                  <div
                    key={partner.id}
                    onClick={() => handleToggleVoeu(partner.id)}
                    className={cn(
                      'p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative group',
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600 hover:shadow-md'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                        {voeuRank}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <span className="text-base">{getFlag(partner.country)}</span>
                          <MapPin className="w-3 h-3 text-rose-400" />
                          {partner.city ? `${partner.city}, ` : ''}{partner.country}
                        </span>
                        <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border', getTypeColor(partner.type))}>
                          {partner.type}
                        </span>
                      </div>

                      <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                        {partner.name}
                      </h3>

                      <div className="flex items-center gap-1 mt-1.5">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-500 font-medium">
                          {partner.slots} place{Number(partner.slots) !== 1 ? 's' : ''} disponible{Number(partner.slots) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Score requis
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-slate-700 dark:text-slate-200">
                            {gpaReq.toFixed(2)}/20
                          </span>
                          {studentGpa !== null && (
                            <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full',
                              isEligible
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                            )}>
                              {isEligible ? '✓ Éligible' : '✗ Insuffisant'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Chances
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all',
                                matchChance >= 85 ? 'bg-emerald-500' : matchChance >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                              )}
                              style={{ width: `${matchChance}%` }}
                            />
                          </div>
                          <span className={cn('font-mono font-black text-[11px]', getMatchColor(matchChance))}>
                            {matchChance}%
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 italic">{getMatchLabel(matchChance)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Application Form (sticky) */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 sticky top-24">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Dossier de Candidature</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">{selectedVoeux.length}/3 vœux</span>
            </div>

            {applicationSubmitted ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-sm text-emerald-900 dark:text-emerald-300">Candidature Déposée ✓</h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    Votre dossier a été transmis au comité de sélection. Vous serez notifié lors de la publication des résultats.
                  </p>
                </div>
                {selectedVoeux.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vos vœux soumis :</p>
                    {selectedVoeux.map((id: number, i: number) => {
                      const p = partners.find((item: any) => item.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-blue-900 dark:text-blue-300 truncate">{p?.name}</div>
                            <div className="text-[10px] text-blue-500">{getFlag(p?.country ?? '')} {p?.country}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Modifier ma candidature
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vœux sélectionnés :</p>
                  {selectedVoeux.length === 0 ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-[11px] text-slate-400 italic text-center flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Cliquez sur un établissement pour l'ajouter
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedVoeux.map((id: number, i: number) => {
                        const p = partners.find((item: any) => item.id === id);
                        return (
                          <div
                            key={id}
                            onClick={() => handleToggleVoeu(id)}
                            className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 transition-colors group"
                            title="Cliquer pour retirer"
                          >
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">{i + 1}</span>
                            <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 truncate flex-1">{p?.name}</span>
                            <span className="text-[9px] text-slate-400 group-hover:text-rose-500 transition-colors">✕</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Score TOEIC / TOEFL
                  </label>
                  <input
                    type="text"
                    value={toeicScore}
                    onChange={e => setToeicScore(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Ex: 880 / 990 ou B2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> Lettre de Motivation
                  </label>
                  <textarea
                    rows={4}
                    value={motivationText}
                    onChange={e => setMotivationText(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                    placeholder="Décrivez votre projet d'études et professionnel à l'international..."
                  />
                  <p className="text-[10px] text-slate-400">{motivationText.length} caractères</p>
                </div>

                <button
                  type="submit"
                  disabled={selectedVoeux.length === 0 || voeuxMutation.isPending}
                  className="w-full py-3 bg-[#001A4B] hover:bg-[#082663] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {voeuxMutation.isPending
                    ? <><Spinner className="w-4 h-4" /> Envoi en cours...</>
                    : <><Send className="w-4 h-4" /> Soumettre ma Candidature</>
                  }
                </button>

                {selectedVoeux.length === 0 && (
                  <p className="text-center text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    ↑ Sélectionnez au moins 1 établissement pour postuler
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Criteria info card */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 space-y-2">
            <h4 className="text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest">
              📋 Critères de Sélection
            </h4>
            <ul className="space-y-1 text-[11px] text-blue-700 dark:text-blue-400 font-medium">
              <li>• Moyenne générale ≥ seuil exigé par l'établissement</li>
              <li>• Score TOEIC ≥ 785 ou TOEFL ≥ 90 (selon partenaire)</li>
              <li>• Lettre de motivation convaincante</li>
              <li>• Résultat d'entretien avec la commission</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
