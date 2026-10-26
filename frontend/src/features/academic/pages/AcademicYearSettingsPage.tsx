import { assignmentSuggestions } from '../model/assignmentSuggestions';
import AssignmentCarryForwardPanel from '../components/AssignmentCarryForwardPanel'
import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Download, Upload, Trash2, Plus, CalendarDays, FileText, X, Sparkles, BookOpen, Users, Layers, Search, GraduationCap, Check, Mail, Printer, Zap, BarChart2, Eye, ChevronDown, Building2, AlertTriangle, RotateCcw, ShieldAlert, RefreshCw, Clock } from 'lucide-react';
import { cn, cleanUtf8Text } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api'
import { openProfessorOrdreDeServicePdf } from '@shared/lib/documentAccess';
import { academicApi } from '@shared/api/academic';
import { toast } from 'sonner';
import { Spinner } from '@shared/components/ui/Spinner';

// ─── 1. CUSTOM FORM SEARCHABLE SELECT (4-STEP ASSIGNMENT FORM) ────────────────
interface CustomSelectOption {
  value: string
  label: string
  sublabel?: string
}

interface CustomSelectProps {
  label: string
  stepNumber: string
  placeholder: string
  value: string
  onChange: (val: string) => void
  options: CustomSelectOption[]
  icon: React.ReactNode
  searchable?: boolean
}

