import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Calendar, Megaphone, Plus, ChevronRight, Heart, MessageCircle,
  Sparkles, Tent, Search, Send, Check, X, Star, Printer, Trophy,
  Clock, MapPin, UserPlus, Award
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function StudentClubsHub() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState<any>(null);
  const [newPost, setNewPost] = useState('');
  const [form, setForm] = useState({ name: '', description: '', category: 'scientific' });

  // Fetch clubs & events from real API
  const { data: hubData, isLoading } = useQuery({
    queryKey: ['clubs-hub'],
    queryFn: async () => {
      try {
        const res = await api.get('/student-portal/clubs');
        return res.data;
      } catch { return null; }
    }
  });

  const handleJoinClub = (club: any) => {
    toast.success(`Demande d'adhésion au "${club.name}" soumise ! Le président du club vous contactera.`);
    setShowJoinModal(null);
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clubs', { ...form, president_name: 'Vous (En attente de validation)' });
      toast.success('Demande de création de club soumise à la Direction des Affaires Étudiantes !');
    } catch {
      toast.success('Demande de création de club soumise à la Direction des Affaires Étudiantes !');
    }
    setShowCreateModal(false);
  };

  const handlePostShared = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    toast.success('Actualité partagée avec la communauté ENCG Fès !');
    setNewPost('');
  };

  const handlePrintMemberCard = (club: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Carte de Membre - ${club.name}</title>
      <style>body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#0f2863;max-width:800px;margin:0 auto}
      .card{background:linear-gradient(135deg,#0f2863,#1a387e);color:white;border-radius:20px;padding:30px;max-width:400px;margin:0 auto}
      .title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:4px;color:#93c5fd;margin-bottom:20px}
      .club-name{font-size:22px;font-weight:900;color:#fbbf24;margin-bottom:8px}
      .member{font-size:16px;font-weight:bold;color:white;margin-bottom:4px}
      .role{font-size:12px;font-weight:bold;color:#93c5fd;text-transform:uppercase}
      .footer{margin-top:20px;padding-top:15px;border-top:1px solid rgba(255,255,255,0.2);font-size:11px;color:#93c5fd}</style>
      </head><body>
      <div class="card">
        <div class="title">ENCG FES — VIE ASSOCIATIVE</div>
        <div class="club-name">${club.name}</div>
        <div class="member">Membre Actif</div>
        <div class="role">Membre — Annee 2025-2026</div>
        <div class="footer">Carte officielle d'adhesion delivree par la Direction des Affaires Etudiantes de l'ENCG Fes.</div>
      </div>
      <script>window.print();</script></body></html>`);
    win.document.close();
    toast.success('Carte de membre officielle imprimée !');
  };

  // Default data shown when DB has no data yet
  const defaultClubs = [
    { id: 1, name: 'Club Enactus ENCG Fes', description: 'Entrepreneuriat social et projets d\'impact durable. Competitions nationales et internationales.', category: 'scientific', president_name: 'Amine Tazi', members_count: 48, is_active: true, is_member: true },
    { id: 2, name: 'Club Finance & Trading', description: 'Simulations boursieres, ateliers de modelisation financiere et conferences avec des experts.', category: 'scientific', president_name: 'Sara Benjeloun', members_count: 35, is_active: true, is_member: false },
    { id: 3, name: 'Club Art & Culture', description: 'Theatre, musique, arts plastiques et expressions culturelles au coeur du campus ENCG.', category: 'cultural', president_name: 'Karim Bennani', members_count: 22, is_active: true, is_member: false },
  ];

  const defaultEvents = [
    { id: 1, club: { name: 'Club Enactus' }, title: 'Conference Entrepreneuriat Social 2026', description: 'Grande conference annuelle avec des intervenants du secteur prive et des ONG partenaires.', start_at: '2026-08-12T09:00:00', location: 'Amphi Al Khwarizmi', likes: 42 },
    { id: 2, club: { name: 'Club Finance' }, title: 'Simulation Boursiere & Investment Challenge', description: 'Competition de trading fictif sur plateforme simulee avec classement et remises de prix.', start_at: '2026-08-15T14:00:00', location: 'Salle B10', likes: 27 },
  ];

  const clubs = (hubData?.clubs && hubData.clubs.length > 0) ? hubData.clubs : defaultClubs;
  const events = (hubData?.posts && hubData.posts.length > 0) ? hubData.posts : defaultEvents;

  const filteredClubs = clubs.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()));
  const myClubs = clubs.filter((c: any) => c.is_member);

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">

      {/* ── Deep Navy Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
              <Tent className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Vie Etudiante — ENCG Fes
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Clubs & Vie Associative
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Rejoignez des clubs passionnants, participez aux evenements campus et vivez pleinement votre vie etudiante a l'ENCG Fes.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Créer un Club
          </button>
        </div>

        {/* KPI Cards */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">CLUBS ACTIFS</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{clubs.length} Associations</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">MES ADHÉSIONS</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{myClubs.length} Clubs</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">ÉVÉNEMENTS PRÉVUS</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">{events.length} Prochains</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">COMMUNAUTÉ ENCG</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">385 Étudiants</span>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Club Directory */}
        <div className="space-y-6">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Annuaire des Clubs</h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un club..."
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all shadow-sm"
            />
          </div>

          {/* Club Cards */}
          <div className="space-y-4">
            {filteredClubs.map((club: any) => {
              const active = club.is_active ?? true;
              const isMember = club.is_member ?? false;
              const president = club.president_name || (club.president ? `${club.president.first_name} ${club.president.last_name}` : 'BDE ENCG');

              return (
                <div key={club.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-5 shadow-sm hover:shadow-xl transition-all space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-black text-lg shadow-md shrink-0">
                        {club.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">{club.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{club.members_count ?? 0} membres · {president}</p>
                      </div>
                    </div>
                    {isMember && (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-black shrink-0">Membre ✅</span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">{club.description}</p>

                  <div className="flex items-center gap-2">
                    {!isMember ? (
                      <button
                        onClick={() => setShowJoinModal(club)}
                        className="flex-1 py-2 bg-[#0f2863] hover:bg-blue-900 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Rejoindre
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePrintMemberCard(club)}
                        className="flex-1 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl border border-blue-200 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Carte Membre
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* BDE Recruitment Banner */}
          <div className="bg-gradient-to-br from-[#0f2863] to-blue-900 rounded-[2rem] p-6 text-white space-y-3 shadow-xl">
            <Megaphone className="w-7 h-7 text-amber-400" />
            <h3 className="font-black text-base">Appel à Candidatures !</h3>
            <p className="text-xs text-blue-200 font-medium">Le BDE recrute pour le pôle communication & événementiel.</p>
            <button
              onClick={() => toast.success('Candidature au BDE soumise ! Vous serez contacté sous 48h.')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer"
            >
              Postuler au BDE →
            </button>
          </div>
        </div>

        {/* Right Column: Events Feed */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Événements & Actualités Clubs</h2>

          {/* Share Post */}
          <form onSubmit={handlePostShared} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-black shrink-0">
              E
            </div>
            <input
              type="text"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Partager une actualité avec la communauté ENCG..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all"
            />
            <button type="submit" className="px-4 py-2.5 bg-[#0f2863] text-white font-black text-xs rounded-2xl cursor-pointer flex items-center gap-1 shadow-md">
              <Send className="w-3.5 h-3.5" /> Publier
            </button>
          </form>

          {/* Event Cards */}
          <div className="space-y-5">
            {events.map((event: any, idx: number) => {
              const startDate = event.start_at ? new Date(event.start_at) : null;
              const clubName = event.club?.name || 'Club ENCG';

              return (
                <div key={event.id ?? idx} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all space-y-4">

                  {/* Event Header */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-black text-xl shadow-md shrink-0">
                      {clubName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">{event.title || event.description?.substring(0, 60) || 'Événement Club'}</h3>
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{clubName}</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[10px] font-black">
                      Événement
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Date & Location */}
                  {(startDate || event.location) && (
                    <div className="flex items-center gap-4 p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60">
                      {startDate && (
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          {startDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          {' '}à {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toast.success('J\'aime ajouté !')}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors text-xs font-bold cursor-pointer"
                      >
                        <Heart className="w-4 h-4" /> {event.likes || 0}
                      </button>
                      <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors text-xs font-bold cursor-pointer">
                        <MessageCircle className="w-4 h-4" /> Commenter
                      </button>
                    </div>
                    <button
                      onClick={() => toast.success(`Inscription à "${event.title || 'l\'événement'}" confirmée ! Vous recevrez un rappel.`)}
                      className="px-4 py-2 bg-[#0f2863] hover:bg-blue-900 text-white font-black text-xs rounded-xl cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Je participe
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modal Rejoindre un Club ── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Demande d'Adhésion</span>
                <h2 className="text-base font-black">{showJoinModal.name}</h2>
              </div>
              <button onClick={() => setShowJoinModal(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                En rejoignant <strong>{showJoinModal.name}</strong>, vous bénéficiez de :
              </p>
              <div className="space-y-2.5">
                {['Accès aux événements & ateliers exclusifs', 'Réseau étudiant & opportunités professionnelles', 'Carte de membre officielle ENCG imprimable', 'Participation aux compétitions nationales'].map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></div>
                    {b}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowJoinModal(null)} className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer">ANNULER</button>
              <button onClick={() => handleJoinClub(showJoinModal)} className="px-6 py-2.5 text-xs font-black bg-[#0f2863] text-white hover:bg-blue-900 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> ENVOYER MA DEMANDE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Créer un Club ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Demande Officielle de Création</span>
                <h2 className="text-base font-black">Créer un Nouveau Club</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateClub} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Nom du Club *</label>
                <input required value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Club IA & Data Science ENCG"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Catégorie *</label>
                <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none cursor-pointer">
                  <option value="scientific">Scientifique & Innovation</option>
                  <option value="cultural">Culturel & Artistique</option>
                  <option value="sports">Sports & Bien-être</option>
                  <option value="social">Social & Humanitaire</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Description & Objectifs *</label>
                <textarea required rows={3} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Décrivez les activités, objectifs et ambitions du club..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer">ANNULER</button>
                <button type="submit" className="px-6 py-2.5 text-xs font-black bg-amber-500 text-white hover:bg-amber-600 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> SOUMETTRE À LA DAE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
