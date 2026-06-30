import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Search, Filter, Eye, Edit2,
  Trash2, GraduationCap, ChevronLeft, ChevronRight,
  SortAsc, SortDesc, X
} from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';
import ExcelActions from '@shared/components/ui/ExcelActions';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/Table';
import { Card } from '@shared/components/ui/Card';

// ── Types ──────────────────────────────────────────────────────────
interface Student {
  id: number;
  student_number: string;
  cne: string;
  massar_code?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  gender: 'male' | 'female';
  birth_date?: string;
  status: 'active' | 'suspended' | 'graduated' | 'withdrawn';
  current_filiere?: string;
  current_semester?: number;
  current_group?: string;
  scholarship_type: string | null;
}

interface StudentForm {
  first_name: string;
  last_name: string;
  email: string;
  cne: string;
  massar_code: string;
  phone: string;
  gender: 'male' | 'female';
  birth_date: string;
  status: string;
  scholarship_type: string;
}

type SortField = 'last_name' | 'student_number' | 'created_at';
type SortOrder = 'asc' | 'desc';

const EMPTY_FORM: StudentForm = {
  first_name: '', last_name: '', email: '', cne: '', massar_code: '',
  phone: '', gender: 'male', birth_date: '', status: 'active', scholarship_type: ''
};

const STATUS_STYLES = {
  active:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  suspended: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  graduated: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  withdrawn: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif', suspended: 'Suspendu', graduated: 'Diplômé', withdrawn: 'Retiré',
};

