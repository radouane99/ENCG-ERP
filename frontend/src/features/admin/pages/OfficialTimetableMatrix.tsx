import React from 'react'
import { cn } from '@/shared/lib/utils'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

function SectionTable({ section }: { section: any }) {
  const rows = section?.rows || []
  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-lg font-black tracking-wide">{section.title}</h3>
        <p className="text-xs text-slate-500">{section.filiere_code} {section.filiere_name} · {section.semester_label} · {section.academic_year}</p>
      </div>
      <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white">
        <table className="w-full min-w-[980px] border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 font-black">Semestre</th>
              <th className="border border-slate-300 p-2 font-black">Modules</th>
              <th className="border border-slate-300 p-2 font-black">Éléments</th>
              <th className="border border-slate-300 p-2 font-black">Intervenants</th>
              {DAYS.map((d) => (
                <th key={d} className="border border-slate-300 p-2 font-black">{d}</th>
              ))}
              <th className="border border-slate-300 p-2 font-black">Salles</th>
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
                  <td rowSpan={rows.length} className="border border-slate-300 p-2 text-center font-black align-middle bg-slate-50">
                    {section.semester_label}
                  </td>
                )}
                {row.show_module && (
                  <td rowSpan={row.module_rowspan} className="border border-slate-300 p-2 text-center font-black align-middle">
                    {row.module_label}
                  </td>
                )}
                <td className="border border-slate-300 p-2">{row.element_name}</td>
                <td className="border border-slate-300 p-2 font-bold" style={{ color: row.color }}>{row.professor_name}</td>
                {[1, 2, 3, 4, 5].map((day) => (
                  <td key={day} className={cn('border border-slate-300 p-1.5 align-top')} style={{ color: row.color }}>
                    {(row.days?.[day] || []).map((slot: string) => (
                      <div key={slot}>{slot}</div>
                    ))}
                  </td>
                ))}
                <td className="border border-slate-300 p-2 text-center font-bold">{row.room_label}</td>
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