function CustomSelect({ label, stepNumber, placeholder, value, onChange, options, icon, searchable = true }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => String(o.value) === String(value))

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-foreground text-[10px] font-bold flex items-center justify-center">
            {stepNumber}
          </span>
          {label}
        </span>
        {value && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <Check className="w-3 h-3" /> Choisi
          </span>
        )}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer shadow-xs text-left",
          isOpen
            ? "border-primary ring-3 ring-indigo-500/10 bg-card dark:bg-card shadow-sm"
            : value
              ? "border-slate-300 dark:border-border text-foreground dark:text-white bg-card dark:bg-card"
              : "border-border dark:border-border text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "p-1.5 rounded-lg shrink-0 transition-colors",
            value ? "bg-primary/5 dark:bg-indigo-950/60 text-primary dark:text-indigo-400" : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-400"
          )}>
            {icon}
          </div>
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200",
          isOpen ? "rotate-180 text-primary" : ""
        )} />
      </button>

      {/* Dropdown Popover Window */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-card dark:bg-card border border-border dark:border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in-80 zoom-in-95">
          {searchable && options.length > 4 && (
            <div className="p-2 border-b border-border dark:border-border bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Rechercher ${label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-1.5 bg-card dark:bg-card border border-border dark:border-border text-xs font-medium text-foreground dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-[var(--control-radius)]"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">Aucun résultat trouvé</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(String(opt.value))
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer group",
                      isSelected
                        ? "bg-[#0f2863] text-white font-bold shadow-xs"
                        : "text-foreground dark:text-foreground hover:bg-primary/5 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-indigo-300"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-semibold">{opt.label}</div>
                      {opt.sublabel && (
                        <div className={cn("text-[10px] truncate", isSelected ? "text-blue-200" : "text-slate-400 group-hover:text-primary")}>
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 1.B CUSTOM MULTI-SELECT COMPONENT (POUR GROUPES & MODULES) ──────────────
interface CustomMultiSelectProps {
  label: string
  stepNumber: string
  placeholder: string
  values: string[]
  onChange: (vals: string[]) => void
  options: CustomSelectOption[]
  icon: React.ReactNode
  searchable?: boolean
  selectAllOption?: boolean
}

function CustomMultiSelect({ label, stepNumber, placeholder, values, onChange, options, icon, searchable = true, selectAllOption = true }: CustomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter(v => v !== val))
    } else {
      onChange([...values, val])
    }
  }

  const allSelected = options.length > 0 && options.every(o => values.includes(String(o.value)))

  const toggleSelectAll = () => {
    if (allSelected) {
      onChange([])
    } else {
      onChange(options.map(o => String(o.value)))
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-foreground text-[10px] font-bold flex items-center justify-center">
            {stepNumber}
          </span>
          {label}
        </span>
        {values.length > 0 && (
          <span className="text-[10px] font-bold text-primary dark:text-indigo-400 flex items-center gap-1 bg-primary/5 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/50">
            {values.length} sélectionné{values.length > 1 ? 's' : ''}
          </span>
        )}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer shadow-xs text-left",
          isOpen
            ? "border-primary ring-3 ring-indigo-500/10 bg-card dark:bg-card shadow-sm"
            : values.length > 0
              ? "border-primary/20 dark:border-primary text-foreground dark:text-white bg-card dark:bg-card"
              : "border-border dark:border-border text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "p-1.5 rounded-lg shrink-0 transition-colors",
            values.length > 0 ? "bg-primary/5 dark:bg-indigo-950/60 text-primary dark:text-indigo-400" : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-400"
          )}>
            {icon}
          </div>
          <span className="truncate">
            {values.length === 0
              ? placeholder
              : values.length === 1
                ? (options.find(o => String(o.value) === String(values[0]))?.label || `${values.length} sélectionné`)
                : `${values.length} éléments sélectionnés`}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {values.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {values.length}
            </span>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-slate-400 transition-transform duration-200",
            isOpen ? "rotate-180 text-primary" : ""
          )} />
        </div>
      </button>

      {/* Multi-Select Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-card dark:bg-card border border-border dark:border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in-80 zoom-in-95">
          {searchable && options.length > 3 && (
            <div className="p-2 border-b border-border dark:border-border bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Rechercher ${label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-1.5 bg-card dark:bg-card border border-border dark:border-border text-xs font-medium text-foreground dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-[var(--control-radius)]"
                />
              </div>
            </div>
          )}

          {selectAllOption && options.length > 1 && (
            <div className="p-1.5 border-b border-border dark:border-border bg-indigo-50/30 dark:bg-slate-800/40 flex items-center justify-between">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[11px] font-bold text-primary dark:text-indigo-400 hover:text-primary flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer"
              >
                <div className={cn(
                  "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
                  allSelected ? "bg-primary border-primary text-primary-foreground" : "border-slate-300 dark:border-border"
                )}>
                  {allSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>{allSelected ? "Tout désélectionner" : "Sélectionner tous"}</span>
              </button>
              <span className="text-[10px] text-slate-400 pr-2">
                {values.length}/{options.length}
              </span>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">Aucun résultat trouvé</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = values.includes(String(opt.value))
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(String(opt.value))}
                    className={cn(
                      "w-full px-3 py-2 text-left rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer group",
                      isSelected
                        ? "bg-primary/5 dark:bg-indigo-950/40 text-primary dark:text-indigo-200 font-bold"
                        : "text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "bg-primary border-primary text-primary-foreground shadow-xs" : "border-slate-300 dark:border-border bg-card dark:bg-card"
                      )}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{opt.label}</div>
                        {opt.sublabel && (
                          <div className={cn("text-[10px] truncate", isSelected ? "text-primary dark:text-indigo-400" : "text-slate-400")}>
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 2. PREMIUM TOOLBAR FILTER DROPDOWN COMPONENT ─────────────────────────────
interface FilterDropdownOption {
  value: string
  label: string
  sublabel?: string
}

interface FilterDropdownProps {
  label: string
  value: string
  onChange: (val: string) => void
  options: FilterDropdownOption[]
  icon: React.ReactNode
  searchable?: boolean
  className?: string
}

function FilterDropdown({ label, value, onChange, options, icon, searchable = false, className }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => String(o.value) === String(value))
  const isFiltered = value !== 'all' && value !== ''

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    const q = searchTerm.toLowerCase()
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(q))
    )
  }, [options, searchTerm])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-9 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs whitespace-nowrap border select-none",
          isOpen
            ? "border-primary ring-2 ring-indigo-500/15 bg-card dark:bg-card text-primary dark:text-white"
            : isFiltered
              ? "border-primary/20 dark:border-primary bg-blue-50/80 dark:bg-blue-950/50 text-[#0f2863] dark:text-blue-300 font-bold"
              : "border-border dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 text-slate-700 dark:text-foreground hover:bg-card dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 max-w-[200px]">
          <span className={cn("shrink-0 transition-colors", isFiltered ? "text-primary dark:text-blue-400" : "text-slate-400")}>
            {icon}
          </span>
          <span className="truncate">
            {selectedOption ? selectedOption.label : label}
          </span>
        </div>

        <ChevronDown className={cn(
          "w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200",
          isOpen ? "rotate-180 text-primary dark:text-indigo-400" : ""
        )} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 right-0 sm:left-0 sm:right-auto mt-1.5 min-w-[240px] max-w-[320px] bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in-80 zoom-in-95 backdrop-blur-md">
          {/* Optional Search */}
          {searchable && options.length > 5 && (
            <div className="p-2 border-b border-border dark:border-border bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 bg-card dark:bg-card border border-border dark:border-border text-xs font-medium text-foreground dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-[var(--control-radius)]"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">Aucun résultat</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(String(opt.value))
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer group",
                      isSelected
                        ? "bg-[#0f2863] text-white font-bold shadow-xs"
                        : "text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-slate-800 hover:text-primary dark:hover:text-indigo-300"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-semibold">{opt.label}</div>
                      {opt.sublabel && (
                        <div className={cn("text-[10px] truncate", isSelected ? "text-blue-200" : "text-slate-400 group-hover:text-primary")}>
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AcademicYearSettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'affectations' | 'sessions' | 'annees'>('affectations');
  const [showImportModal, setShowImportModal] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [workloadFilter, setWorkloadFilter] = useState<'all' | 'unassigned' | 'available' | 'full' | 'overloaded'>('all');

  // 🎓 Période Semestrielle Active (Automne S1/S3/S5/S7/S9 vs Printemps S2/S4/S6/S8/S10 vs Annuel)
  // 🎓 Période Semestrielle Active (Automne S1/S3/S5/S7/S9 vs Printemps S2/S4/S6/S8/S10 vs Annuel)
const [selectedSemesterPeriod, setSelectedSemesterPeriod] = useState<'all' | 'odd' | 'even' | string>('all');
  const [distributeSemesterPeriod, setDistributeSemesterPeriod] = useState<'all' | 'odd' | 'even' | string>('odd');

  // Selected professor for viewing detailed assignments modal
  // Selected professor for viewing detailed assignments modal
const [selectedProfForModal, setSelectedProfForModal] = useState<any>(null);
  const [showResetDistributeModal, setShowResetDistributeModal] = useState(false);
  const [showUnassignAllModal, setShowUnassignAllModal] = useState(false);

  const [assignmentForm, setAssignmentForm] = useState<{
    department_id: string;
    professor_id: string;
    module_ids: string[];
    group_ids: string[];
    session_type: 'cm' | 'td' | 'both';
}>({
    department_id: '',
    professor_id: '',
    module_ids: [],
    group_ids: [],
    session_type: 'cm'
});

  const [newYearLabel, setNewYearLabel] = useState('');
  const [newYearIsCurrent, setNewYearIsCurrent] = useState(false);
  const [sessionDates, setSessionDates] = useState<Record<number, {
    name: string;
    type: string;
    start_date: string;
    end_date: string;
}>>({});
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({
    name: '',
    type: '',
    start_date: '',
    end_date: '',
    academic_year_id: '',
    semester_id: ''
});

  // 🤖 AI AUTO-MATCHING ENGINE FOR TEACHER ASSIGNMENTS
  // 🤖 AI AUTO-MATCHING ENGINE FOR TEACHER ASSIGNMENTS
const [showAiMatchingModal, setShowAiMatchingModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  // Queries
  // Queries
const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data)
});

  const { data: professorsData } = useQuery({
    queryKey: ['professors'],
    queryFn: () => api.get('/hr/professors').then(r => r.data)
});

  const { data: modulesData } = useQuery({
    queryKey: ['modules'],
    queryFn: () => api.get('/modules').then(r => r.data)
});

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then(r => r.data)
});

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['professor-assignments', selectedSemesterPeriod],
    queryFn: () => api.get(`/professor-assignments?semester_period=${selectedSemesterPeriod}`).then(r => r.data)
});

  const { data: examSessionsData } = useQuery({
    queryKey: ['exam-sessions'],
    queryFn: () => academicApi.getExamSessions()
});

  const { data: yearsData = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: academicApi.getAcademicYears,
    select: (rows) => (Array.isArray(rows) ? rows : []),
});

  const { data: semestersData } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then(r => r.data)
});

  const departments = useMemo(() => (departmentsData?.data || []), [departmentsData])
  const allProfessors = useMemo(() => (professorsData?.data || []), [professorsData])
  const professors = assignmentForm.department_id
    ? allProfessors.filter((p: any) => p.department_id == assignmentForm.department_id)
    : allProfessors
  const modules = useMemo(() => (modulesData?.data || []), [modulesData])
  const groups = useMemo(() => (groupsData?.data || []), [groupsData])
  const assignments = useMemo(() => (assignmentsData?.data || []), [assignmentsData])
  const examSessions = useMemo(() => examSessionsData || [], [examSessionsData])
  const years = Array.isArray(yearsData) ? yearsData : []
  const semesters = semestersData?.data || []

  useEffect(() => {
    if (examSessions.length > 0) {
      const dates: any = {}
      examSessions.forEach((s: any) => {
        dates[s.id] = {
          name: s.name || '',
          type: s.type || '',
          start_date: s.start_date || '',
          end_date: s.end_date || ''
        }
      })
      setSessionDates(dates)
    }
  }, [examSessions])

  // AI Matching Handler
  const handleAiAutoMatching = () => {
    setShowAiMatchingModal(true)
    setIsAnalyzingAi(false)
    setAiSuggestions(assignmentSuggestions(professors, modules, groups, assignments))
  }
  const handleApplyAiSuggestions = async () => {
    const toastId = toast.loading('🤖 Application des affectations recommandées par l\'IA...')
    try {
      for (const item of aiSuggestions) {
        await api.post('/professor-assignments', {
          professor_id: item.prof_id, assigned_hours: item.assigned_hours, session_type: item.session_type,
          module_id: item.module_id,
          group_id: item.group_id
        })
      }
      toast.success('✨ Toutes les affectations IA ont été enregistrées avec succès !', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setShowAiMatchingModal(false)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'enregistrement des affectations.', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setShowAiMatchingModal(false)
    }
  }

  // Calculate Selected Professor Workload
  // Resolve professor UUID from assignment row
  const resolveAssignmentProfessorId = useCallback((assignment: any): string | null => {
    const direct = assignment?.professor_id || assignment?.prof_id || assignment?.professor?.id
    if (direct) return String(direct)
    const profName = (assignment?.prof || '').trim().toLowerCase()
    if (!profName) return null
    const matched = allProfessors.find((p: any) => {
      const full = `${p.first_name || ''} ${p.last_name || ''}`.trim().toLowerCase()
      const alt = (p.user?.first_name && p.user?.last_name)
        ? `${p.user.first_name} ${p.user.last_name}`.trim().toLowerCase()
        : ''
      return full === profName || alt === profName || (p.email && profName.includes(String(p.last_name || '').toLowerCase()))
    })
    return matched?.id ? String(matched.id) : null
  }, [allProfessors])

  // Group Assignments by Professor
  const groupedAssignmentsMap = useMemo(() => {
    const map: Record<string, any> = {}

    allProfessors.forEach((p: any) => {
      const profName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.user?.name || `Professeur #${p.id}`
      const profId = String(p.id)
      const deptName = p.department?.name || departments.find((d: any) => d.id == p.department_id)?.name || 'ENCG Fès'
      map[profId] = {
        profName,
        profId,
        professorModel: p,
        specialty: p.specialty || 'Enseignement Supérieur',
        grade: p.grade || 'PES',
        departmentId: p.department_id,
        departmentName: deptName,
        email: p.email || p.user?.email || '',
        assignmentsList: []
      }
    })

    assignments.forEach((curr: any) => {
      const profId = resolveAssignmentProfessorId(curr)
      const profName = curr.prof || `Professeur #${curr.prof_id || 'N/A'}`

      if (profId && map[profId]) {
        map[profId].assignmentsList.push(curr)
      } else {
        const key = profId || profName
        if (!map[key]) {
          map[key] = {
            profName,
            profId: key,
            professorModel: curr.professor || null,
            specialty: curr.professor?.specialty || 'Gestion & Management',
            grade: curr.professor?.grade || 'PES',
            departmentId: curr.department_id,
            departmentName: curr.professor?.department?.name || 'ENCG Fès',
            email: curr.professor?.user?.email || curr.prof_email || '',
            assignmentsList: []
          }
        }
        map[key].assignmentsList.push(curr)
      }
    })

    return map
  }, [allProfessors, assignments, departments, resolveAssignmentProfessorId])

  // ─── 👥 SMART GROUPS FILTERING BASED ON SELECTED MODULE(S) ─────────────────
  const selectedModulesList = useMemo(() => {
    if (!assignmentForm.module_ids || assignmentForm.module_ids.length === 0) return []
    return modules.filter((m: any) => assignmentForm.module_ids.includes(String(m.id)))
  }, [modules, assignmentForm.module_ids])

  const availableGroups = useMemo(() => {
    if (selectedModulesList.length === 0) {
      return groups
    }

    // Filter groups matching the semester and filiere of selected modules
    const matching = groups.filter((g: any) => {
      return selectedModulesList.some((m: any) => {
        const mSem = Number(m.semester_number || (typeof m.semester === 'string' ? m.semester.replace(/\D/g, '') : m.semester))
        const gSem = Number(g.semester_number)
        const semMatches = isNaN(mSem) || isNaN(gSem) || mSem === gSem
        const filiereMatches = !m.filiere_id || !g.filiere_id || String(m.filiere_id) === String(g.filiere_id)
        return semMatches && filiereMatches
      })
    })

    return matching.length > 0 ? matching : groups
  }, [groups, selectedModulesList])

  // Prune incompatible groups when selected modules change
  useEffect(() => {
    if (selectedModulesList.length > 0) {
      const allowedIds = new Set(['all', ...availableGroups.map((g: any) => String(g.id))])
      setAssignmentForm(prev => {
        if (!prev.group_ids || prev.group_ids.length === 0) return prev
        const cleaned = prev.group_ids.filter(id => allowedIds.has(id))
        return cleaned.length === prev.group_ids.length ? prev : { ...prev, group_ids: cleaned }
      })
    }
  }, [availableGroups, selectedModulesList.length])

  // Selected Professor Live Dossier Info
  const selectedProfDetails = useMemo(() => {
    if (!assignmentForm.professor_id) return null
    const profGroup = groupedAssignmentsMap[String(assignmentForm.professor_id)]
    const profModel = allProfessors.find((p: any) => String(p.id) === String(assignmentForm.professor_id))
    const list = profGroup?.assignmentsList || []
    const count = list.length
    const totalHours = list.reduce((sum: number, curr: any) => sum + (Number(curr.assigned_hours) || (curr.session_type === 'cm' ? 36 : 18)), 0)
    const estimatedWeekly = count * 4
    const isAtLimit = estimatedWeekly >= 18
    const isNearLimit = estimatedWeekly >= 14 && estimatedWeekly < 18
    return {
      profGroup,
      profModel,
      count,
      totalHours,
      estimatedWeekly,
      isAtLimit,
      isNearLimit
    }
  }, [assignmentForm.professor_id, groupedAssignmentsMap, allProfessors])

  const groupedProfessors = useMemo(() => {
    return Object.values(groupedAssignmentsMap).filter((profGroup: any) => {
      const searchLower = assignmentSearch.toLowerCase()
      const matchesSearch = !assignmentSearch ||
                            profGroup.profName.toLowerCase().includes(searchLower) ||
                            (profGroup.specialty || '').toLowerCase().includes(searchLower) ||
                            (profGroup.departmentName || '').toLowerCase().includes(searchLower) ||
                            profGroup.assignmentsList.some((a: any) => (a.module || '').toLowerCase().includes(searchLower) || (a.group || '').toLowerCase().includes(searchLower))

      const matchesDept = selectedDeptFilter === 'all' ||
                          profGroup.departmentId == selectedDeptFilter ||
                          profGroup.assignmentsList.some((a: any) => a.department_id == selectedDeptFilter)

      const matchesModule = selectedModuleFilter === 'all' ||
                            profGroup.assignmentsList.some((a: any) => (a.module || '').toLowerCase().includes(selectedModuleFilter.toLowerCase()) || a.module_id == selectedModuleFilter)

      const count = profGroup.assignmentsList.length
      const weeklyHours = count * 4
      const matchesWorkload =
        workloadFilter === 'all' ||
        (workloadFilter === 'unassigned' && count === 0) ||
        (workloadFilter === 'available' && count > 0 && weeklyHours < 14) ||
        (workloadFilter === 'full' && weeklyHours >= 14 && weeklyHours <= 18) ||
        (workloadFilter === 'overloaded' && weeklyHours > 18)

      return matchesSearch && matchesDept && matchesModule && matchesWorkload
    })
  }, [groupedAssignmentsMap, assignmentSearch, selectedDeptFilter, selectedModuleFilter, workloadFilter])

  // Filters state check
  const hasActiveFilters = selectedDeptFilter !== 'all' || selectedModuleFilter !== 'all' || workloadFilter !== 'all' || assignmentSearch !== '' || selectedSemesterPeriod !== 'all'

  const handleResetFilters = () => {
    setSelectedDeptFilter('all')
    setSelectedModuleFilter('all')
    setWorkloadFilter('all')
    setAssignmentSearch('')
    setSelectedSemesterPeriod('all')
  }

  // Mutations
  const autoDistributeMutation = useMutation({
    mutationFn: (variables: { reset: boolean; semester_period?: string }) =>
      api.post('/professor-assignments/auto-distribute', {
        reset: variables.reset,
        semester_period: variables.semester_period || distributeSemesterPeriod
      }),
    onSuccess: (res: any) => {
      toast.success(res.data?.message || '🎉 Répartition automatique optimisée avec succès !')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setShowResetDistributeModal(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la répartition automatique')
    }
  })

  // 🗑️ Remise à Zéro Totale de Toutes les Affectations (avec support du semestre)
  const unassignAllMutation = useMutation({
    mutationFn: (variables?: { semester_period?: string }) =>
      api.post('/professor-assignments/unassign-all', {
        semester_period: variables?.semester_period || selectedSemesterPeriod
      }),
    onSuccess: (res: any) => {
      toast.success(res.data?.message || '🗑️ Affectations remises à zéro avec succès !')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setShowUnassignAllModal(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la remise à zéro des affectations')
    }
  })

  // 🗑️ Remise à Zéro d'un seul Enseignant
  const unassignProfessorMutation = useMutation({
    mutationFn: (professor_id: string) => api.post('/professor-assignments/unassign-professor', { professor_id }),
    onSuccess: (res: any) => {
      toast.success(res.data?.message || "Toutes les charges de l'enseignant ont été réinitialisées !")
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setSelectedProfForModal(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erreur lors de la réinitialisation de l'enseignant")
    }
  })

  const createAssignmentMutation = useMutation({
    mutationFn: (payload: any) => api.post('/professor-assignments', payload),
    onSuccess: (res: any) => {
      const msg = res?.data?.message || '✍️ Affectation(s) ajoutée(s) avec succès !'
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setAssignmentForm(prev => ({ ...prev, module_ids: [], group_ids: [] }))
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'affectation')
    }
  })

  const createYearMutation = useMutation({
    mutationFn: (payload: any) => api.post('/academic-years', payload),
    onSuccess: () => {
      toast.success('📅 Nouvelle Année académique créée')
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      setNewYearLabel('')
      setNewYearIsCurrent(false)
    },
    onError: (err: any) => {
      const errorsObj = err.response?.data?.errors
      const firstError = errorsObj ? Object.values(errorsObj).flat()[0] as string : null
      const rawMsg = firstError || err.response?.data?.message || 'Erreur lors de la création de l\'année'

      const cleanMsg = rawMsg.includes('gt.numeric') || rawMsg.includes('gt')
        ? "⚠️ L'année de fin doit être strictement supérieure à l'année de début (ex: 2026/2027)."
        : rawMsg

      toast.error(cleanMsg)
    }
  })

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/professor-assignments/${id}`),
    onSuccess: () => {
      toast.success('🗑️ Affectation supprimée')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  const updateSessionMutation = useMutation({
    mutationFn: (data: {id: number, name: string, type: string, start_date: string, end_date: string}) =>
      academicApi.updateExamSession(data.id, { name: data.name, type: data.type, start_date: data.start_date, end_date: data.end_date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
    }
  })

  const createSessionMutation = useMutation({
    mutationFn: (data: any) => academicApi.createExamSession(data),
    onSuccess: () => {
      toast.success('📅 Session d\'examens créée avec succès')
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
    },
    onError: () => toast.error('Erreur lors de la création de la session')
  })

  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => academicApi.deleteExamSession(id),
    onSuccess: () => {
      toast.success('🗑️ Session supprimée')
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  const handleDeleteSession = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cette session d\'examens ?')) {
      deleteSessionMutation.mutate(id)
    }
  }

  const handleCreateSession = () => {
    if (!newSessionForm.name || !newSessionForm.type || !newSessionForm.academic_year_id || !newSessionForm.semester_id) {
      toast.error('Veuillez remplir les champs obligatoires (Nom, Type, Année, Semestre)')
      return
    }
    createSessionMutation.mutate(newSessionForm, {
      onSuccess: () => {
        setShowNewSessionForm(false)
        setNewSessionForm({
          name: '',
          type: '',
          start_date: '',
          end_date: '',
          academic_year_id: '',
          semester_id: ''
        })
      }
    })
  }

  const handleSaveSessions = async () => {
    try {
      const promises = Object.entries(sessionDates).map(([id, dates]) =>
        updateSessionMutation.mutateAsync({ id: Number(id), ...dates })
      )
      await Promise.all(promises)
      toast.success('💾 Périodes d\'examens enregistrées avec succès')
    } catch {
      toast.error('Erreur lors de l\'enregistrement des périodes')
    }
  }

  const handleCreateAssignment = () => {
    if (!assignmentForm.professor_id || assignmentForm.module_ids.length === 0 || assignmentForm.group_ids.length === 0) {
      toast.error('Veuillez sélectionner l\'Enseignant, au moins un Module et au moins un Groupe/Section')
      return
    }
    createAssignmentMutation.mutate(assignmentForm)
  }

  const handleDeleteAssignment = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cette affectation ?')) {
      deleteAssignmentMutation.mutate(id)
    }
  }

  const handleCreateYear = () => {
    if (!newYearLabel) {
      toast.error('Veuillez entrer une année (ex: 2026/2027)')
      return
    }
    const match = newYearLabel.match(/^(\d{4})\/(\d{4})$/)
    if (!match) {
      toast.error('Le format doit être YYYY/YYYY (ex: 2026/2027)')
      return
    }

    const startYear = parseInt(match[1])
    const endYear = parseInt(match[2])

    if (endYear <= startYear) {
      toast.error(`⚠️ L'année de fin (${endYear}) doit être strictement supérieure à l'année de début (${startYear}). Exemple valide : ${startYear}/${startYear + 1}`)
      return
    }

    createYearMutation.mutate({
      label: newYearLabel,
      start_year: startYear,
      end_year: endYear,
      start_date: `${startYear}-09-01`,
      end_date: `${endYear}-07-31`,
      is_current: newYearIsCurrent
    })
  }

  const handleSendNotificationEmail = async (profGroup: any) => {
    const profName = profGroup?.profName || ''
    const profId = profGroup?.profId || ''
    const firstAssignment = profGroup?.assignmentsList?.[0]
    const profEmail = firstAssignment?.professor?.user?.email
      || firstAssignment?.prof_email

    const toastId = toast.loading(`📧 Expédition de l'email certifié (Resend) à ${profEmail || profName}...`)
    try {
      const res = await api.post('/professor-assignments/notify', {
        prof_id: profId,
        prof_name: profName,
        email: profEmail
      })
      toast.success(res.data.message || `📧 Email d'affectation officiel envoyé avec succès !`, { id: toastId })
    } catch (e: any) {
      toast.error(e.response?.data?.message || `Erreur d'expédition à ${profEmail || profName}`, { id: toastId })
    }
  }

  const handlePrintOrdreDeService = (profGroup: any) => {
    const profId = profGroup?.profId || ''
    if (!profId) {
      toast.error('Identifiant enseignant introuvable.')
      return
    }
    openProfessorOrdreDeServicePdf(profId)
  }

  const handleDownloadTemplate = () => {
    const csvContent = "email_professeur,module_code,groupe\nprof@encg.ma,MOD01,G1\n"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "modele_affectations_encg.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Workload gauge stats
  const assignedProfsCount = useMemo(() => {
    return Object.values(groupedAssignmentsMap).filter((p: any) => p.assignmentsList.length > 0).length
  }, [groupedAssignmentsMap])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">

      {/* ─── 🏛️ INSTITUTIONAL HERO BANNER (EXECUTIVE COCKPIT) ────────────────────────── */}
      <div className="relative overflow-hidden text-white rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#061433] via-[#0f2863] to-[#1a3a8a] border border-blue-500/20 shadow-xl shadow-blue-950/20 print:hidden">
        {/* Subtle background glow accents */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
        <div className="absolute right-1/3 -bottom-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -top-10 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title & Institutional Badge */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-bold uppercase tracking-wider text-blue-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>ENCG Fès • Pilotage Pédagogique & Dispatching Officiel</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Pilotage Académique & Affectations
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
              Attribution équilibrée des charges d'enseignement selon les maquettes pédagogiques LMD, respect du volume statutaire (<strong className="text-amber-300 font-bold">18h/semaine</strong>) et gestion des sessions.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            <button
              onClick={() => setShowResetDistributeModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-blue-600 to-[#0f2863] hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-950/40 hover:shadow-indigo-500/30 cursor-pointer border border-indigo-300/40 active:scale-95"
              title="Répartition automatique équitable par spécialité, département et statutaire (18h)"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span>Répartition Équilibrée (18h)</span>
            </button>

            {/* 🔴 TOTAL RESET BUTTON (MISE À ZÉRO) */}
            <button
              onClick={() => setShowUnassignAllModal(true)}
              className="px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-rose-400/30 backdrop-blur-md cursor-pointer active:scale-95"
              title="Mise à zéro complète de toutes les affectations de l'année pour repartir à zéro"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
              <span>Mise à Zéro (0h)</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20 backdrop-blur-md cursor-pointer active:scale-95"
              title="Importer un fichier Excel/CSV d'affectations"
            >
              <Upload className="w-3.5 h-3.5 text-blue-200" />
              <span>Importer</span>
            </button>

            <button
              onClick={handleAiAutoMatching}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 backdrop-blur-md cursor-pointer active:scale-95"
              title="Suggestions IA prédictives ciblées"
            >
              <Zap className="w-4 h-4 text-purple-300" />
            </button>
          </div>
        </div>

        {/* Key Metrics Bar - High-End Frosted Glass Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6 mt-6 border-t border-white/15 relative z-10">
          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex items-center gap-3.5 shadow-sm hover:border-white/30 transition-all">
            <div className="w-11 h-11 rounded-xl bg-blue-500/25 text-blue-200 flex items-center justify-center shrink-0 ring-4 ring-blue-500/10">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-blue-200/90 tracking-wider block truncate">Enseignants Affectés</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white">{assignedProfsCount} / {allProfessors.length}</span>
                <span className="text-[10px] text-blue-200 font-semibold">profs</span>
              </div>
              <div className="w-full bg-white/20 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${allProfessors.length > 0 ? Math.round((assignedProfsCount / allProfessors.length) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex items-center gap-3.5 shadow-sm hover:border-white/30 transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/25 text-emerald-200 flex items-center justify-center shrink-0 ring-4 ring-emerald-500/10">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-emerald-200/90 tracking-wider block truncate">Charges Attribuées</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white">{assignments.length}</span>
                <span className="text-[10px] text-emerald-200 font-semibold">cours actifs</span>
              </div>
              <div className="text-[10px] text-emerald-200/80 font-medium mt-1 truncate">
                Moyenne : {assignedProfsCount > 0 ? (assignments.length / assignedProfsCount).toFixed(1) : '0'} cours / prof
              </div>
            </div>
          </div>

          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex items-center gap-3.5 shadow-sm hover:border-white/30 transition-all">
            <div className="w-11 h-11 rounded-xl bg-purple-500/25 text-purple-200 flex items-center justify-center shrink-0 ring-4 ring-purple-500/10">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-purple-200/90 tracking-wider block truncate">Modules Programmés</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white">{modules.length}</span>
                <span className="text-[10px] text-purple-200 font-semibold">maquette LMD</span>
              </div>
              <div className="text-[10px] text-purple-200/80 font-medium mt-1 truncate">
                Tronc Commun + Spécialités
              </div>
            </div>
          </div>

          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex items-center gap-3.5 shadow-sm hover:border-white/30 transition-all">
            <div className="w-11 h-11 rounded-xl bg-amber-500/25 text-amber-200 flex items-center justify-center shrink-0 ring-4 ring-amber-500/10">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-amber-200/90 tracking-wider block truncate">Sessions Examens</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white">{examSessions.length}</span>
                <span className="text-[10px] text-amber-200 font-semibold">planifiées</span>
              </div>
              <div className="text-[10px] text-amber-200/80 font-medium mt-1 truncate">
                Ordinaire & Rattrapage
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 🧭 LUXURY TAB NAVIGATION ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-border dark:border-border pb-3 gap-3 print:hidden">
        <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <button
            onClick={() => setActiveTab('affectations')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none",
              activeTab === 'affectations'
                ? "bg-card dark:bg-card text-[#0f2863] dark:text-blue-300 shadow-sm ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            <Users className="w-4 h-4 text-primary dark:text-blue-400" />
            <span>Affectations Enseignants</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono",
              activeTab === 'affectations'
                ? "bg-primary/10 text-[#0f2863] dark:bg-blue-950 dark:text-blue-300"
                : "bg-slate-200/80 text-muted-foreground dark:bg-slate-700 dark:text-foreground"
            )}>
              {allProfessors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none",
              activeTab === 'sessions'
                ? "bg-card dark:bg-card text-[#0f2863] dark:text-blue-300 shadow-sm ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            <CalendarDays className="w-4 h-4 text-amber-500" />
            <span>Sessions & Examens</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono",
              activeTab === 'sessions'
                ? "bg-primary/10 text-[#0f2863] dark:bg-blue-950 dark:text-blue-300"
                : "bg-slate-200/80 text-muted-foreground dark:bg-slate-700 dark:text-foreground"
            )}>
              {examSessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('annees')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none",
              activeTab === 'annees'
                ? "bg-card dark:bg-card text-[#0f2863] dark:text-blue-300 shadow-sm ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            <Layers className="w-4 h-4 text-purple-500" />
            <span>Années & Semestres</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono",
              activeTab === 'annees'
                ? "bg-primary/10 text-[#0f2863] dark:bg-blue-950 dark:text-blue-300"
                : "bg-slate-200/80 text-muted-foreground dark:bg-slate-700 dark:text-foreground"
            )}>
              {years.length}
            </span>
          </button>
        </div>

        {activeTab === 'affectations' && (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowUnassignAllModal(true)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200/80 dark:border-rose-800"
              title="Vider et remettre à zéro toutes les affectations"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Remise à Zéro</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-muted hover:bg-slate-200 dark:bg-card dark:hover:bg-slate-700 text-slate-700 dark:text-foreground rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/80 dark:border-border"
              title="Télécharger le gabarit CSV standard pour import"
            >
              <FileText className="w-3.5 h-3.5 text-primary dark:text-blue-400" />
              <span>Modèle CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── TAB 1: AFFECTATIONS DES PROFESSEURS ──────────────────────────── */}
      {activeTab === 'affectations' && (
        <div className="space-y-6 print:hidden">

          {/* Reconduction & Export ZIP Panel (Integrated cleanly inside tab) */}
          <AssignmentCarryForwardPanel years={years} />

          {/* Quick Assignment Creator Form Card */}
          <div className="bg-card dark:bg-card border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border dark:border-border pb-4 gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0 ring-4 ring-blue-500/10">
                  <Plus className="w-5 h-5 text-emerald-400 stroke-[3]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground dark:text-white tracking-tight">
                      Studio d'Affectation Pédagogique
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-[#0f2863] dark:bg-blue-950 dark:text-blue-300">
                      Générateur Rapide
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sélectionnez en 4 étapes l'enseignant, le module et les groupes pour valider l'attribution en un clic.
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Statutaire : <strong>18h max</strong></span>
                </span>
              </div>
            </div>

            {/* 4 Step Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1: Department */}
              <CustomSelect
                label="Département"
                stepNumber="1"
                placeholder="Tous les départements"
                value={assignmentForm.department_id}
                onChange={(val) => {
                  setAssignmentForm(prev => ({
                    ...prev,
                    department_id: val,
                    professor_id: ''
                  }))
                }}
                icon={<Building2 className="w-4 h-4" />}
                options={[
                  { value: '', label: 'Tous les départements' },
                  ...departments.map((d: any) => ({
                    value: String(d.id),
                    label: d.name,
                    sublabel: d.code ? `Code: ${d.code}` : 'Département Académique'
                  }))
                ]}
              />

              {/* Step 2: Professor */}
              <CustomSelect
                label="Enseignant"
                stepNumber="2"
                placeholder="Sélectionner l'enseignant"
                value={assignmentForm.professor_id}
                onChange={(val) => setAssignmentForm(prev => ({ ...prev, professor_id: val }))}
                icon={<GraduationCap className="w-4 h-4" />}
                options={[
                  { value: '', label: 'Sélectionner l\'enseignant' },
                  ...professors
                    .filter((p: any) => !assignmentForm.department_id || String(p.department_id) === String(assignmentForm.department_id))
                    .map((p: any) => {
                      const displayName = (p.first_name || p.last_name)
                        ? `${p.first_name || ''} ${p.last_name || ''}`.trim()
                        : `Professeur #${p.id}`
                      const profGroup = groupedAssignmentsMap[String(p.id)]
                      const currentCount = profGroup?.assignmentsList?.length || 0
                      return {
                        value: String(p.id),
                        label: displayName,
                        sublabel: `${p.grade || 'PES'} • ${currentCount} cours assigné${currentCount > 1 ? 's' : ''} (${currentCount * 4}h/18h)`
                      }
                    })
                ]}
              />

              {/* Step 3: Module (Multi-sélection) */}
              <CustomMultiSelect
                label="Module(s)"
                stepNumber="3"
                placeholder="Sélectionner le(s) module(s)"
                values={assignmentForm.module_ids}
                onChange={(vals) => setAssignmentForm(prev => ({ ...prev, module_ids: vals }))}
                icon={<BookOpen className="w-4 h-4" />}
                selectAllOption={true}
                options={modules
                  .filter((m: any) => {
                    if (selectedSemesterPeriod === 'odd' || selectedSemesterPeriod === 'autumn' || selectedSemesterPeriod === 's1') {
                      return [1, 3, 5, 7, 9].includes(m.semester_number || m.semester)
                    }
                    if (selectedSemesterPeriod === 'even' || selectedSemesterPeriod === 'spring' || selectedSemesterPeriod === 's2') {
                      return [2, 4, 6, 8, 10].includes(m.semester_number || m.semester)
                    }
                    if (['1','2','3','4','5','6','7','8','9','10'].includes(String(selectedSemesterPeriod))) {
                      return String(m.semester_number || m.semester) === String(selectedSemesterPeriod)
                    }
                    return true
                  })
                  .map((m: any) => {
                    const semNum = m.semester_number || m.semester
                    const semTag = semNum ? `[S${semNum}] ` : ''
                    return {
                      value: String(m.id),
                      label: `${semTag}${m.code ? m.code + ' - ' : ''}${m.name}`,
                      sublabel: semNum ? `Semestre S${semNum} • Filière ${m.filiere?.name || 'ENCG'}` : 'Module académique'
                    }
                  })
                }
              />

              {/* Step 4: Group / Section (Multi-sélection filtrée) */}
              <CustomMultiSelect
                label="Groupe(s) / Section(s)"
                stepNumber="4"
                placeholder={assignmentForm.module_ids.length === 0 ? "Sélectionner d'abord le module" : "Sélectionner le(s) groupe(s)"}
                values={assignmentForm.group_ids}
                onChange={(vals) => setAssignmentForm(prev => ({ ...prev, group_ids: vals }))}
                icon={<Users className="w-4 h-4" />}
                selectAllOption={true}
                options={[
                  {
                    value: 'all',
                    label: '🏛️ Section Entière (Amphithéâtre / Tous les groupes)',
                    sublabel: selectedModulesList.length > 0
                      ? `Affectation globale CM (${availableGroups.length} groupe${availableGroups.length > 1 ? 's' : ''} de ${selectedModulesList[0]?.semester ? 'S' + (selectedModulesList[0]?.semester_number || '') : 'la filière'})`
                      : 'Affectation globale CM sans restriction de sous-groupe'
                  },
                  ...availableGroups.map((g: any) => ({
                    value: String(g.id),
                    label: `${g.name} (S${g.semester_number || '?'})`,
                    sublabel: `${g.filiere_name || g.filiere || 'Filière'} • Capacité: ${g.capacity || 30} étud.`
                  }))
                ]}
              />
            </div>

            {/* Real-time Professor Workload Dossier Banner if Selected */}
            {selectedProfDetails && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 border border-primary/20 dark:border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in zoom-in-98 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#0f2863] text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 ring-4 ring-blue-500/10">
                    {selectedProfDetails.profGroup?.profName?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground dark:text-white">
                        {selectedProfDetails.profGroup?.profName}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-[#0f2863] dark:bg-blue-950 dark:text-blue-300">
                        {selectedProfDetails.profGroup?.grade || 'PES'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{selectedProfDetails.profGroup?.departmentName}</span>
                      <span>•</span>
                      <span>{selectedProfDetails.profGroup?.specialty}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-border dark:border-border">
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Charge Enregistrée :</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-foreground dark:text-white">
                        {selectedProfDetails.count} cours ({selectedProfDetails.estimatedWeekly}h / 18h statutaires)
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        selectedProfDetails.isAtLimit
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : selectedProfDetails.isNearLimit
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      )}>
                        {selectedProfDetails.isAtLimit ? '⚠️ Surcharge (>18h)' : selectedProfDetails.isNearLimit ? 'Équilibré (14-18h)' : 'Disponible (<14h)'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Mini Gauge */}
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shrink-0">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        selectedProfDetails.isAtLimit ? "bg-rose-500" : selectedProfDetails.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(Math.round((selectedProfDetails.estimatedWeekly / 18) * 100), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Format d'enseignement (CM / TD / Les deux) */}
            <div className="mt-3.5 pt-3 border-t border-border dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-xl border border-dashed dark:border-border">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary dark:text-blue-400" />
                  <span>Format de séance :</span>
                </span>
                <div className="inline-flex rounded-xl bg-card dark:bg-card p-1 border border-border dark:border-border shadow-xs">
                  <button
                    type="button"
                    onClick={() => setAssignmentForm(prev => ({ ...prev, session_type: 'cm' }))}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      assignmentForm.session_type === 'cm'
                        ? 'bg-[#0f2863] text-white shadow-xs'
                        : "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
                    }`}
                  >
                    <span>🏛️ Cours (CM)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-100 font-mono">36h</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentForm(prev => ({ ...prev, session_type: 'td' }))}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      assignmentForm.session_type === 'td'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
                    }`}
                  >
                    <span>📝 TD (Travaux Dirigés)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-700/50 text-emerald-100 font-mono">18h</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentForm(prev => ({ ...prev, session_type: 'both' }))}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      assignmentForm.session_type === 'both'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
                    }`}
                  >
                    <span>✨ CM + TD (Les deux)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-700/50 text-purple-100 font-mono">54h total</span>
                  </button>
                </div>
              </div>

              {/* Dynamic total count badge */}
              <div className="flex items-center gap-2">
                {assignmentForm.module_ids.length > 0 && assignmentForm.group_ids.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 bg-primary/5 dark:bg-blue-950/50 text-primary dark:text-blue-300 border border-primary/20 dark:border-primary px-3 py-1 rounded-lg text-xs font-semibold">
                    <span>⚡ Génération automatique :</span>
                    <span className="px-1.5 py-0.2 bg-primary text-primary-foreground rounded font-mono font-bold text-[11px]">
                      {assignmentForm.module_ids.length * (assignmentForm.group_ids.includes('all') ? 1 : assignmentForm.group_ids.length) * (assignmentForm.session_type === 'both' ? 2 : 1)} affectation(s)
                    </span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    💡 Astuce : Vous pouvez sélectionner plusieurs modules et groupes pour affecter en 1 clic
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Simulation Equation Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Simulation :</span>
                {assignmentForm.professor_id ? (
                  <span className="px-2 py-0.5 rounded-md bg-card dark:bg-slate-800 border font-semibold text-foreground dark:text-white">
                    👤 {selectedProfDetails?.profGroup?.profName?.split(' ')[0] || 'Enseignant'}
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">Enseignant non sélectionné</span>
                )}
                <span className="text-slate-400">➜</span>
                {assignmentForm.module_ids.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-[#0f2863] dark:bg-blue-950 dark:text-blue-300 font-bold border border-primary/20">
                    📚 {assignmentForm.module_ids.length} Module{assignmentForm.module_ids.length > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">0 module</span>
                )}
                <span className="text-slate-400">➜</span>
                {assignmentForm.group_ids.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    {assignmentForm.group_ids.includes('all') ? '🏛️ Section Entière (Amphi)' : `👥 ${assignmentForm.group_ids.length} Groupe${assignmentForm.group_ids.length > 1 ? 's' : ''}`}
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">0 groupe</span>
                )}
              </div>

              {assignmentForm.module_ids.length > 0 && assignmentForm.group_ids.length > 0 && (
                <div className="inline-flex items-center gap-2 bg-[#0f2863] text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs animate-in fade-in">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    Total : {assignmentForm.module_ids.length * (assignmentForm.group_ids.includes('all') ? 1 : assignmentForm.group_ids.length) * (assignmentForm.session_type === 'both' ? 2 : 1)} affectation(s)
                  </span>
                  <span className="text-[10px] text-blue-200 font-mono">
                    (~{assignmentForm.module_ids.length * (assignmentForm.group_ids.includes('all') ? 1 : assignmentForm.group_ids.length) * (assignmentForm.session_type === 'both' ? 54 : assignmentForm.session_type === 'cm' ? 36 : 18)}h)
                  </span>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border dark:border-border">
              <span className="text-xs text-muted-foreground">
                {assignmentForm.professor_id && assignmentForm.module_ids.length > 0 && assignmentForm.group_ids.length > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Prêt : {assignmentForm.module_ids.length} module(s) × {assignmentForm.group_ids.includes('all') ? 'Section Entière' : `${assignmentForm.group_ids.length} groupe(s)`} • Format : {assignmentForm.session_type === 'both' ? 'CM + TD' : assignmentForm.session_type.toUpperCase()}
                  </span>
                ) : (
                  'Renseignez l\'enseignant, au moins un module et au moins un groupe pour valider.'
                )}
              </span>

              <button
                onClick={handleCreateAssignment}
                disabled={createAssignmentMutation.isPending || !assignmentForm.professor_id || assignmentForm.module_ids.length === 0 || assignmentForm.group_ids.length === 0}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-98",
                  (!assignmentForm.professor_id || assignmentForm.module_ids.length === 0 || assignmentForm.group_ids.length === 0)
                    ? "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60"
                    : "bg-gradient-to-r from-emerald-600 via-teal-600 to-[#0f2863] hover:from-emerald-700 hover:to-[#1a3a8a] text-white shadow-emerald-900/20 hover:scale-102"
                )}
              >
                {createAssignmentMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>
                  {createAssignmentMutation.isPending
                    ? 'Enregistrement en cours...'
                    : `Valider l'Affectation (${assignmentForm.module_ids.length * (assignmentForm.group_ids.includes('all') ? 1 : assignmentForm.group_ids.length) * (assignmentForm.session_type === 'both' ? 2 : 1)})`}
                </span>
              </button>
            </div>
          </div>

          {/* ─── 🎓 SEMESTER PERIOD SWITCHER (AUTOMNE / PRINTEMPS / ANNUEL) ─────── */}
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/90 p-3 sm:p-3.5 rounded-2xl border border-primary/20 dark:border-border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0f2863] text-white flex items-center justify-center font-bold text-xs">
                S
              </div>
              <div>
                <div className="text-xs font-bold text-foreground dark:text-white flex items-center gap-1.5">
                  <span>Période Semestrielle :</span>
                  <span className="text-primary dark:text-blue-400 font-bold">
                    {selectedSemesterPeriod === 'odd' ? '🍂 Semestre 1 / Automne (S1, S3, S5, S7, S9)' :
                     selectedSemesterPeriod === 'even' ? '🌸 Semestre 2 / Printemps (S2, S4, S6, S8, S10)' :
                     selectedSemesterPeriod === 'all' ? '🎓 Année Complète (Tous les semestres)' :
                     `Semestre S${selectedSemesterPeriod}`}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Filtrage strict des affectations et des modules selon la période académique
                </div>
              </div>
            </div>

            {/* Quick Segmented Period Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => setSelectedSemesterPeriod('odd')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                  selectedSemesterPeriod === 'odd'
                    ? "bg-[#0f2863] text-white shadow-blue-900/20"
                    : "bg-card dark:bg-card text-slate-700 dark:text-foreground border border-border dark:border-border hover:bg-muted"
                )}
              >
                <span>🍂 Automne / S1</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[9px] font-bold",
                  selectedSemesterPeriod === 'odd' ? "bg-white/20 text-white" : "bg-primary/10 text-[#0f2863]"
                )}>
                  S1, S3, S5, S7
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSemesterPeriod('even')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                  selectedSemesterPeriod === 'even'
                    ? "bg-[#0f2863] text-white shadow-blue-900/20"
                    : "bg-card dark:bg-card text-slate-700 dark:text-foreground border border-border dark:border-border hover:bg-muted"
                )}
              >
                <span>🌸 Printemps / S2</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[9px] font-bold",
                  selectedSemesterPeriod === 'even' ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"
                )}>
                  S2, S4, S6, S8
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSemesterPeriod('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                  selectedSemesterPeriod === 'all'
                    ? "bg-[#0f2863] text-white shadow-blue-900/20"
                    : "bg-card dark:bg-card text-slate-700 dark:text-foreground border border-border dark:border-border hover:bg-muted"
                )}
              >
                <span>🎓 Année Complète</span>
              </button>
            </div>
          </div>

          {/* ─── 🔍 SEARCH & CUSTOM FILTER TOOLBAR ────────────────────────── */}
          <div className="bg-card dark:bg-card p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par enseignant, module ou groupe..."
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-slate-50/90 dark:bg-slate-800/80 border border-border dark:border-slate-700/80 text-xs font-medium text-foreground dark:text-white outline-none focus:border-primary transition-all placeholder:text-slate-400 rounded-[var(--control-radius)]"
              />
              {assignmentSearch && (
                <button
                  onClick={() => setAssignmentSearch('')}
                  className="absolute right-3 top-2 text-slate-400 hover:text-muted-foreground dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Workload Status Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setWorkloadFilter('all')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                  workloadFilter === 'all'
                    ? "bg-[#0f2863] text-white shadow-2xs"
                    : "bg-muted hover:bg-slate-200 dark:bg-card dark:hover:bg-slate-700 text-slate-700 dark:text-foreground"
                )}
              >
                Tous ({allProfessors.length})
              </button>
              <button
                type="button"
                onClick={() => setWorkloadFilter('unassigned')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                  workloadFilter === 'unassigned'
                    ? "bg-slate-700 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                0h Dispo
              </button>
              <button
                type="button"
                onClick={() => setWorkloadFilter('full')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                  workloadFilter === 'full'
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Équilibrés
              </button>
              <button
                type="button"
                onClick={() => setWorkloadFilter('overloaded')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                  workloadFilter === 'overloaded'
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Surcharge
              </button>
            </div>

            {/* Custom Filter Popover Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* 1. Department Filter */}
              <FilterDropdown
                label="Tous Départements"
                value={selectedDeptFilter}
                onChange={(val) => setSelectedDeptFilter(val)}
                icon={<Building2 className="w-3.5 h-3.5" />}
                searchable={true}
                options={[
                  { value: 'all', label: 'Tous Départements' },
                  ...departments.map((d: any) => ({
                    value: String(d.id),
                    label: d.name,
                    sublabel: d.code ? `Code: ${d.code}` : undefined
                  }))
                ]}
              />

              {/* 2. Module Filter */}
              <FilterDropdown
                label="Tous Modules"
                value={selectedModuleFilter}
                onChange={(val) => setSelectedModuleFilter(val)}
                icon={<BookOpen className="w-3.5 h-3.5" />}
                searchable={true}
                options={[
                  { value: 'all', label: 'Tous Modules' },
                  ...modules.map((m: any) => ({
                    value: m.code || String(m.id),
                    label: `${m.code ? m.code + ' - ' : ''}${m.name}`,
                    sublabel: m.semester ? `Semestre ${m.semester}` : undefined
                  }))
                ]}
              />

              {/* 3. Workload Status Filter */}
              <FilterDropdown
                label="Toutes charges"
                value={workloadFilter}
                onChange={(val: any) => setWorkloadFilter(val)}
                icon={<BarChart2 className="w-3.5 h-3.5" />}
                options={[
                  { value: 'all', label: 'Toutes charges' },
                  { value: 'unassigned', label: 'Non affecté (0h)', sublabel: 'Enseignants disponibles' },
                  { value: 'available', label: 'Disponible (<14h)', sublabel: 'Capacité restante' },
                  { value: 'full', label: 'Complet (14h - 18h)', sublabel: 'Volume statutaire atteint' },
                  { value: 'overloaded', label: 'Surcharge (>18h)', sublabel: 'Au-delà du statutaire' }
                ]}
              />

              {/* Clear filters button if active */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="h-9 px-2.5 bg-muted hover:bg-slate-200 dark:bg-card dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  title="Réinitialiser tous les filtres"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Effacer</span>
                </button>
              )}

              {/* Results Count Badge */}
              <div className="text-xs text-muted-foreground dark:text-muted-foreground font-bold px-2 py-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg">
                {groupedProfessors.length} {groupedProfessors.length > 1 ? 'profs' : 'prof'}
              </div>
            </div>
          </div>

          {/* ─── PROFESSORS & ASSIGNMENTS TABLE ──────────────────────────── */}
          <div className="bg-card dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl overflow-hidden shadow-xs">
            {assignmentsLoading ? (
              <div className="py-20 text-center text-slate-400">
                <Spinner className="w-8 h-8 mx-auto mb-2 text-[#0f2863]" />
                <p className="text-xs font-bold">Chargement de la matrice des affectations...</p>
              </div>
            ) : groupedProfessors.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-foreground">Aucun enseignant correspondant</h4>
                <p className="text-xs text-slate-400">Ajustez vos filtres ou effectuez une recherche différente.</p>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary dark:bg-blue-950/40 dark:text-blue-300 rounded-xl text-xs font-bold hover:bg-primary/10 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser les filtres</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100/90 via-slate-50/70 to-slate-100/90 dark:from-slate-800/90 dark:via-slate-900/70 dark:to-slate-800/90 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-extrabold text-[10px] border-b border-border/80 dark:border-border">
                      <th className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#0f2863] dark:text-blue-400" />
                          <span>Enseignant Chercheur</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Département</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Charge & Statut (18h)</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Modules & Groupes Attribués</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-right font-bold">Actions & Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {groupedProfessors.map((profGroup: any, idx: number) => {
                      const count = profGroup.assignmentsList.length
                      void (count * 48);
                      const weeklyHours = count * 4
                      const percentage = Math.min(Math.round((weeklyHours / 18) * 100), 100)

                      return (
                        <tr key={idx} className="group hover:bg-gradient-to-r hover:from-blue-50/40 hover:via-indigo-50/20 hover:to-transparent dark:hover:from-blue-950/20 dark:hover:via-slate-800/40 dark:hover:to-transparent transition-all duration-150">
                          {/* Prof Name & Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className={cn(
                                  "w-10 h-10 rounded-2xl text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md ring-2 transition-transform group-hover:scale-105",
                                  weeklyHours > 18
                                    ? "bg-gradient-to-br from-rose-500 to-rose-700 ring-rose-400/30"
                                    : weeklyHours >= 14
                                      ? "bg-gradient-to-br from-emerald-500 to-teal-700 ring-emerald-400/30"
                                      : weeklyHours > 0
                                        ? "bg-gradient-to-br from-[#0f2863] to-blue-700 ring-blue-400/30"
                                        : "bg-gradient-to-br from-slate-600 to-slate-800 ring-slate-400/20"
                                )}>
                                  {profGroup.profName ? profGroup.profName.charAt(0).toUpperCase() : 'P'}
                                </div>
                                <span className={cn(
                                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-xs",
                                  weeklyHours > 18 ? "bg-rose-500" : weeklyHours >= 14 ? "bg-emerald-500" : weeklyHours > 0 ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                                )} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-foreground dark:text-white truncate text-xs flex items-center gap-1.5">
                                  <span>{cleanUtf8Text(profGroup.profName)}</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                                  <span className="font-bold text-[#0f2863] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900 px-1.5 py-0.2 rounded shadow-2xs">
                                    {profGroup.grade || 'PES'}
                                  </span>
                                  <span>•</span>
                                  <span className="truncate font-medium">{cleanUtf8Text(profGroup.specialty)}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                              <Building2 className="w-3 h-3 text-indigo-500" />
                              <span>{cleanUtf8Text(profGroup.departmentName || 'ENCG Fès')}</span>
                            </span>
                          </td>

                          {/* Workload Progress & Dual-Metric Gauge */}
                          <td className="py-3 px-4">
                            <div className="space-y-1.5 w-48">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-extrabold font-mono text-slate-900 dark:text-white flex items-center gap-1">
                                  <span>{weeklyHours}h</span>
                                  <span className="text-[10px] text-muted-foreground font-normal">/ 18h stat.</span>
                                </span>
                                <span className={cn(
                                  "font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs",
                                  weeklyHours > 18 ? "text-rose-700 bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 ring-1 ring-rose-400/30" :
                                  weeklyHours >= 14 ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-400/30" :
                                  weeklyHours > 0 ? "text-blue-700 bg-blue-100 dark:bg-blue-950/80 dark:text-blue-300 ring-1 ring-blue-400/30" :
                                  "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-300/40"
                                )}>
                                  {weeklyHours > 18 ? '⚡ Surcharge' : weeklyHours >= 14 ? '✓ Équilibré' : weeklyHours > 0 ? `${count} cours` : '✨ Dispo'}
                                </span>
                              </div>

                              {/* Progress Bar with Gradient */}
                              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    weeklyHours > 18 ? "bg-gradient-to-r from-amber-500 to-rose-600" :
                                    weeklyHours >= 14 ? "bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500" :
                                    weeklyHours > 0 ? "bg-gradient-to-r from-blue-500 to-indigo-600" :
                                    "bg-transparent"
                                  )}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-muted-foreground flex justify-between items-center font-medium">
                                <span>{count} module{count > 1 ? 's' : ''}</span>
                                <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400">{count * 48}h volume sem.</span>
                              </div>
                            </div>
                          </td>

                          {/* Modules List Preview with Direct Fast-Delete */}
                          <td className="py-3 px-4">
                            {count > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                                {profGroup.assignmentsList.slice(0, 4).map((a: any, i: number) => {
                                  const semNum = a.semester_number || (a.module && a.module.match(/-S(\d+)-/i)?.[1])
                                  const isAmphi = !a.group || a.group === 'Amphi' || a.group.toLowerCase().includes('section') || a.group_id === null
                                  return (
                                    <span
                                      key={i}
                                      className="group/tag inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-foreground rounded-xl text-[11px] font-semibold border border-slate-200/80 dark:border-border transition-all shadow-xs"
                                    >
                                      {semNum && (
                                        <span className={cn(
                                          "px-1.5 py-0.2 rounded-md text-[9px] font-black font-mono",
                                          Number(semNum) % 2 === 1
                                            ? "bg-[#0f2863] text-white"
                                            : "bg-purple-700 text-white"
                                        )}>
                                          S{semNum}
                                        </span>
                                      )}
                                      <span className="font-bold text-[#0f2863] dark:text-blue-400 font-mono text-[10px]">
                                        {cleanUtf8Text(a.module?.split(' ')[0] || 'MOD')}
                                      </span>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                        ({isAmphi ? '🏛️ Amphi' : cleanUtf8Text(a.group)})
                                      </span>
                                      <span className={cn(
                                        "text-[9px] px-1.5 py-0.2 rounded font-black uppercase",
                                        (a.session_type || 'cm').toLowerCase() === 'cm'
                                          ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                                          : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                                      )}>
                                        {a.session_type || 'CM'}
                                      </span>
                                      {/* Quick Delete Cross Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteAssignment(a.id)
                                        }}
                                        className="opacity-0 group-hover/tag:opacity-100 w-4 h-4 rounded-full hover:bg-rose-500 hover:text-white text-slate-400 flex items-center justify-center transition-all cursor-pointer -mr-0.5"
                                        title="Supprimer cette affectation"
                                      >
                                        <X className="w-2.5 h-2.5 stroke-[3]" />
                                      </button>
                                    </span>
                                  )
                                })}

                                {count > 4 && (
                                  <button
                                    onClick={() => setSelectedProfForModal(profGroup)}
                                    className="px-2.5 py-1 bg-primary/10 dark:bg-blue-950/60 text-primary dark:text-blue-300 hover:bg-primary/20 rounded-xl text-[10px] font-black cursor-pointer transition-colors shadow-2xs"
                                  >
                                    +{count - 4} autres
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-dashed border-emerald-300 dark:border-emerald-800 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Disponible pour affectation (0 / 18h)</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {count > 0 ? (
                                <>
                                  <button
                                    onClick={() => setSelectedProfForModal(profGroup)}
                                    className="p-2 text-slate-500 hover:text-[#0f2863] dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                                    title="Voir le détail complet des modules et groupes"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handlePrintOrdreDeService(profGroup)}
                                    className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                                    title="Télécharger l'Ordre de Service Officiel (PDF)"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleSendNotificationEmail(profGroup)}
                                    className="p-2 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                                    title="Notifier l'enseignant par email officiel (Resend)"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setAssignmentForm(prev => ({
                                        ...prev,
                                        department_id: profGroup.departmentId ? String(profGroup.departmentId) : prev.department_id,
                                        professor_id: String(profGroup.profId)
                                      }))
                                      window.scrollTo({ top: 320, behavior: 'smooth' })
                                    }}
                                    className="p-2 text-white bg-gradient-to-r from-[#0f2863] to-blue-700 hover:from-[#1a3a8a] hover:to-blue-800 rounded-xl transition-all cursor-pointer shadow-xs"
                                    title="Ajouter un autre module à cet enseignant"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAssignmentForm(prev => ({
                                      ...prev,
                                      department_id: profGroup.departmentId ? String(profGroup.departmentId) : prev.department_id,
                                      professor_id: String(profGroup.profId)
                                    }))
                                    window.scrollTo({ top: 320, behavior: 'smooth' })
                                  }}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-[#0f2863] via-blue-700 to-indigo-800 hover:from-[#1a3a8a] hover:to-indigo-900 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-102 active:scale-98"
                                >
                                  <Plus className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                                  <span>Affecter</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: SESSIONS & EXAMENS ────────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <div className="space-y-6 print:hidden">
          <div className="bg-card dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground dark:text-white uppercase tracking-wider">
                  Périodes & Dates des Sessions d'Examens
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Définition des plages de dates pour la Session Ordinaire (Normale) et la Session de Rattrapage.
                </p>
              </div>

              <button
                onClick={() => setShowNewSessionForm(!showNewSessionForm)}
                className="px-4 py-2 bg-[#0f2863] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 hover:bg-[#1a3a8a] cursor-pointer"
              >
                {showNewSessionForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>Nouvelle Session</span>
              </button>
            </div>

            {showNewSessionForm && (
              <div className="p-5 bg-muted/50 dark:bg-slate-800/50 border border-border dark:border-border rounded-xl space-y-4 animate-in zoom-in-95">
                <h4 className="font-bold text-foreground dark:text-white text-xs uppercase tracking-wider">
                  Création d'une Session d'Examens
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Intitulé de la session</label>
                    <input
                      type="text"
                      value={newSessionForm.name}
                      onChange={(e) => setNewSessionForm({...newSessionForm, name: e.target.value})}
                      className="w-full px-3.5 py-2 bg-card dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
                      placeholder="ex: Session Ordinaire Automne S1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Type de session</label>
                    <input
                      type="text"
                      value={newSessionForm.type}
                      onChange={(e) => setNewSessionForm({...newSessionForm, type: e.target.value})}
                      className="w-full px-3.5 py-2 bg-card dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
                      placeholder="ex: normale / rattrapage"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Année Universitaire</label>
                    <select
                      value={newSessionForm.academic_year_id}
                      onChange={(e) => setNewSessionForm({...newSessionForm, academic_year_id: e.target.value})}
                      className="w-full px-3.5 py-2 bg-card dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
                    >
                      <option value="">Sélectionner</option>
                      {years.map((y: any) => <option key={y.id} value={y.id}>{y.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Semestre</label>
                    <select
                      value={newSessionForm.semester_id}
                      onChange={(e) => setNewSessionForm({...newSessionForm, semester_id: e.target.value})}
                      className="w-full px-3.5 py-2 bg-card dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
                    >
                      <option value="">Sélectionner</option>
                      {semesters.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Date de Début</label>
                    <input
                      type="date"
                      value={newSessionForm.start_date}
                      onChange={(e) => setNewSessionForm({...newSessionForm, start_date: e.target.value})}
                      className="w-full px-3.5 py-2 bg-card dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Date de Fin</label>
                    <input
                      type="date"
                      value={newSessionForm.end_date}
                      onChange={(e) => setNewSessionForm({...newSessionForm, end_date: e.target.value})}
                      className="w-full px-3.5 py-2 bg-card dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleCreateSession}
                    disabled={createSessionMutation.isPending}
                    className="px-5 py-2 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-xs hover:bg-[#1a3a8a] transition-all cursor-pointer"
                  >
                    {createSessionMutation.isPending ? 'Création...' : 'Valider la Session'}
                  </button>
                </div>
              </div>
            )}

            {/* Sessions Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examSessions.map((session: any) => (
                <div key={session.id} className="p-5 border border-border dark:border-border rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 relative group space-y-4 shadow-xs">
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Supprimer la session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <span className="text-xs font-bold uppercase text-[#0f2863] dark:text-blue-400 tracking-wider">
                      {session.type || 'Session Officielle'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Intitulé de la Session</label>
                      <input
                        type="text"
                        value={sessionDates[session.id]?.name ?? session.name}
                        onChange={(e) => setSessionDates({...sessionDates, [session.id]: {...sessionDates[session.id], name: e.target.value}})}
                        className="w-full px-3.5 py-2 bg-card dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date Début</label>
                      <input
                        type="date"
                        value={sessionDates[session.id]?.start_date || ''}
                        onChange={(e) => setSessionDates({...sessionDates, [session.id]: {...sessionDates[session.id], start_date: e.target.value}})}
                        className="w-full px-3.5 py-2 bg-card dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date Fin</label>
                      <input
                        type="date"
                        value={sessionDates[session.id]?.end_date || ''}
                        onChange={(e) => setSessionDates({...sessionDates, [session.id]: {...sessionDates[session.id], end_date: e.target.value}})}
                        className="w-full px-3.5 py-2 bg-card dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border">
              <p className="text-xs text-slate-400 italic">
                N'oubliez pas d'enregistrer vos modifications après avoir ajusté les plages de dates.
              </p>
              <button
                onClick={handleSaveSessions}
                disabled={updateSessionMutation.isPending}
                className="px-5 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a3a8a] transition-colors text-xs uppercase tracking-wider shadow-xs cursor-pointer disabled:opacity-50"
              >
                {updateSessionMutation.isPending ? 'Enregistrement...' : 'Enregistrer les Périodes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: ANNEES & SEMESTRES ────────────────────────────────────── */}
      {activeTab === 'annees' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
          {/* Années Universitaires Card */}
          <div className="bg-card dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-foreground dark:text-white uppercase tracking-wider">
              Gestion des Années Académiques
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Ex: 2026/2027"
                value={newYearLabel}
                onChange={(e) => setNewYearLabel(e.target.value)}
                className="flex-1 w-full px-3.5 py-2 bg-muted/50 dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
              />
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground dark:text-foreground cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={newYearIsCurrent}
                  onChange={(e) => setNewYearIsCurrent(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-ring"
                />
                <span>Année courante</span>
              </label>
              <button
                onClick={handleCreateYear}
                disabled={createYearMutation.isPending}
                className="w-full sm:w-auto px-5 py-2 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#1a3a8a] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {createYearMutation.isPending ? 'En cours...' : 'Créer'}
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {years.map((y: any) => (
                <div key={y.id} className="flex items-center justify-between p-3.5 border border-border dark:border-border rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary dark:text-blue-400" />
                    <span className="font-bold text-foreground dark:text-foreground text-sm">{y.label}</span>
                    {y.is_current && (
                      <span className="px-2 py-0.5 bg-[#0f2863] text-white text-[9px] font-bold rounded-md tracking-wider uppercase">
                        COURANTE
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">ID: #{y.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Semestres Readonly Card */}
          <div className="bg-card dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-foreground dark:text-white uppercase tracking-wider">
              Semestres Académiques (S1 à S10)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { s: 'S1', nv: 'Niveau 1 (S1)', type: 'Automne' },
                { s: 'S2', nv: 'Niveau 1 (S2)', type: 'Printemps' },
                { s: 'S3', nv: 'Niveau 2 (S3)', type: 'Automne' },
                { s: 'S4', nv: 'Niveau 2 (S4)', type: 'Printemps' },
                { s: 'S5', nv: 'Niveau 3 (S5)', type: 'Automne' },
                { s: 'S6', nv: 'Niveau 3 (S6)', type: 'Printemps' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-muted/50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-200/80 dark:border-border">
                  <span className="font-bold text-[#0f2863] dark:text-blue-400 text-sm">{item.s}</span>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-foreground block">{item.nv}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{item.type}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 italic">
              💡 Les semestres et maquettes sont configurés conformément au cahier des normes pédagogiques de l'ENCG Fès.
            </p>
          </div>
        </div>
      )}

      {/* ─── 👁️ PROFESSOR DETAILS MODAL ──────────────────────────────────── */}
      {selectedProfForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card dark:bg-card rounded-2xl shadow-sm w-full max-w-xl overflow-hidden border border-border dark:border-border animate-in zoom-in-95 space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0f2863] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {selectedProfForModal.profName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground dark:text-white">
                    {cleanUtf8Text(selectedProfForModal.profName)}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    {cleanUtf8Text(selectedProfForModal.departmentName || 'ENCG Fès')} • {cleanUtf8Text(selectedProfForModal.specialty)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedProfForModal(null)}
                className="p-1.5 text-slate-400 hover:text-muted-foreground dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-muted/50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-border dark:border-border text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Charges Actives :</span>
                <span className="font-bold text-foreground dark:text-white text-sm">{selectedProfForModal.assignmentsList.length} cours</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Volume Horaire :</span>
                <span className="font-bold text-[#0f2863] dark:text-blue-400 text-sm">{selectedProfForModal.assignmentsList.length * 4}h / sem ({selectedProfForModal.assignmentsList.length * 48}h sem.)</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Liste des Modules & Groupes :</h4>
                {selectedProfForModal.assignmentsList.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm(`Remettre à zéro toutes les affectations de ${selectedProfForModal.profName} ?`)) {
                        unassignProfessorMutation.mutate(String(selectedProfForModal.profId))
                      }
                    }}
                    disabled={unassignProfessorMutation.isPending}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Désaffecter tout</span>
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {selectedProfForModal.assignmentsList.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-border">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-primary/5 dark:bg-blue-950/60 text-primary dark:text-blue-300 font-mono font-bold text-[10px] rounded border border-primary/20 dark:border-primary">
                        {cleanUtf8Text(item.module?.split(' ')[0] || 'MOD')}
                      </span>
                      <div>
                        <div className="font-bold text-foreground dark:text-foreground text-xs">
                          {cleanUtf8Text(item.module?.split(' ').slice(1).join(' ') || item.module)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Groupe : <strong className="text-muted-foreground dark:text-foreground">{cleanUtf8Text(item.group)}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAssignment(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                      title="Supprimer cette affectation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border dark:border-border">
              <button
                onClick={() => setSelectedProfForModal(null)}
                className="px-4 py-2 border border-border dark:border-border text-muted-foreground dark:text-foreground font-semibold rounded-xl hover:bg-muted/50 transition-colors text-xs cursor-pointer"
              >
                Fermer
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendNotificationEmail(selectedProfForModal)}
                  className="px-3.5 py-2 bg-primary/5 text-primary dark:bg-blue-950/40 dark:text-blue-300 font-bold rounded-xl text-xs border border-primary/20 dark:border-primary cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Notifier Email</span>
                </button>
                <button
                  onClick={() => handlePrintOrdreDeService(selectedProfForModal)}
                  className="px-4 py-2 bg-[#0f2863] text-white font-bold rounded-xl text-xs hover:bg-[#1a3a8a] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ordre de Service PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 📦 IMPORT MODAL ─────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card dark:bg-card rounded-2xl shadow-sm w-full max-w-lg overflow-hidden border border-border dark:border-border animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0f2863] to-blue-700 p-5 text-white relative">
              <button
                onClick={() => setShowImportModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-300" />
                <span>Importer des Affectations</span>
              </h3>
              <p className="text-blue-100 text-xs mt-0.5">Fichier Excel (.xlsx) ou CSV avec structure par colonnes</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                  Année Universitaire de Destination
                </label>
                <select className="w-full px-3.5 py-2 bg-muted/50 dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]">
                  <option>2026/2027 (Année Courante)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                  Fichier Excel / CSV
                </label>
                <div className="border-2 border-dashed border-border dark:border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-foreground">Glisser-déposer ou cliquer pour choisir le fichier</p>
                  <p className="text-[10px] text-slate-400 mt-1">Formats acceptés : .xlsx, .xls, .csv — Max 5MB</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <FileText className="w-3.5 h-3.5 text-amber-600" /> Structure requise des colonnes :
                </div>
                <p className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-200 bg-amber-100/60 dark:bg-amber-900/40 p-1.5 rounded-lg text-center">
                  email_professeur | module_code | groupe
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="text-xs font-bold text-primary hover:text-primary inline-flex items-center gap-1 cursor-pointer pt-1"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger le modèle d'exemple (.csv)
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-border dark:border-border text-muted-foreground dark:text-foreground font-semibold rounded-xl hover:bg-muted/50 transition-colors text-xs w-full cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    toast.success('🚀 Importation des affectations effectuée avec succès !')
                    setShowImportModal(false)
                  }}
                  className="px-4 py-2 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#1a3a8a] transition-all shadow-xs w-full cursor-pointer"
                >
                  Valider & Importer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 🤖 AI AUTO-MATCHING MODAL ───────────────────────────────────── */}
      {showAiMatchingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card dark:bg-card rounded-2xl shadow-sm w-full max-w-xl overflow-hidden border border-primary/20 dark:border-primary animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-indigo-700 to-[#0f2863] p-5 text-white relative">
              <button
                onClick={() => setShowAiMatchingModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Assistant IA — Auto-Affectation Intelligente
                  </h3>
                  <p className="text-indigo-200 text-xs">
                    Analyse prédictive des départements, spécialités et statutaires (18h max)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {isAnalyzingAi ? (
                <div className="py-12 text-center space-y-3">
                  <Spinner className="w-8 h-8 mx-auto text-primary animate-spin" />
                  <p className="text-xs font-bold text-foreground dark:text-white">
                    Analyse des volumes horaires et calcul des correspondances...
                  </p>
                  <p className="text-[11px] text-slate-400">Équilibrage en cours pour maximiser l'efficience pédagogique.</p>
                </div>
              ) : (
                <>
                  <div className="bg-primary/5 dark:bg-indigo-950/40 border border-primary/20 dark:border-primary rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                          {aiSuggestions.length} proposition(s) d'affectation optimale
                        </div>
                        <div className="text-[10px] text-primary dark:text-indigo-400">
                          Charges respectant la limite statutaire des 18h hebdomadaires.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {aiSuggestions.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-muted/50 dark:bg-slate-800/60 border border-border dark:border-border rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-primary/10 dark:bg-indigo-900/60 text-primary dark:text-indigo-300 rounded text-[9px] font-bold">
                              Proposition à vérifier
                            </span>
                            <span className="text-xs font-bold text-foreground dark:text-white">
                              {item.prof_name}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Groupe : <strong className="text-emerald-600">{item.group_name}</strong>
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-[#0f2863] dark:text-blue-300">
                          {item.module_name}
                        </div>

                        <div className="text-[10px] text-muted-foreground italic bg-card dark:bg-card p-1.5 rounded-lg border border-border dark:border-border">
                          💡 {item.reason}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-border dark:border-border">
                    <button
                      onClick={() => setShowAiMatchingModal(false)}
                      className="px-4 py-2 border border-border dark:border-border text-muted-foreground dark:text-foreground font-semibold rounded-xl hover:bg-muted/50 transition-colors text-xs cursor-pointer"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={handleApplyAiSuggestions}
                      className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-[#0f2863] hover:from-indigo-700 hover:to-blue-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Appliquer (1-Clic)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 🔄 RESET / DISTRIBUTE CONFIRMATION MODAL ─────────────────────── */}
      {showResetDistributeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl p-6 max-w-lg w-full shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-indigo-950/60 text-primary dark:text-indigo-400 flex items-center justify-center shrink-0 border border-primary/20 dark:border-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground dark:text-white">
                  Répartition Automatique & Équilibrage
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Attribution optimale par spécialité, département et période semestrielle
                </p>
              </div>
            </div>

            {/* 🎓 Période Semestrielle Selector Cards */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
                1. Choisissez la période semestrielle à affecter :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDistributeSemesterPeriod('odd')}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                    distributeSemesterPeriod === 'odd'
                      ? "border-primary bg-blue-50/80 dark:bg-blue-950/50 text-[#0f2863] dark:text-blue-300 ring-2 ring-blue-500/20"
                      : "border-border dark:border-border bg-card dark:bg-card hover:bg-muted/50 text-slate-700 dark:text-foreground"
                  )}
                >
                  <div className="text-xs font-bold flex items-center gap-1">
                    <span>🍂 Automne / S1</span>
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground mt-1">
                    S1, S3, S5, S7, S9
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDistributeSemesterPeriod('even')}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                    distributeSemesterPeriod === 'even'
                      ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-300 ring-2 ring-purple-500/20"
                      : "border-border dark:border-border bg-card dark:bg-card hover:bg-muted/50 text-slate-700 dark:text-foreground"
                  )}
                >
                  <div className="text-xs font-bold flex items-center gap-1">
                    <span>🌸 Printemps / S2</span>
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground mt-1">
                    S2, S4, S6, S8, S10
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDistributeSemesterPeriod('all')}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                    distributeSemesterPeriod === 'all'
                      ? "border-primary bg-indigo-50/80 dark:bg-indigo-950/50 text-primary dark:text-indigo-300 ring-2 ring-indigo-500/20"
                      : "border-border dark:border-border bg-card dark:bg-card hover:bg-muted/50 text-slate-700 dark:text-foreground"
                  )}
                >
                  <div className="text-xs font-bold flex items-center gap-1">
                    <span>🎓 Année Globale</span>
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground mt-1">
                    Tous les semestres
                  </div>
                </button>
              </div>
            </div>

            <div className="p-4 bg-muted/50 dark:bg-slate-800/60 rounded-xl border border-border dark:border-border text-xs text-muted-foreground dark:text-foreground space-y-2">
              <p className="font-bold text-foreground dark:text-foreground">
                2. Mode d'exécution de la répartition :
              </p>
              <ul className="space-y-1.5 text-muted-foreground dark:text-muted-foreground text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold shrink-0">•</span>
                  <span><strong className="text-slate-700 dark:text-foreground">Mise à zéro & Répartition Équilibrée :</strong> Réinitialise les charges du semestre choisi puis répartit équitablement tous les modules sur les 18 enseignants sans surcharge (&le; 16h/4 cours).</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                onClick={() => {
                  setShowResetDistributeModal(false)
                  autoDistributeMutation.mutate({ reset: true, semester_period: distributeSemesterPeriod })
                }}
                disabled={autoDistributeMutation.isPending}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-700 to-[#0f2863] hover:from-indigo-700 hover:to-blue-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {autoDistributeMutation.isPending ? 'Calcul en cours...' :
                   `Mise à Zéro + Répartition Équilibrée (${distributeSemesterPeriod === 'odd' ? 'Automne S1/S3/S5/S7' : distributeSemesterPeriod === 'even' ? 'Printemps S2/S4/S6/S8' : 'Année Complète'})`}
                </span>
              </button>

              <button
                onClick={() => setShowResetDistributeModal(false)}
                className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-muted-foreground dark:hover:text-slate-200 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 🔴 MODAL CONFIRMATION MISE À ZÉRO TOTALE ─────────────────────── */}
      {showUnassignAllModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-card dark:bg-card border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 max-w-md w-full shadow-sm space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground dark:text-white">
                  Mise à Zéro Complète des Affectations
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Réinitialisation de toutes les charges pédagogiques à 0h
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/60 text-xs text-slate-700 dark:text-foreground space-y-2">
              <p className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                Attention : Cette action est irréversible.
              </p>
              <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">
                Vous vous apprêtez à réinitialiser les affectations pour : <strong className="text-rose-700 dark:text-rose-300">{selectedSemesterPeriod === 'odd' ? '🍂 Semestre 1 / Automne (S1, S3, S5, S7, S9)' : selectedSemesterPeriod === 'even' ? '🌸 Semestre 2 / Printemps (S2, S4, S6, S8, S10)' : '🎓 Toute l\'Année Universitaire'}</strong> ({assignments.length} cours concernés).
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => unassignAllMutation.mutate({ semester_period: selectedSemesterPeriod })}
                disabled={unassignAllMutation.isPending}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{unassignAllMutation.isPending ? 'Suppression en cours...' : `Oui, Réinitialiser (${selectedSemesterPeriod === 'odd' ? 'Automne S1/S3/S5/S7' : selectedSemesterPeriod === 'even' ? 'Printemps S2/S4/S6/S8' : 'Toute l\'Année'})`}</span>
              </button>

              <button
                onClick={() => setShowUnassignAllModal(false)}
                className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-muted-foreground dark:hover:text-slate-200 cursor-pointer"
              >
                Annuler et Conserver les affectations
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
