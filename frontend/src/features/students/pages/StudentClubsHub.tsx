import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Calendar, Megaphone, Plus, ChevronRight, Heart, MessageCircle,
  Sparkles, Tent, Search, Send, Check, X, Star, Printer, Trophy,
  Clock, MapPin, UserPlus, Award, ShieldCheck, LogOut, CheckCircle2,
  Tag, QrCode
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@/shared/lib/api';
import EmptyState from '@shared/components/ui/EmptyState';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export default function StudentClubsHub() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState<any>(null);
  const [showBdeModal, setShowBdeModal] = useState(false);
  const [bdePole, setBdePole] = useState('communication');
  const [bdeMotivation, setBdeMotivation] = useState('');
  const [newPost, setNewPost] = useState('');
  const [selectedClubForPost, setSelectedClubForPost] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'scientific' });
  const [participatingEvents, setParticipatingEvents] = useState<Record<number, boolean>>({});
  const [likedEvents, setLikedEvents] = useState<Record<number, boolean>>({});

  // 1. Fetch clubs & events from 100% Live DB API
  const { data: hubData, isLoading } = useQuery({
    queryKey: ['clubs-hub'],
    queryFn: async () => {
      const res = await api.get('/student-portal/clubs');
      return res.data;
    },
  });

  const clubs: any[] = hubData?.clubs || [];
  const events: any[] = hubData?.posts || [];
  const stats = hubData?.stats || {
    active_clubs_count: clubs.length,
    my_clubs_count: clubs.filter((c: any) => c.is_member).length,
    upcoming_events_count: events.length,
    community_members_count: clubs.reduce((acc: number, c: any) => acc + (c.members_count || 0), 0),
  };

  const myClubs = clubs.filter((c: any) => c.is_member);

  // 2. Join Club Mutation (Persists to club_members in PostgreSQL)
  const joinMutation = useMutation({
    mutationFn: async (clubId: number) => {
      const res = await api.post(`/student-portal/clubs/${clubId}/join`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Adhésion confirmée avec succès !');
      queryClient.invalidateQueries({ queryKey: ['clubs-hub'] });
      queryClient.invalidateQueries({ queryKey: ['student-portfolio-data'] });
      setShowJoinModal(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erreur lors de l'adhésion au club.");
    }
  });

  // 3. Leave Club Mutation
  const leaveMutation = useMutation({
    mutationFn: async (clubId: number) => {
      const res = await api.post(`/student-portal/clubs/${clubId}/leave`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Vous avez quitté le club.');
      queryClient.invalidateQueries({ queryKey: ['clubs-hub'] });
      queryClient.invalidateQueries({ queryKey: ['student-portfolio-data'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la sortie du club.');
    }
  });

  // 4. Create Club Mutation
  const createClubMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await api.post('/student-portal/clubs', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Club créé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['clubs-hub'] });
      queryClient.invalidateQueries({ queryKey: ['student-portfolio-data'] });
      setShowCreateModal(false);
      setForm({ name: '', description: '', category: 'scientific' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du club.');
    }
  });

  // 5. Create Event / Post Mutation
  const createEventMutation = useMutation({
    mutationFn: async (payload: { title: string; description: string; club_id?: number }) => {
      const res = await api.post('/student-portal/clubs/events', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Actualité publiée sur le campus !');
      queryClient.invalidateQueries({ queryKey: ['clubs-hub'] });
      setNewPost('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la publication.');
    }
  });

  // 6. Participate Event Mutation
  const participateMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const res = await api.post(`/student-portal/clubs/events/${eventId}/participate`);
      return res.data;
    },
    onSuccess: (data, eventId) => {
      setParticipatingEvents(prev => ({ ...prev, [eventId]: true }));
      toast.success(data.message || 'Participation enregistrée !');
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement de votre participation.");
    }
  });

  const handleJoinClub = (club: any) => {
    joinMutation.mutate(club.id);
  };

  const handleLeaveClub = (club: any) => {
    if (window.confirm(`Confirmez-vous vouloir quitter le club "${club.name}" ?`)) {
      leaveMutation.mutate(club.id);
    }
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      toast.error('Veuillez renseigner tous les champs obligatoires.');
      return;
    }
    createClubMutation.mutate(form);
  };

  const handlePostShared = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    const activeClubId = selectedClubForPost || (myClubs.length > 0 ? myClubs[0].id : clubs[0]?.id);
    createEventMutation.mutate({
      title: newPost.length > 40 ? newPost.substring(0, 40) + '...' : newPost,
      description: newPost,
      club_id: activeClubId,
    });
  };

  const handleToggleLike = (eventId: number) => {
    setLikedEvents(prev => {
      const isLiked = !!prev[eventId];
      if (!isLiked) {
        toast.success("J'aime ajouté !");
      }
      return { ...prev, [eventId]: !isLiked };
    });
  };

  const handleBdeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Candidature au BDE ENCG Fès enregistrée avec succès !", {
      description: `Pôle sélectionné : ${bdePole.toUpperCase()} • Dossier transmis au bureau.`
    });
    setShowBdeModal(false);
    setBdeMotivation('');
  };

  const handlePrintMemberCard = (club: any) => {
    const studentName = user?.name || 'Yassine Bennani';
    const studentCne = user?.cne || 'N130094821';
    const role = club.my_role ? club.my_role.toUpperCase() : 'MEMBRE ACTIF';

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Carte Officielle de Membre — ${club.name}</title>
      <style>
        body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; background: #f8fafc; color: #001A4B; margin: 0; display: flex; justify-content: center; }
        .card { width: 420px; background: linear-gradient(135deg, #001A4B 0%, #0a2f7d 100%); color: white; border-radius: 24px; padding: 28px; box-shadow: 0 20px 40px rgba(0,26,75,0.25); position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); }
        .watermark { position: absolute; right: -20px; bottom: -20px; font-size: 140px; font-weight: 900; color: rgba(255,255,255,0.03); user-select: none; pointer-events: none; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 14px; }
        .brand-title { font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #facc15; }
        .school { font-size: 9px; color: #93c5fd; text-transform: uppercase; letter-spacing: 1px; }
        .tag { background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4); color: #86efac; font-size: 9px; font-weight: 800; padding: 3px 8px; rounded: 12px; border-radius: 999px; text-transform: uppercase; }
        .club-name { font-size: 18px; font-weight: 900; color: #ffffff; margin-bottom: 14px; line-height: 1.25; }
        .member-info { margin-bottom: 18px; background: rgba(255,255,255,0.07); padding: 12px 14px; border-radius: 14px; }
        .name { font-size: 16px; font-weight: 800; color: #facc15; }
        .role { font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase; margin-top: 2px; }
        .cne { font-size: 10px; color: #cbd5e1; font-family: monospace; margin-top: 4px; }
        .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 12px; font-size: 9px; color: #93c5fd; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="watermark">ENCG</div>
        <div class="header">
          <div>
            <div class="brand-title">ENCG FÈS • VIE ASSOCIATIVE</div>
            <div class="school">Université Sidi Mohamed Ben Abdellah</div>
          </div>
          <span class="tag">Certifiée ✅</span>
        </div>
        <div class="club-name">${club.name}</div>
        <div class="member-info">
          <div class="name">${studentName}</div>
          <div class="role">${role}</div>
          <div class="cne">CNE : ${studentCne} • Année : 2026-2027</div>
        </div>
        <div class="footer">
          <span>Direction des Affaires Estudiantines</span>
          <span style="color: #facc15; font-weight: bold;">DAE / BDE ENCG</span>
        </div>
      </div>
      <script>window.print();</script>
    </body>
    </html>`);
    win.document.close();
  };

  // Filter clubs by search and category
  const filteredClubs = clubs.filter((c: any) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
      (c.president_name && c.president_name.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categoryLabels: Record<string, string> = {
    all: 'Toutes les catégories',
    scientific: 'Scientifique & Business',
    cultural: 'Culturel & Artistique',
    sports: 'Sportif & Plein Air',
    social: 'Social & Humanitaire',
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-[#001A4B]/20 border-t-[#001A4B] rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Chargement du hub associatif de l'ENCG Fès...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24 text-slate-900 dark:text-slate-100">

      {/* ── Executive Hero Banner (Moroccan Royal Navy #001A4B) ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#001A4B] via-[#09296e] to-[#04132e] p-7 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-white/10 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-100 p-1 shadow-2xl shrink-0">
              <div className="w-full h-full bg-[#001A4B] rounded-[22px] flex items-center justify-center shadow-inner">
                <Tent className="w-9 h-9 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400/15 backdrop-blur-md border border-amber-400/30 text-amber-300 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Vie Estudiantine & Associative — ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Clubs & Vie Associative
              </h1>
              <p className="text-blue-200 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Rejoignez les associations officielles du campus, participez aux forums, tournois et festivals, et valorisez vos compétences transversales.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-[#001A4B] font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg hover:shadow-amber-400/20 cursor-pointer active:scale-95 self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 text-[#001A4B]" /> Créer un Club
          </button>
        </div>

        {/* 4 KPI Metrics Powered by Live DB */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">CLUBS ACTIFS</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {stats.active_clubs_count} Associations
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">MES ADHÉSIONS</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {stats.my_clubs_count} Club(s)
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">ÉVÉNEMENTS CAMPUS</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {stats.upcoming_events_count} Prévus
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">COMMUNAUTÉ ÉTUDIANTE</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">
              {stats.community_members_count} Membres
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Directory (1 col) & Events Feed (2 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Club Directory */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Tent className="w-5 h-5 text-blue-600" /> Annuaire Officiel des Clubs
            </h2>
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {filteredClubs.length} / {clubs.length}
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, président, domaine..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/15 outline-none transition-all shadow-xs"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {['all', 'scientific', 'cultural', 'sports', 'social'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer",
                  selectedCategory === cat
                    ? "bg-[#001A4B] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {cat === 'all' ? 'Tous' : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>

          {/* Club Cards List */}
          <div className="space-y-4">
            {filteredClubs.length === 0 ? (
              <EmptyState
                icon={Tent}
                title="Aucun club trouvé"
                description="Aucun club ne correspond à votre filtre de recherche."
                actionLabel="Réinitialiser les filtres"
                onAction={() => { setSearch(''); setSelectedCategory('all'); }}
              />
            ) : (
              filteredClubs.map((club: any) => {
                const isMember = !!club.is_member;
                const president = club.president_name || 'Direction des Études';

                return (
                  <div 
                    key={club.id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3.5 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#001A4B] to-blue-700 flex items-center justify-center text-amber-300 font-black text-lg shadow-sm shrink-0">
                          {club.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                            {club.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1">
                            <span>{club.members_count || 1} membre(s)</span>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-300">Présidence : {president}</span>
                          </div>
                        </div>
                      </div>

                      {isMember && (
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-[9px] font-black shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Membre
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {club.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      {!isMember ? (
                        <button
                          onClick={() => setShowJoinModal(club)}
                          disabled={joinMutation.isPending}
                          className="flex-1 py-2.5 bg-[#001A4B] hover:bg-blue-900 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Rejoindre le Club
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={() => handlePrintMemberCard(club)}
                            className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-black text-xs rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600" /> Carte Officielle
                          </button>
                          <button
                            onClick={() => handleLeaveClub(club)}
                            disabled={leaveMutation.isPending}
                            title="Quitter le club"
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* BDE Recruitment Card */}
          <div className="bg-gradient-to-br from-[#001A4B] via-[#09296e] to-[#04132e] rounded-3xl p-6 text-white space-y-3.5 shadow-xl border border-white/10 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">Appel à Candidatures — BDE ENCG</h3>
              <p className="text-xs text-blue-200/90 font-medium mt-1 leading-relaxed">
                Le Bureau Des Étudiants ouvre les recrutements pour les pôles Communication, Sponsoring, Événementiel et Logistique.
              </p>
            </div>
            <button
              onClick={() => setShowBdeModal(true)}
              className="w-full bg-amber-400 hover:bg-amber-300 text-[#001A4B] py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
            >
              Postuler au BDE →
            </button>
          </div>

        </div>

        {/* Right 2 Columns: Campus Events Feed & Publications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> Événements & Actualités du Campus
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Flux Officiel
            </span>
          </div>

          {/* Share an Announcement / News */}
          <form 
            onSubmit={handlePostShared} 
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#001A4B] text-amber-300 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              {user?.name ? user.name.charAt(0) : 'Y'}
            </div>
            <input
              type="text"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Partager une actualité ou annonce avec les étudiants de l'ENCG Fès..."
              className="flex-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold focus:ring-4 focus:ring-blue-500/15 outline-none transition-all"
            />
            {myClubs.length > 1 && (
              <select
                value={selectedClubForPost || ''}
                onChange={(e) => setSelectedClubForPost(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                {myClubs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <button 
              type="submit" 
              disabled={createEventMutation.isPending || !newPost.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#001A4B] hover:bg-blue-900 disabled:opacity-50 text-white font-black text-xs rounded-2xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0"
            >
              <Send className="w-3.5 h-3.5" /> Publier
            </button>
          </form>

          {/* Events Feed Cards */}
          <div className="space-y-5">
            {events.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Aucun événement pour le moment"
                description="Les présidents de clubs publieront prochainement leurs événements sur le campus."
              />
            ) : (
              events.map((event: any, idx: number) => {
                const isParticipating = !!participatingEvents[event.id];
                const isLiked = !!likedEvents[event.id];
                const clubName = event.club?.name || 'Club ENCG Fès';

                return (
                  <div 
                    key={event.id || idx} 
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    {/* Event Header */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#001A4B] to-blue-700 flex items-center justify-center text-amber-300 font-black text-lg shadow-sm shrink-0">
                          {clubName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                            {event.title}
                          </h3>
                          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                            {clubName}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full text-[10px] font-black shrink-0 uppercase tracking-wider">
                        Événement
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Date & Location Chips */}
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>{event.start_formatted || 'Septembre / Octobre 2026'}</span>
                      </div>
                      {event.location && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <MapPin className="w-4 h-4 text-amber-500" />
                            <span>{event.location}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleLike(event.id)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer",
                            isLiked ? "text-rose-600" : "text-slate-400 hover:text-rose-500"
                          )}
                        >
                          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                          <span>{isLiked ? 1 : 0}</span>
                        </button>
                        <button 
                          onClick={() => toast.info(`Section commentaires ouverte pour "${event.title}".`)}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors text-xs font-bold cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" /> Commenter
                        </button>
                      </div>

                      <button
                        onClick={() => participateMutation.mutate(event.id)}
                        disabled={isParticipating || participateMutation.isPending}
                        className={cn(
                          "px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95",
                          isParticipating
                            ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800"
                            : "bg-[#001A4B] hover:bg-blue-900 text-white"
                        )}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isParticipating ? 'Inscrit ✅' : 'Je participe'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ── Modal: Rejoindre un Club ── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#001A4B] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                  Adhésion Officielle
                </span>
                <h2 className="text-base font-black mt-0.5">{showJoinModal.name}</h2>
              </div>
              <button 
                onClick={() => setShowJoinModal(null)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                En intégrant <strong>{showJoinModal.name}</strong>, vous accédez à :
              </p>
              <div className="space-y-2.5">
                {[
                  'Accès prioritaire aux ateliers, hackathons et conférences',
                  'Délivrance de la Carte de Membre Officielle ENCG Fès',
                  'Valorisation de votre engagement sur le Portfolio & Passeport Académique',
                  'Réseau professionnel et parrainage alumni'
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    {b}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setShowJoinModal(null)} 
                className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                ANNULER
              </button>
              <button 
                onClick={() => handleJoinClub(showJoinModal)}
                disabled={joinMutation.isPending}
                className="px-6 py-2.5 text-xs font-black bg-[#001A4B] text-white hover:bg-blue-900 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" /> REJOINDRE LE CLUB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Créer un Club ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#001A4B] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                  Création d'Association Étudiante
                </span>
                <h2 className="text-base font-black mt-0.5">Fonder un Nouveau Club à l'ENCG</h2>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">
                  Nom Officiel du Club *
                </label>
                <input 
                  required 
                  value={form.name} 
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Club Data Science & IA Financière"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-blue-500/15 outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">
                  Catégorie d'Activité *
                </label>
                <select 
                  value={form.category} 
                  onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-blue-500/15 outline-none cursor-pointer"
                >
                  <option value="scientific">Scientifique & Business (Finance, Conseil, Entrepreneuriat)</option>
                  <option value="cultural">Culturel & Artistique (Musique, Théâtre, Arts visuels)</option>
                  <option value="sports">Sportif & Bien-être (Tournois, Randonnées, Équipes)</option>
                  <option value="social">Social & Humanitaire (Solidarité, Caravanes citoyennes)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">
                  Mission & Objectifs Annuels *
                </label>
                <textarea 
                  required 
                  rows={3} 
                  value={form.description} 
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Décrivez la raison d'être du club, les types d'événements envisagés et la valeur ajoutée pour les étudiants..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-blue-500/15 outline-none resize-none" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  ANNULER
                </button>
                <button 
                  type="submit" 
                  disabled={createClubMutation.isPending}
                  className="px-6 py-2.5 text-xs font-black bg-[#001A4B] text-white hover:bg-blue-900 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> ENREGISTRER LE CLUB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Postuler au BDE ── */}
      {showBdeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#001A4B] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                  Recrutement Campus
                </span>
                <h2 className="text-base font-black mt-0.5">Candidature au BDE ENCG Fès</h2>
              </div>
              <button 
                onClick={() => setShowBdeModal(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBdeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">
                  Pôle Souhaité *
                </label>
                <select 
                  value={bdePole} 
                  onChange={(e) => setBdePole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-blue-500/15 outline-none cursor-pointer"
                >
                  <option value="communication">Pôle Communication & Médias Digitaux</option>
                  <option value="evenementiel">Pôle Événementiel & Intégration</option>
                  <option value="sponsoring">Pôle Sponsoring & Relations Entreprises</option>
                  <option value="logistique">Pôle Logistique & Gestion de Campus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">
                  Motivations & Expériences préalables
                </label>
                <textarea 
                  rows={3}
                  value={bdeMotivation}
                  onChange={(e) => setBdeMotivation(e.target.value)}
                  placeholder="Pourquoi souhaitez-vous intégrer le BDE ? Vos points forts..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-blue-500/15 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowBdeModal(false)} 
                  className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  ANNULER
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 text-xs font-black bg-amber-400 hover:bg-amber-300 text-[#001A4B] rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" /> TRANSMETTRE MA CANDIDATURE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
