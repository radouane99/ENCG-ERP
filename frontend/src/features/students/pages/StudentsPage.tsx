import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Search, Eye, Edit2,
  Trash2, GraduationCap, ChevronLeft, ChevronRight,
  SortAsc, SortDesc, X, Mail
} from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';
import ExcelActions from '@shared/components/ui/ExcelActions';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import { Badge } from '@shared/components/ui/Badge';
import { Modal } from '@shared/components/ui/Modal';
import { Spinner } from '@shared/components/ui/Spinner';

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

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif', suspended: 'Suspendu', graduated: 'Diplômé', withdrawn: 'Retiré',
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "info" | "destructive" | "default"> = {
  active: 'success', suspended: 'warning', graduated: 'info', withdrawn: 'destructive',
};

// ── Main Page Component ─────────────────────────────────────────────
const StudentsPage: React.FC = () => {
  const { t, i18n } = useTranslation(['students', 'common']);
  const isRtl = i18n.language === 'ar';
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

  // Form State
  const [form, setForm] = useState<StudentForm>({ ...EMPTY_FORM });

  // Query
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
      toast.success(t('students:messages.create_success'));
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
      toast.success(t('students:messages.update_success'));
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
      toast.success(t('students:messages.delete_success'));
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: () => toast.error('Erreur lors de la suppression.')
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setForm({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      cne: student.cne,
      massar_code: student.massar_code ?? '',
      phone: student.phone ?? '',
      gender: student.gender,
      birth_date: student.birth_date ?? '',
      status: student.status,
      scholarship_type: student.scholarship_type ?? '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(t('students:messages.delete_confirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setForm({ ...EMPTY_FORM });
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
    return sortOrder === 'asc' ? <SortAsc size={14} className="ms-1" /> : <SortDesc size={14} className="ms-1" />;
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
            <div className="p-2 bg-[hsl(var(--color-primary))/10] text-[hsl(var(--color-primary))] rounded-xl">
              <Users size={24} />
            </div>
            {t('students:list.title')}
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            {meta.total} {t('students:list.total')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelActions
            model="students"
            label={t('students:list.title')}
            onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['students'] })}
          />
          <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
            {t('students:list.add_button')}
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Input
            icon={<Search size={18} className="text-[hsl(var(--muted-foreground))]" />}
            placeholder={t('students:list.search')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[hsl(var(--background))] border-transparent hover:border-[hsl(var(--border))] focus:border-[hsl(var(--ring))]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--foreground))] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent min-w-[160px] cursor-pointer transition-all hover:border-[hsl(var(--muted-foreground))/30]"
        >
          <option value="">{t('students:list.filter_all_status')}</option>
          <option value="active">{t('students:status.active')}</option>
          <option value="suspended">{t('students:status.suspended')}</option>
          <option value="graduated">{t('students:status.graduated')}</option>
          <option value="withdrawn">{t('students:status.withdrawn')}</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedStudents.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-[hsl(var(--color-primary))/5] border border-[hsl(var(--color-primary))/20] rounded-xl animate-in fade-in slide-in-from-top-2">
          <span className="text-[hsl(var(--color-primary))] text-sm font-semibold px-2">
            {selectedStudents.size} {t('students:list.selected')}
          </span>
          <Button variant="destructive" size="sm" onClick={() => {}}>
            {t('students:list.delete_selected')}
          </Button>
          <button onClick={() => setSelectedStudents(new Set())} className="ms-auto text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] p-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] uppercase text-xs tracking-wider font-semibold border-b border-[hsl(var(--border))]">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === students.length && students.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]"
                  />
                </th>
                <th 
                  className="px-4 py-4 cursor-pointer hover:text-[hsl(var(--foreground))] transition-colors"
                  onClick={() => handleSort('last_name')}
                >
                  <div className="flex items-center">
                    {t('students:list.columns.student')} <SortIcon field="last_name" />
                  </div>
                </th>
                <th className="px-4 py-4">{t('students:list.columns.cne')}</th>
                <th className="px-4 py-4">{t('students:list.columns.filiere')}</th>
                <th className="px-4 py-4">{t('students:list.columns.status')}</th>
                <th className="px-4 py-4">{t('students:list.columns.scholarship')}</th>
                <th className="px-4 py-4 text-end">{t('students:list.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Spinner size="lg" className="mx-auto" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-[hsl(var(--muted-foreground))]">
                    <div className="w-16 h-16 bg-[hsl(var(--muted))] rounded-full flex items-center justify-center mx-auto mb-4">
                      <GraduationCap size={32} className="opacity-50" />
                    </div>
                    <p className="text-base font-medium text-[hsl(var(--foreground))]">
                      {t('students:list.empty_title')}
                    </p>
                    <p className="text-sm mt-1 mb-4">
                      {t('students:list.empty_subtitle')}
                    </p>
                    <Button onClick={handleOpenCreate} variant="outline" icon={<Plus size={16} />}>
                      {t('students:list.add_first')}
                    </Button>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-[hsl(var(--muted)/50)] transition-colors group">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                            {student.last_name} {student.first_name}
                          </p>
                          <p className="text-[hsl(var(--muted-foreground))] text-xs mt-0.5 flex items-center gap-1">
                            <Mail size={12} /> {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono font-medium text-[hsl(var(--foreground))]">{student.cne}</p>
                      <p className="text-[hsl(var(--muted-foreground))] text-xs mt-0.5">{student.student_number}</p>
                    </td>
                    <td className="px-4 py-3">
                      {student.current_filiere ? (
                        <div>
                          <Badge variant="outline" className="font-semibold bg-[hsl(var(--background))] border-[hsl(var(--border))]">
                            {student.current_filiere}
                          </Badge>
                          <p className="text-[hsl(var(--muted-foreground))] text-xs mt-1.5 ms-1">
                            S{student.current_semester} · {student.current_group ?? '—'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[hsl(var(--muted-foreground))] text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[student.status] || 'default'} size="sm">
                        {isRtl ? t(`students:status.${student.status}`) : STATUS_LABELS[student.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {student.scholarship_type ? (
                        <Badge variant="info" size="sm" className="capitalize bg-purple-500/10 text-purple-600 dark:text-purple-400 border-transparent">
                          {student.scholarship_type}
                        </Badge>
                      ) : (
                        <span className="text-[hsl(var(--muted-foreground))] text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(student)}
                          className="h-8 w-8 p-0 text-[hsl(var(--muted-foreground))] hover:text-amber-600 hover:bg-amber-500/10"
                          aria-label="Modifier"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(student.id)}
                          className="h-8 w-8 p-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--color-destructive))] hover:bg-[hsl(var(--color-destructive))/10]"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/30)]">
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              {t('students:list.page', { current: meta.current_page, total: meta.last_page })}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 p-0"
              >
                <ChevronLeft size={16} className="rtl:rotate-180" />
              </Button>
              {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  variant={page === p ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 p-0 font-medium ${page !== p && 'text-[hsl(var(--muted-foreground))]'}`}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={page >= meta.last_page}
                className="w-9 h-9 p-0"
              >
                <ChevronRight size={16} className="rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Modal for Create / Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingStudent(null); }}
        title={editingStudent ? (t('students:form.edit_title')) : (t('students:form.create_title'))}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section: Identité */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider border-b border-[hsl(var(--border))] pb-2">
              {t('students:form.sections.identity')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{t('students:form.fields.first_name')} *</label>
                <Input required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Fatima" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{t('students:form.fields.last_name')} *</label>
                <Input required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="ALAOUI" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{t('students:form.fields.gender')} *</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as 'male'|'female' })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="male">{t('students:form.gender.male')}</option>
                  <option value="female">{t('students:form.gender.female')}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{t('students:form.fields.birth_date')}</label>
                <Input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Section: Administration */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider border-b border-[hsl(var(--border))] pb-2">
              {t('students:form.sections.administration')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[hsl(var(--foreground))]">CNE *</label>
                <Input required value={form.cne} onChange={e => setForm({ ...form, cne: e.target.value })} placeholder="R134567890" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[hsl(var(--foreground))]">Code Massar</label>
                <Input value={form.massar_code} onChange={e => setForm({ ...form, massar_code: e.target.value })} placeholder="G123456789" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[hsl(var(--foreground))]">Email *</label>
                <Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="f.alaoui@etu.encg-fes.ma" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{t('students:form.fields.phone')}</label>
                <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+212 6xx xxx xxx" />
              </div>
            </div>
          </div>

          {/* Section: Académique */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider border-b border-[hsl(var(--border))] pb-2">
              {t('students:form.sections.academic')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{t('students:list.columns.status')}</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">
                  <option value="active">{t('students:status.active')}</option>
                  <option value="suspended">{t('students:status.suspended')}</option>
                  <option value="graduated">{t('students:status.graduated')}</option>
                  <option value="withdrawn">{t('students:status.withdrawn')}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{t('students:list.columns.scholarship')}</label>
                <select value={form.scholarship_type} onChange={e => setForm({ ...form, scholarship_type: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">
                  <option value="">{t('students:scholarship.none')}</option>
                  <option value="excellence">{t('students:scholarship.excellence')}</option>
                  <option value="social">{t('students:scholarship.social')}</option>
                  <option value="state">{t('students:scholarship.state')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[hsl(var(--border))]">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              {t('common:buttons.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isMutating} isLoading={isMutating}>
              {editingStudent ? (t('common:buttons.edit')) : (t('common:buttons.save'))}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentsPage;