// ── Modal Component ─────────────────────────────────────────────────
const StudentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StudentForm) => void;
  initialData?: Student | null;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onSave, initialData, isLoading }) => {
  const [form, setForm] = useState<StudentForm>(() =>
    initialData ? {
      first_name: initialData.first_name,
      last_name: initialData.last_name,
      email: initialData.email,
      cne: initialData.cne,
      massar_code: initialData.massar_code ?? '',
      phone: initialData.phone ?? '',
      gender: initialData.gender,
      birth_date: initialData.birth_date ?? '',
      status: initialData.status,
      scholarship_type: initialData.scholarship_type ?? '',
    } : { ...EMPTY_FORM }
  );

  React.useEffect(() => {
    if (isOpen) {
      setForm(initialData ? {
        first_name: initialData.first_name,
        last_name: initialData.last_name,
        email: initialData.email,
        cne: initialData.cne,
        massar_code: initialData.massar_code ?? '',
        phone: initialData.phone ?? '',
        gender: initialData.gender,
        birth_date: initialData.birth_date ?? '',
        status: initialData.status,
        scholarship_type: initialData.scholarship_type ?? '',
      } : { ...EMPTY_FORM });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const set = (key: keyof StudentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };

  const inputCls = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-all";
  const labelCls = "block text-xs font-bold text-white/40 uppercase mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1d2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="font-bold text-lg text-white">
            {initialData ? 'Modifier l\'étudiant' : 'Nouvel Étudiant'}
          </h3>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Identity */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase mb-3 border-b border-white/5 pb-2">Identité</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Prénom *</label>
                <input type="text" required value={form.first_name} onChange={set('first_name')} className={inputCls} placeholder="Fatima" />
              </div>
              <div>
                <label className={labelCls}>Nom *</label>
                <input type="text" required value={form.last_name} onChange={set('last_name')} className={inputCls} placeholder="ALAOUI" />
              </div>
              <div>
                <label className={labelCls}>Genre *</label>
                <select value={form.gender} onChange={set('gender')} className={inputCls}>
                  <option value="male">Masculin</option>
                  <option value="female">Féminin</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Date de naissance</label>
                <input type="date" value={form.birth_date} onChange={set('birth_date')} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Administrative Codes */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase mb-3 border-b border-white/5 pb-2">Codes Administratifs</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>CNE *</label>
                <input type="text" required value={form.cne} onChange={set('cne')} className={inputCls} placeholder="R134567890" />
              </div>
              <div>
                <label className={labelCls}>Code Massar</label>
                <input type="text" value={form.massar_code} onChange={set('massar_code')} className={inputCls} placeholder="G123456789" />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase mb-3 border-b border-white/5 pb-2">Contact</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" required value={form.email} onChange={set('email')} className={inputCls} placeholder="f.alaoui@etu.encg-fes.ma" />
              </div>
              <div>
                <label className={labelCls}>Téléphone</label>
                <input type="tel" value={form.phone} onChange={set('phone')} className={inputCls} placeholder="+212 6xx xxx xxx" />
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase mb-3 border-b border-white/5 pb-2">Informations Académiques</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Statut</label>
                <select value={form.status} onChange={set('status')} className={inputCls}>
                  <option value="active">Actif</option>
                  <option value="suspended">Suspendu</option>
                  <option value="graduated">Diplômé</option>
                  <option value="withdrawn">Retiré</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Bourse</label>
                <select value={form.scholarship_type} onChange={set('scholarship_type')} className={inputCls}>
                  <option value="">Aucune</option>
                  <option value="excellence">Excellence</option>
                  <option value="social">Social</option>
                  <option value="state">État</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              Annuler
            </button>
            <button type="submit" disabled={isLoading} className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-60">
              {isLoading ? 'Enregistrement...' : (initialData ? 'Mettre à jour' : 'Enregistrer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page Component ─────────────────────────────────────────────
const StudentsPage: React.FC = () => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('last_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const perPage = 15;

  // Query — real API, no fallback mock
  const { data, isLoading } = useQuery({
    queryKey: ['students', { search, statusFilter, sortField, sortOrder, page }],
    queryFn: () =>
      api.get('/students', {
        params: { search, status: statusFilter, sort: sortField, order: sortOrder, page, per_page: perPage },
      }).then(r => r.data),
  });

  const students: Student[] = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, per_page: perPage, current_page: 1, last_page: 1 };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: StudentForm) => api.post('/students', data),
    onSuccess: () => {
      toast.success('Étudiant créé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowModal(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erreur lors de la création.';
      toast.error(msg);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StudentForm }) => api.put(`/students/${id}`, data),
    onSuccess: () => {
      toast.success('Étudiant mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowModal(false);
      setEditingStudent(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erreur lors de la mise à jour.';
      toast.error(msg);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast.success('Étudiant supprimé.');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: () => toast.error('Erreur lors de la suppression.')
  });

  const handleSave = (form: StudentForm) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setShowModal(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />;
  };

  const toggleSelect = (id: number) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            Gestion des Étudiants
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {meta.total} étudiant{meta.total > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExcelActions
            model="students"
            label="Étudiants"
            onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['students'] })}
          />
          <Button
            onClick={handleOpenCreate}
            size="sm"
          >
            <Plus size={14} className="mr-1.5" /> Nouvel étudiant
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            icon={<Search size={15} />}
            placeholder="Rechercher par nom, CNE, n° étudiant..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-xl text-sm text-white px-3 py-2.5 focus:outline-none focus:border-blue-500/50 min-w-[140px]"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="suspended">Suspendu</option>
          <option value="graduated">Diplômé</option>
          <option value="withdrawn">Retiré</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedStudents.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <span className="text-blue-400 text-sm font-medium">{selectedStudents.size} sélectionné{selectedStudents.size > 1 ? 's' : ''}</span>
          <button className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-lg">Supprimer</button>
          <button onClick={() => setSelectedStudents(new Set())} className="ml-auto text-white/40 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedStudents.size === students.length && students.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded accent-primary"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort('last_name')}
              >
                <span className="flex items-center gap-1">Étudiant <SortIcon field="last_name" /></span>
              </TableHead>
              <TableHead>CNE / N°</TableHead>
              <TableHead>Filière</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Bourse</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-white/30">
                    <GraduationCap size={40} className="mx-auto mb-3 opacity-20" />
                    <p>Aucun étudiant trouvé</p>
                    <button onClick={handleOpenCreate} className="mt-3 text-xs text-blue-400 hover:text-blue-300">
                      + Ajouter le premier étudiant
                    </button>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="group">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="w-4 h-4 rounded accent-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.last_name} {student.first_name}</p>
                          <p className="text-muted-foreground text-xs">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-mono">{student.cne}</p>
                      <p className="text-muted-foreground text-xs">{student.student_number}</p>
                    </TableCell>
                    <TableCell>
                      {student.current_filiere ? (
                        <div>
                          <span className="text-sm font-medium">{student.current_filiere}</span>
                          <p className="text-muted-foreground text-xs">S{student.current_semester} · {student.current_group ?? '—'}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[student.status]}`}>
                        {STATUS_LABELS[student.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {student.scholarship_type ? (
                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full capitalize">
                          {student.scholarship_type}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(student)}
                          className="h-8 w-8 hover:text-amber-500 hover:bg-amber-500/10"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(student.id)}
                          className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
          </TableBody>
        </Table>
      </Card>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <p className="text-white/40 text-sm">
              Page {meta.current_page} sur {meta.last_page} · {meta.total} étudiants
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 text-xs rounded-lg transition-all ${page === p ? 'bg-blue-600 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={page >= meta.last_page}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      {/* Student Modal */}
      <StudentModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingStudent(null); }}
        onSave={handleSave}
        initialData={editingStudent}
        isLoading={isMutating}
      />
    </div>
  );
};

export default StudentsPage;
