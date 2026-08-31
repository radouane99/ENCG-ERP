import React from 'react'
import { cn } from '@/shared/lib/utils'
import { FileText } from 'lucide-react'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

function SectionTable({ section }: { section: any }) {
  const rows = section?.rows || []
  const filiereId = section?.filiere_id || 0
  const semesterNum = section?.semester_number || ''
  const exportUrl = filiereId 
    ? `/api/timetable/export/filiere/${filiereId}/pdf${semesterNum ? `?semester_number=${semesterNum}` : ''}`
    : `/api/timetable/export/all/0/pdf${semesterNum ? `?semester_number=${semesterNum}` : ''}`

  return (
    <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#0f2863] text-white text-[10px] font-black uppercase tracking-wider">
              {section.filiere_code || 'FILIÈRE'}
            </span>
            <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">{section.title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{section.filiere_name} · {section.semester_label} · Année {section.academic_year}</p>
        </div>

        <a
          href={exportUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:bg-slate-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Télécharger {section.filiere_code || ''} (PDF 1 Page)</span>
        </a>
      </div>

      <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full min-w-[980px] border-collapse text-[11px] table-fixed">
          <colgroup>
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '14.5%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80">
              <th className="border border-slate-300 dark:border-slate-700 p-2 font-black">Semestre</th>
              <th className="border border-slate-300 dark:border-slate-700 p-2 font-black">Modules</th>
              <th className="border border-slate-300 dark:border-slate-700 p-2 font-black">Éléments</th>
              <th className="border border-slate-300 dark:border-slate-700 p-2 font-black">Intervenants</th>
              {DAYS.map((d) => (
                <th key={d} className="border border-slate-300 dark:border-slate-700 p-2 font-black text-center">{d}</th>
              ))}
              <th className="border border-slate-300 dark:border-slate-700 p-2 font-black text-center">Salles</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400">Aucune séance</td>
              </tr>
            ) : rows.map((row: any, index: number) => (
              <tr key={`${section.filiere_code}-${section.semester_number}-${row.module_label}-${row.professor_id}-${index}`}>
                {index === 0 && (
                  <td rowSpan={rows.length} className="border border-slate-300 dark:border-slate-700 p-2 text-center font-black align-middle bg-slate-50 dark:bg-slate-800/50">
                    {section.semester_label}
                  </td>
                )}
                {row.show_module && (
                  <td rowSpan={row.module_rowspan} className="border border-slate-300 dark:border-slate-700 p-2 text-center font-black align-middle">
                    {row.module_label}
                  </td>
                )}
                <td className="border border-slate-300 dark:border-slate-700 p-2">{row.element_name}</td>
                <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold" style={{ color: row.color }}>{row.professor_name}</td>
                {[1, 2, 3, 4, 5].map((day) => (
                  <td key={day} className={cn('border border-slate-300 dark:border-slate-700 p-1.5 align-middle text-center font-bold')} style={{ color: row.color }}>
                    {(row.days?.[day] || []).map((slot: string) => (
                      <div key={slot} className="text-[10px] whitespace-nowrap">{slot}</div>
                    ))}
                  </td>
                ))}
                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold">{row.room_label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function OfficialTimetableMatrix({ matrix }: { matrix: any }) {
  if (!matrix) {
    return <p className="text-sm text-slate-400 py-10 text-center">Charge des emplois du temps pour voir le modèle officiel (toutes filières / semestres).</p>
  }

  const sections = matrix.sections || (matrix.rows ? [matrix] : [])

  if (sections.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Aucune séance pour ce filtre. Choisissez une autre filière ou un autre semestre (S1–S10).</p>
  }

  return (
    <div className="space-y-10">
      <p className="text-xs text-slate-500">
        {sections.length} grille{sections.length > 1 ? 's' : ''} · même format que le PDF papier ENCG (TC, GFC, MCM… / S1 à S10)
      </p>
      {sections.map((section: any) => (
        <SectionTable key={`${section.filiere_id}-${section.semester_number}-${section.filiere_code}`} section={section} />
      ))}
    </div>
  )
}
