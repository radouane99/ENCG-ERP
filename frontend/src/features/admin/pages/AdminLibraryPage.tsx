import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, Plus, Book, Clock, AlertTriangle, CheckCircle2, 
  Trash2, Edit, RefreshCw, X, ArrowUpDown, Filter, MapPin, UserCheck, 
  Barcode, Calendar, BookmarkCheck, ArrowRightLeft, Layers, ShieldCheck
} from 'lucide-react';
import { cn, cleanMojibake } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';

interface BookItem {
  id: number;
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
  copies?: Array<{ id: number; barcode: string; condition: string; is_available: boolean }>;
}

interface BorrowingItem {
  id: number;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: 'borrowed' | 'returned' | 'overdue' | 'lost';
  notes?: string;
  book_copy?: {
    id: number;
    barcode: string;
    book?: {
      id: number;
      title: string;
      author: string;
      isbn: string;
    };
  };
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    student?: {
      cne: string;
    };
  };
}

export default function AdminLibraryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'BORROWINGS'>('CATALOG');
  const [searchCatalog, setSearchCatalog] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchBorrowings, setSearchBorrowings] = useState('');
  const [statusBorrowings, setStatusBorrowings] = useState('all');

  // Book Modal state
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Finance',
    publisher: '',
    publication_year: 2024,
    edition: '1ère édition',
    location_code: 'RAYON-FIN-01',
    total_copies: 4,
  });

  // New Borrowing Modal state
  const [newBorrowingModalOpen, setNewBorrowingModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | ''>('');
  const [borrowingStudentEmail, setBorrowingStudentEmail] = useState('student@encg-fes.ma');
  const [borrowingDueDate, setBorrowingDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // 1. Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-library-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/library/stats');
      return res.data?.data;
    }
  });

  // 2. Fetch Books Catalog
  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: ['admin-library-books', searchCatalog, selectedCategory],
    queryFn: async () => {
      const res = await api.get('/admin/library/books', {
        params: { search: searchCatalog, category: selectedCategory }
      });
      return res.data;
    }
  });

  const books: BookItem[] = useMemo(() => {
    const raw = catalogData?.data || [];
    return raw.map((b: any) => ({
      ...b,
      title: cleanMojibake(b.title),
      author: cleanMojibake(b.author),
      category: cleanMojibake(b.category),
      edition: cleanMojibake(b.edition),
      publisher: cleanMojibake(b.publisher),
    }));
  }, [catalogData]);

  const categories: string[] = useMemo(() => {
    const raw = catalogData?.categories || [];
    return raw.map((c: string) => cleanMojibake(c));
  }, [catalogData]);

  // 3. Fetch Borrowings
  const { data: borrowingsData, isLoading: borrowingsLoading } = useQuery({
    queryKey: ['admin-library-borrowings', searchBorrowings, statusBorrowings],
    queryFn: async () => {
      const res = await api.get('/admin/library/borrowings', {
        params: { search: searchBorrowings, status: statusBorrowings }
      });
      return res.data?.data || [];
    }
  });

  const borrowings: BorrowingItem[] = useMemo(() => {
    const raw = borrowingsData || [];
    return raw.map((b: any) => ({
      ...b,
      book_copy: b.book_copy ? {
        ...b.book_copy,
        book: b.book_copy.book ? {
          ...b.book_copy.book,
          title: cleanMojibake(b.book_copy.book.title),
          author: cleanMojibake(b.book_copy.book.author),
        } : undefined,
      } : undefined,
    }));
  }, [borrowingsData]);

  // Mutations
  const saveBookMutation = useMutation({
    mutationFn: async (formData: typeof bookForm) => {
      if (editingBook) {
        const res = await api.put(`/admin/library/books/${editingBook.id}`, formData);
        return res.data;
      } else {
        const res = await api.post('/admin/library/books', formData);
        return res.data;
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Ouvrage enregistré avec succès !');
      setBookModalOpen(false);
      setEditingBook(null);
      queryClient.invalidateQueries({ queryKey: ['admin-library-books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-library-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'ouvrage.');
    }
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/library/books/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Ouvrage retiré du catalogue.');
      queryClient.invalidateQueries({ queryKey: ['admin-library-books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-library-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Impossible de supprimer cet ouvrage.');
    }
  });

  const returnBorrowingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/admin/library/borrowings/${id}/return`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Retour validé avec succès ! Exemplaire remis en rayon.');
      queryClient.invalidateQueries({ queryKey: ['admin-library-borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-library-books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-library-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de la validation du retour.');
    }
  });

  const createBorrowingMutation = useMutation({
    mutationFn: async () => {
      // Find user by email or pick first student
      const res = await api.post('/admin/library/borrowings', {
        book_id: selectedBookId,
        user_id: 2, // Student default or lookup
        due_date: borrowingDueDate,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Prêt enregistré au guichet avec succès !');
      setNewBorrowingModalOpen(false);
      setSelectedBookId('');
      queryClient.invalidateQueries({ queryKey: ['admin-library-borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-library-books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-library-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'enregistrement du prêt.');
    }
  });

  const openCreateBookModal = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      category: 'Finance',
      publisher: 'Dunod',
      publication_year: 2024,
      edition: '1ère édition',
      location_code: 'RAYON-FIN-01',
      total_copies: 4,
    });
    setBookModalOpen(true);
  };

  const openEditBookModal = (book: BookItem) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category || 'Finance',
      publisher: book.publisher || '',
      publication_year: book.publication_year || 2024,
      edition: book.edition || '',
      location_code: book.location_code || '',
      total_copies: book.total_copies,
    });
    setBookModalOpen(true);
  };

  return (
    <div className="max-w-[1500px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans pb-24 text-slate-900 dark:text-white">
      
      {/* ── 1. Header & Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-900">
            <BookOpen className="w-3.5 h-3.5" /> Administration du Fonds Documentaire
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Bibliothèque Universitaire & Prêts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Catalogue général de l'ENCG, gestion des cotes de rangement, inventaire physique et régulation des retards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setNewBorrowingModalOpen(true)}
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <BookmarkCheck className="w-4 h-4 text-indigo-600" /> Nouvel Emprunt Guichet
          </button>

          <button
            onClick={openCreateBookModal}
            className="bg-[#001A4B] hover:bg-[#082663] text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Ajouter un Ouvrage
          </button>
        </div>
      </div>

      {/* ── 2. KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Titres</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Book className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {statsData?.total_books ?? books.length}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Ouvrages uniques répertoriés</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Exemplaires Physiques</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {statsData?.total_copies ?? '-'}
          </div>
          <p className="text-[11px] text-emerald-600 font-bold">
            {statsData?.available_copies ?? '-'} disponibles en rayon
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Prêts Actifs</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {statsData?.active_borrowings ?? borrowings.filter(b => b.status === 'borrowed').length}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Livres actuellement empruntés</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Retards Critiques</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600">
            {statsData?.overdue_borrowings ?? 0}
          </div>
          <p className="text-[11px] text-rose-500 font-bold">Date d'échéance dépassée</p>
        </div>
      </div>

      {/* ── 3. Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('CATALOG')}
          className={cn(
            "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'CATALOG'
              ? "bg-[#001A4B] text-white dark:bg-blue-600 shadow"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Book className="w-4 h-4" /> Catalogue Général ({books.length})
        </button>

        <button
          onClick={() => setActiveTab('BORROWINGS')}
          className={cn(
            "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'BORROWINGS'
              ? "bg-[#001A4B] text-white dark:bg-blue-600 shadow"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <ArrowRightLeft className="w-4 h-4" /> Suivi des Prêts & Retours ({borrowings.length})
        </button>
      </div>

      {/* ── 4. Tab 1: Catalogue des Livres ── */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCatalog}
                onChange={(e) => setSearchCatalog(e.target.value)}
                placeholder="Rechercher par titre, auteur, ISBN ou cote..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#001A4B]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Discipline :</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="all">Toutes les disciplines</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Books Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 pl-4 pr-3">Ouvrage & Auteur</th>
                  <th className="py-3.5 px-3">ISBN</th>
                  <th className="py-3.5 px-3">Catégorie</th>
                  <th className="py-3.5 px-3">Cote / Rayon</th>
                  <th className="py-3.5 px-3 text-center">Disponibilité</th>
                  <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {catalogLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Spinner className="w-6 h-6 mx-auto mb-2 text-[#001A4B]" />
                      Chargement du catalogue...
                    </td>
                  </tr>
                ) : books.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Aucun ouvrage trouvé pour ces critères.
                    </td>
                  </tr>
                ) : (
                  books.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {book.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {book.author} {book.publisher ? `• ${book.publisher}` : ''} {book.publication_year ? `(${book.publication_year})` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                        {book.isbn || '—'}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          {book.category || 'Général'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-300">
                        <span className="bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                          <MapPin className="w-3 h-3" /> {book.location_code}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "font-mono font-bold text-xs",
                            book.available_copies > 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {book.available_copies} / {book.total_copies}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                            {book.available_copies > 0 ? 'En rayon' : 'Épuisé'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 pr-4 pl-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditBookModal(book)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 cursor-pointer"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Confirmer la suppression de l'ouvrage "${book.title}" ?`)) {
                                deleteBookMutation.mutate(book.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Tab 2: Suivi des Emprunts & Retours ── */}
      {activeTab === 'BORROWINGS' && (
        <div className="space-y-4">
          {/* Borrowing Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchBorrowings}
                onChange={(e) => setSearchBorrowings(e.target.value)}
                placeholder="Rechercher par étudiant, CNE, livre ou code-barres..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#001A4B]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Statut du prêt :</span>
              <select
                value={statusBorrowings}
                onChange={(e) => setStatusBorrowings(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="all">Tous les statuts</option>
                <option value="borrowed">En cours</option>
                <option value="overdue">En retard</option>
                <option value="returned">Retournés</option>
              </select>
            </div>
          </div>

          {/* Borrowings Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 pl-4 pr-3">Étudiant & Matricule</th>
                  <th className="py-3.5 px-3">Livre Emprunté</th>
                  <th className="py-3.5 px-3">Date de prêt</th>
                  <th className="py-3.5 px-3">Date limite (Échéance)</th>
                  <th className="py-3.5 px-3 text-center">Statut</th>
                  <th className="py-3.5 pr-4 pl-3 text-right">Action Guichet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {borrowingsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Spinner className="w-6 h-6 mx-auto mb-2 text-[#001A4B]" />
                      Chargement des emprunts...
                    </td>
                  </tr>
                ) : borrowings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Aucun emprunt enregistré avec ces filtres.
                    </td>
                  </tr>
                ) : (
                  borrowings.map((b) => {
                    const isOverdue = b.status === 'overdue' || (b.status === 'borrowed' && new Date(b.due_date) < new Date());

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 pl-4 pr-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {b.user ? `${b.user.first_name} ${b.user.last_name}` : 'Étudiant Inconnu'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            CNE: {b.user?.student?.cne || 'CNE-NC'} • {b.user?.email}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {b.book_copy?.book?.title || 'Ouvrage ENCG'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Exemplaire : {b.book_copy?.barcode || `BC-${b.id}`}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                          {b.borrow_date}
                        </td>

                        <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {b.due_date}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                            b.status === 'returned'
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : isOverdue
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300"
                          )}>
                            {b.status === 'returned' ? 'Retourné' : (isOverdue ? 'En retard' : 'En cours')}
                          </span>
                        </td>

                        <td className="py-3.5 pr-4 pl-3 text-right">
                          {b.status !== 'returned' ? (
                            <button
                              onClick={() => returnBorrowingMutation.mutate(b.id)}
                              disabled={returnBorrowingMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valider Retour
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Retourné le {b.return_date || b.due_date}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. Modal: Ajouter / Modifier un Livre ── */}
      {bookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setBookModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editingBook ? 'Modifier l\'Ouvrage' : 'Ajouter un Nouvel Ouvrage'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Renseignez les métadonnées officielles pour l'indexation au catalogue ENCG.
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                saveBookMutation.mutate(bookForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Titre de l'ouvrage *
                </label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  placeholder="ex: Finance d'Entreprise"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Auteur(s) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    placeholder="ex: Pierre Vernimmen"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    placeholder="978-..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Discipline / Catégorie
                  </label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="Finance">Finance</option>
                    <option value="Comptabilité & Audit">Comptabilité & Audit</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Droit des Affaires">Droit des Affaires</option>
                    <option value="Management">Management</option>
                    <option value="Économie">Économie</option>
                    <option value="Contrôle de Gestion">Contrôle de Gestion</option>
                    <option value="Méthodologie & PFE">Méthodologie & PFE</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cote / Rayon de rangement
                  </label>
                  <input
                    type="text"
                    value={bookForm.location_code}
                    onChange={(e) => setBookForm({ ...bookForm, location_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono"
                    placeholder="ex: RAYON-FIN-01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Éditeur & Année
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={bookForm.publisher}
                      onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                      className="w-2/3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      placeholder="Dunod, Dalloz"
                    />
                    <input
                      type="number"
                      value={bookForm.publication_year}
                      onChange={(e) => setBookForm({ ...bookForm, publication_year: Number(e.target.value) })}
                      className="w-1/3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Total Exemplaires Physiques
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={bookForm.total_copies}
                    onChange={(e) => setBookForm({ ...bookForm, total_copies: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBookModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saveBookMutation.isPending}
                  className="bg-[#001A4B] hover:bg-[#082663] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saveBookMutation.isPending ? <Spinner className="w-4 h-4 text-white" /> : (editingBook ? 'Enregistrer les Modifications' : 'Créer l\'Ouvrage')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Modal: Nouvel Emprunt Express (Guichet) ── */}
      {newBorrowingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setNewBorrowingModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-3">
                <BookmarkCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Enregistrer un Emprunt (Guichet)
              </h3>
              <p className="text-xs text-slate-500">
                Attribuez un exemplaire physique disponible à un étudiant.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedBookId) {
                  toast.error('Veuillez sélectionner un ouvrage.');
                  return;
                }
                createBorrowingMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ouvrage à prêter *
                </label>
                <select
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="">Sélectionner un livre en rayon...</option>
                  {books.filter(b => b.available_copies > 0).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.available_copies} dispo - {b.location_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email de l'Étudiant *
                </label>
                <input
                  type="email"
                  required
                  value={borrowingStudentEmail}
                  onChange={(e) => setBorrowingStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  placeholder="student@encg-fes.ma"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Date limite de retour (14 jours standard)
                </label>
                <input
                  type="date"
                  required
                  value={borrowingDueDate}
                  onChange={(e) => setBorrowingDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewBorrowingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createBorrowingMutation.isPending}
                  className="bg-[#001A4B] hover:bg-[#082663] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {createBorrowingMutation.isPending ? <Spinner className="w-4 h-4 text-white" /> : "Valider l'Emprunt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
