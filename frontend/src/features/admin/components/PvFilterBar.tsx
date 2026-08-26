import { BookOpen, Calendar, GraduationCap, Users } from 'lucide-react'
import { PvFilterSelect } from './PvFilterSelect'

type OptionRow = { id: number | string; name?: string; code?: string }

type PvFilterBarProps = {
  isRtl: boolean
  selectedFiliere: string
  selectedSemester: string
  selectedGroup: string
  moduleId: string | null
  filieres: OptionRow[]
  modules: OptionRow[]
  groupes: OptionRow[]
  onFiliereChange: (value: string) => void
  onSemesterChange: (value: string) => void
  onModuleChange: (value: string | number) => void
  onGroupChange: (value: string) => void
}

export function PvFilterBar({
  isRtl,
  selectedFiliere,
  selectedSemester,
  selectedGroup,
  moduleId,
  filieres,
  modules,
  groupes,
  onFiliereChange,
  onSemesterChange,
  onModuleChange,
  onGroupChange,
}: PvFilterBarProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-[2rem] shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <PvFilterSelect
        label={isRtl ? 'الشعبة' : 'Filière'}
        icon={GraduationCap}
        value={selectedFiliere}
        onChange={(val) => onFiliereChange(String(val))}
        placeholder={isRtl ? 'اختر الشعبة' : 'Sélectionnez une filière'}
        options={filieres.map((f) => ({
          value: f.id,
          label: f.name || String(f.code ?? ''),
          badge: f.code,
        }))}
      />
      <PvFilterSelect
        label={isRtl ? 'الدورة' : 'Semestre'}
        icon={Calendar}
        value={selectedSemester}
        onChange={(val) => onSemesterChange(String(val))}
        placeholder={isRtl ? 'اختر الدورة' : 'Tous les semestres'}
        options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => ({
          value: s,
          label: `Semestre ${s}`,
          badge: `S${s}`,
        }))}
      />
      <PvFilterSelect
        label={isRtl ? 'الوحدة' : 'Module'}
        icon={BookOpen}
        value={moduleId || ''}
        onChange={onModuleChange}
        disabled={modules.length === 0}
        placeholder={isRtl ? 'اختر الوحدة' : 'Sélectionnez un module'}
        options={modules.map((m) => ({
          value: m.id,
          label: m.name || String(m.code ?? ''),
          badge: m.code,
        }))}
      />
      <PvFilterSelect
        label={isRtl ? 'الفوج (اختياري)' : 'Groupe (Optionnel)'}
        icon={Users}
        value={selectedGroup}
        onChange={(val) => onGroupChange(String(val))}
        disabled={groupes.length === 0}
        placeholder={isRtl ? 'جميع الأفواج' : 'Tous les groupes'}
        options={groupes.map((g) => ({
          value: g.id,
          label: g.name ?? String(g.id),
          badge: `G${g.id}`,
        }))}
      />
    </div>
  )
}
