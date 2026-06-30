import React, { useState } from 'react';
import { Users, Globe, Briefcase, GraduationCap, MapPin, Search, Filter, MessageSquare } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AlumniNetwork() {
  const [activeTab, setActiveTab] = useState('ANNUAIRE');
  const [searchQuery, setSearchQuery] = useState('');

  const alumniList = [
    { name: 'Sofia El Fassi', promo: '2020', job: 'Directrice Marketing', company: "L'Oréal", location: 'Paris, France', initials: 'SE', color: 'from-pink-500 to-rose-600' },
    { name: 'Mehdi Benali', promo: '2015', job: 'Partner', company: 'McKinsey & Company', location: 'Casablanca, Maroc', initials: 'MB', color: 'from-blue-500 to-indigo-600' },
    { name: 'Kenza Tazi', promo: '2023', job: 'Analyste Financier', company: 'Goldman Sachs', location: 'Londres, UK', initials: 'KT', color: 'from-amber-500 to-orange-600' },
    { name: 'Anas Idrissi', promo: '2018', job: 'Fondateur', company: 'TechStartup', location: 'Dubaï, UAE', initials: 'AI', color: 'from-teal-500 to-cyan-600' },
  ];

  const filtered = alumniList.filter(a =>
    !searchQuery ||
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS = ['ANNUAIRE', 'CARTE DU MONDE', 'MENTORAT', "OFFRES D'EMPLOI", 'DONS & CAMPAGNES'];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in zoom-in duration-500 pb-24">

      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] border border-white/10 shadow-2xl p-8 md:p-12">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 text-primary pointer-events-none">
          <Globe className="w-96 h-96" strokeWidth={0.3} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-primary/30">
              <Users className="w-3.5 h-3.5" /> Réseau d'Excellence
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Réseau Alumni ENCG</h1>
            <p className="text-white/60 text-base max-w-2xl">
              Connectez les étudiants actuels avec plus de 15 000 lauréats répartis dans 40 pays à travers le monde.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md text-center min-w-[90px]">
              <div className="text-3xl font-black text-white">15k+</div>
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Lauréats</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md text-center min-w-[90px]">
              <div className="text-3xl font-black text-primary">40+</div>
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Pays</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto pb-0">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-3 font-bold text-sm transition-colors whitespace-nowrap border-b-2 -mb-px',
              activeTab === tab
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row gap-6">

        {/* Filters */}
        <div className="w-full md:w-60 shrink-0">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Filtres
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Promotion</label>
                <select className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>Toutes les promos</option>
                  <option>2020 - 2024</option>
                  <option>2010 - 2019</option>
                  <option>Avant 2010</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Pays de résidence</label>
                <select className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>Tous les pays</option>
                  <option>Maroc</option>
                  <option>France</option>
                  <option>Émirats Arabes Unis</option>
                  <option>Royaume-Uni</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Secteur d'activité</label>
                <select className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>Tous les secteurs</option>
                  <option>Finance / Banque</option>
                  <option>Marketing / Communication</option>
                  <option>Audit / Conseil</option>
                  <option>Technologies</option>
                </select>
              </div>
            </div>
            <button className="w-full mt-2 bg-primary text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-sm">
              Appliquer
            </button>
          </div>
        </div>

        {/* Directory List */}
        <div className="flex-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un lauréat par nom, entreprise, ou ville..."
              className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((alumni, idx) => (
              <div key={idx} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all group flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${alumni.color} text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm`}>
                  {alumni.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {alumni.name}
                    </h3>
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0">
                      Promo {alumni.promo}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-primary mb-2">{alumni.job}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" /> {alumni.company}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /> {alumni.location}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex gap-2">
                    <button className="flex-1 bg-primary/10 text-primary py-2 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Contacter
                    </button>
                    <button className="flex-1 bg-muted text-muted-foreground py-2 rounded-lg text-xs font-bold hover:bg-muted/80 transition-colors flex items-center justify-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Mentorat
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucun lauréat trouvé pour cette recherche.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
