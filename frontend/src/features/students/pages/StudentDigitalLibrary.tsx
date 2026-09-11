import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, Filter, Book, Clock, Star, PlayCircle, 
  Download, CheckCircle2, AlertCircle, Calendar, MapPin, 
  ChevronRight, RefreshCw, X, FileText, BookmarkCheck, ArrowRight,
  ShieldCheck, Sparkles, Building2
} from 'lucide-react';
import { cn, cleanMojibake } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';

interface BookItem {
  id: number | string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  publisher?: string;
  edition?: string;
  publication_year?: number;
  location_code: string;
  total_copies: number;
  available_copies: number;
  is_available: boolean;
  type: 'LIVRE PHYSIQUE' | 'E-BOOK' | 'THÈSE / PFE';
  rating: number;
  file_url?: string;
}

interface BorrowingItem {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  barcode?: string;
  borrow_date: string;
  due_date: string;
  status: 'ACTIVE' | 'WARNING';
  status_label: string;
  days_remaining: number;
  can_extend: boolean;
}

export default function StudentDigitalLibrary() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | 'EBOOKS' | 'PHYSICAL' | 'THESIS' | 'BORROWINGS'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reader Modal state
  const [readingBook, setReadingBook] = useState<BookItem | null>(null);

  // Reservation Modal state
  const [reservingBook, setReservingBook] = useState<BookItem | null>(null);

  // Fetch student library data
  const { data: libraryData, isLoading, refetch } = useQuery({
    queryKey: ['student-library'],
    queryFn: async () => {
      const res = await api.get('/student-portal/library');
      return res.data;
    }
  });

  const books: BookItem[] = useMemo(() => {
    const raw = libraryData?.data || [];
    return raw.map((b: any) => ({
      ...b,
      title: cleanMojibake(b.title),
      author: cleanMojibake(b.author),
      category: cleanMojibake(b.category),
      edition: cleanMojibake(b.edition),
      publisher: cleanMojibake(b.publisher),
    }));
  }, [libraryData]);

  const borrowings: BorrowingItem[] = useMemo(() => {
    const raw = libraryData?.borrowings || [];
    return raw.map((b: any) => ({
      ...b,
      title: cleanMojibake(b.title),
      author: cleanMojibake(b.author),
    }));
  }, [libraryData]);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      // Tab filter
      if (activeTab === 'EBOOKS' && b.type !== 'E-BOOK') return false;
      if (activeTab === 'PHYSICAL' && b.type !== 'LIVRE PHYSIQUE') return false;
      if (activeTab === 'THESIS' && b.type !== 'THÈSE / PFE') return false;

      // Category filter
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = (b.title || '').toLowerCase();
        const a = (b.author || '').toLowerCase();
        const c = (b.category || '').toLowerCase();
        const i = (b.isbn || '').toLowerCase();
        if (!t.includes(q) && !a.includes(q) && !c.includes(q) && !i.includes(q)) return false;
      }

      return true;
    });
  }, [books, activeTab, selectedCategory, searchQuery]);

  // Mutation for borrowing a book
  const borrowMutation = useMutation({
    mutationFn: async (bookId: number | string) => {
      const res = await api.post('/student-portal/library/borrow', { book_id: bookId });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Exemplaire réservé avec succès !');
      setReservingBook(null);
      queryClient.invalidateQueries({ queryKey: ['student-library'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erreur lors de la réservation.';
      toast.error(msg);
    }
  });

  // Mutation for extending a loan
  const extendMutation = useMutation({
    mutationFn: async (borrowingId: number) => {
      const res = await api.post(`/student-portal/library/extend/${borrowingId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Prêt prolongé de 7 jours avec succès !');
      queryClient.invalidateQueries({ queryKey: ['student-library'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Impossible de prolonger ce prêt.';
      toast.error(msg);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Spinner className="w-10 h-10 text-[#001A4B] dark:text-blue-400" />
        <p className="text-sm font-semibold text-slate-500">Chargement de la bibliothèque numérique...</p>
      </div>
    );
  }

  // Cover gradient selector based on discipline
  const getCoverGradient = (category: string, type: string) => {
    if (type === 'E-BOOK') return 'from-indigo-600 via-indigo-700 to-blue-900';
    if (type === 'THÈSE / PFE') return 'from-purple-600 via-purple-700 to-indigo-950';

    const cat = category.toLowerCase();
    if (cat.includes('finan')) return 'from-teal-700 via-emerald-800 to-slate-900';
    if (cat.includes('compt') || cat.includes('audit')) return 'from-blue-700 via-cyan-800 to-slate-900';
    if (cat.includes('mark')) return 'from-rose-600 via-pink-700 to-indigo-950';
    if (cat.includes('droit')) return 'from-amber-600 via-amber-700 to-stone-900';
    if (cat.includes('écon')) return 'from-emerald-600 via-teal-700 to-slate-900';
    return 'from-slate-700 via-slate-800 to-[#001A4B]';
  };

  return (
    <div className="max-w-[1500px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans pb-24 text-slate-900 dark:text-white">
      
      {/* ── 1. Hero Banner ── */}
      <div className="bg-[#001A4B] rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-xl border border-blue-900/60">
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border border-blue-400/30">
              <BookOpen className="w-3.5 h-3.5" /> Médiathèque & Fonds Universitaire ENCG
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Bibliothèque Numérique
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              Accédez instantanément à des milliers d'ouvrages académiques, e-books, thèses et manuels officiels recommandés par vos professeurs pour le cursus Grande École.
            </p>

            {/* Quick Stat Pill */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="bg-white/10 text-white/90 px-3 py-1 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5">
                <Book className="w-3.5 h-3.5 text-amber-300" /> {books.length} Titres au catalogue
              </span>
              <span className="bg-white/10 text-white/90 px-3 py-1 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-300" /> Rayons consultables sur campus
              </span>
            </div>
          </div>

          {/* Right: Mes Emprunts Actifs Widget */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 shadow-inner">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Mes Emprunts Actifs ({borrowings.length})
                </h3>
                <button
                  onClick={() => setActiveTab('BORROWINGS')}
                  className="text-[11px] font-bold text-blue-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  Voir tout <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {borrowings.length === 0 ? (
                <div className="py-5 text-center text-slate-300 text-xs font-medium">
                  Aucun emprunt en cours. Vous pouvez réserver un ouvrage ci-dessous.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {borrowings.map((b) => (
                    <div 
                      key={b.id} 
                      className="bg-white/10 hover:bg-white/15 transition-all rounded-xl p-2.5 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white text-xs font-bold truncate leading-snug">{b.title}</h4>
                        <div className="text-[10px] text-slate-300 flex items-center gap-2 mt-0.5">
                          <span>Échéance : {b.due_date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn(
                          "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border font-mono",
                          b.status === 'WARNING'
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        )}>
                          {b.status_label}
                        </span>

                        {b.can_extend && (
                          <button
                            title="Prolonger de 7 jours"
                            onClick={() => extendMutation.mutate(b.id)}
                            disabled={extendMutation.isPending}
                            className="bg-white/20 hover:bg-white/30 text-white p-1 rounded-lg text-xs font-bold transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar inside Hero */}
        <div className="relative z-10 mt-6 max-w-3xl">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, auteur (ex: Vernimmen), matière ou ISBN..." 
              className="w-full bg-white/15 border border-white/25 rounded-2xl py-3.5 pl-12 pr-10 text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/20 transition-all text-sm font-medium shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Navigation Tabs (High Contrast) ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'Tous les Ouvrages', count: books.length },
          { key: 'EBOOKS', label: 'E-Books & Supports', count: books.filter(b => b.type === 'E-BOOK').length },
          { key: 'PHYSICAL', label: 'Livres Physiques', count: books.filter(b => b.type === 'LIVRE PHYSIQUE').length },
          { key: 'THESIS', label: 'Thèses & PFE', count: books.filter(b => b.type === 'THÈSE / PFE').length },
          { key: 'BORROWINGS', label: 'Mes Prêts Actifs', count: borrowings.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              "px-4 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
              activeTab === tab.key 
                ? "bg-[#001A4B] text-white dark:bg-blue-600 shadow-sm" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-[10px] px-2 py-0.2 rounded-full font-bold",
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── 3. Category Filter Chips ── */}
      {activeTab !== 'BORROWINGS' && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filière :
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              selectedCategory === 'all'
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            Toutes les disciplines
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                selectedCategory === cat
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── 4. Main Content Area ── */}
      {activeTab === 'BORROWINGS' ? (
        /* Mes Emprunts Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Historique & Suivi des Prêts Personnels
            </h2>
            <button
              onClick={() => refetch()}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#001A4B] flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Actualiser
            </button>
          </div>

          {borrowings.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
              <Book className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">Aucun emprunt en cours</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Explorez le catalogue de l'ENCG et réservez un exemplaire physique en rayon ou consultez les e-books en ligne.
              </p>
              <button
                onClick={() => setActiveTab('ALL')}
                className="bg-[#001A4B] hover:bg-[#002a7a] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                Parcourir le catalogue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {borrowings.map((b) => (
                <div 
                  key={b.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border",
                        b.status === 'WARNING' 
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200" 
                          : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200"
                      )}>
                        {b.status_label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        {b.barcode || `EMP-${b.id}`}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                      {b.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {b.author}
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date d'emprunt :</span>
                        <span className="font-bold">{b.borrow_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date limite :</span>
                        <span className="font-bold text-slate-900 dark:text-white">{b.due_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Délai restant :</span>
                        <span className={cn("font-bold", b.days_remaining < 3 ? "text-rose-600 font-black" : "text-emerald-600")}>
                          {b.days_remaining} jours
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">Règlement ENCG : 14j max</span>
                    {b.can_extend && (
                      <button
                        onClick={() => extendMutation.mutate(b.id)}
                        disabled={extendMutation.isPending}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className="w-3 h-3" /> Prolonger (+7j)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Books Catalog Grid */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {activeTab === 'EBOOKS' ? 'E-Books & Polycope de Cours' : 
               activeTab === 'PHYSICAL' ? 'Livres Physiques sur Rayon' :
               activeTab === 'THESIS' ? 'Thèses & Mémoires de Recherche' : 'Sélection pour vous'}
            </h2>
            <span className="text-xs font-bold text-slate-500">
              {filteredBooks.length} ouvrage{filteredBooks.length > 1 ? 's' : ''} disponible{filteredBooks.length > 1 ? 's' : ''}
            </span>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
              <Search className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Aucun livre ne correspond à votre recherche</h3>
              <p className="text-xs text-slate-500 mt-1">Essayez de modifier votre mot-clé ou réinitialiser les filtres.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-4 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book) => {
                const coverGradient = getCoverGradient(book.category, book.type);

                return (
                  <div 
                    key={book.id} 
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Top: Simulated Realistic Hardcover Book Spine & Cover */}
                    <div className={cn(
                      "relative p-6 bg-gradient-to-br text-white flex flex-col justify-between h-[210px] overflow-hidden",
                      coverGradient
                    )}>
                      {/* Diagonal sheen effect */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-tr from-transparent via-white to-transparent" />

                      {/* Header Badge */}
                      <div className="flex items-center justify-between relative z-10">
                        <span className="bg-black/35 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/20">
                          {book.type}
                        </span>
                        <div className="flex items-center gap-1 bg-black/35 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/20 text-amber-300">
                          <Star className="w-3 h-3 fill-current" /> {book.rating}
                        </div>
                      </div>

                      {/* Title & Author on Cover */}
                      <div className="relative z-10 space-y-1">
                        <h3 className="font-black text-base text-white leading-tight drop-shadow line-clamp-3">
                          {book.title}
                        </h3>
                        <p className="text-xs font-medium text-white/80 line-clamp-1">
                          {book.author}
                        </p>
                      </div>

                      {/* Bottom strip on cover */}
                      <div className="flex items-center justify-between text-[10px] text-white/70 relative z-10 pt-1 border-t border-white/15">
                        <span>{book.edition || (book.publication_year ? `Année ${book.publication_year}` : 'Édition standard')}</span>
                        <span className="font-mono">{book.isbn ? book.isbn.slice(0, 13) : ''}</span>
                      </div>
                    </div>

                    {/* Meta info & availability */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Category & Shelf Location */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {book.category}
                          </span>
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {book.location_code}
                          </span>
                        </div>

                        {/* Stock count for physical books */}
                        {book.type === 'LIVRE PHYSIQUE' && (
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-slate-500 text-[11px] font-medium">Exemplaires disponibles :</span>
                            <span className={cn(
                              "font-mono font-bold text-xs px-2 py-0.5 rounded-md",
                              book.available_copies > 0 
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                            )}>
                              {book.available_copies} / {book.total_copies}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        {book.type === 'E-BOOK' ? (
                          <button
                            onClick={() => setReadingBook(book)}
                            className="w-full bg-[#001A4B] hover:bg-[#082663] text-white py-2 rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Lire / Télécharger l'E-Book
                          </button>
                        ) : (
                          <button
                            onClick={() => setReservingBook(book)}
                            disabled={!book.is_available}
                            className={cn(
                              "w-full py-2 rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all",
                              book.is_available 
                                ? "bg-[#001A4B] hover:bg-[#082663] text-white cursor-pointer active:scale-95" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            )}
                          >
                            <BookmarkCheck className="w-3.5 h-3.5" /> 
                            {book.is_available ? "Réserver cet Exemplaire" : "Indisponible (En prêt)"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 5. E-Book Reader Modal ── */}
      {readingBook && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setReadingBook(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-900 flex items-center justify-center text-white shadow flex-shrink-0">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                  {readingBook.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {readingBook.title}
                </h3>
                <p className="text-xs font-bold text-slate-500">
                  {readingBook.author}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                <Sparkles className="w-4 h-4" /> Sommaire & Ressources Numériques ENCG
              </div>
              <p className="leading-relaxed text-slate-500 dark:text-slate-400 text-[11px]">
                Ce document officiel est mis à disposition des étudiants de l'ENCG Fès dans le cadre de leurs études. Il comprend les chapitres fondamentaux, études de cas corrigées et bibliographie recommandée.
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-700 dark:text-slate-200 font-medium text-xs">
                <li>Chapitre 1 : Fondements et cadre méthodologique</li>
                <li>Chapitre 2 : Modèles d'analyse et applications pratiques</li>
                <li>Chapitre 3 : Études de cas sectorielles (Maroc & International)</li>
                <li>Annexe : Formulaire synthétique & lexique bilingue (FR/EN)</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  toast.success('Document ouvert dans la liseuse intégrée de l\'ENCG');
                  setReadingBook(null);
                }}
                className="flex-1 bg-[#001A4B] hover:bg-[#082663] text-white py-3 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <BookOpen className="w-4 h-4" /> Ouvrir en Plein Écran (Lecteur Web)
              </button>
              <button
                onClick={() => {
                  toast.success('Téléchargement du support PDF démarré...');
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Physical Book Reservation Modal ── */}
      {reservingBook && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setReservingBook(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <BookmarkCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Réserver un Exemplaire
              </h3>
              <p className="text-xs text-slate-500">
                Vous êtes sur le point de réserver l'ouvrage suivant pour une durée standard de 14 jours :
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2 text-xs">
              <div className="font-black text-slate-900 dark:text-white text-sm">
                {reservingBook.title}
              </div>
              <div className="text-slate-500">Auteur : {reservingBook.author}</div>
              <div className="text-slate-500">ISBN : {reservingBook.isbn || 'Non renseigné'}</div>
              <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold pt-1">
                <MapPin className="w-3.5 h-3.5" /> Localisation : {reservingBook.location_code}
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {reservingBook.available_copies} exemplaires disponibles en rayon
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReservingBook(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => borrowMutation.mutate(reservingBook.id)}
                disabled={borrowMutation.isPending}
                className="flex-1 bg-[#001A4B] hover:bg-[#082663] text-white py-3 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {borrowMutation.isPending ? <Spinner className="w-4 h-4 text-white" /> : "Confirmer l'Emprunt"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
