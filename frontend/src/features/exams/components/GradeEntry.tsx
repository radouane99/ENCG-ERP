import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Save, Lock, AlertTriangle, FileSpreadsheet, Send, Check } from 'lucide-react'
import { cn } from '@shared/lib/utils'

// Mock Data
const students = [
  { id: 'S-01', name: 'Amina Bennani', cne: 'N120000001', cc: 14.5, tp: 15.0, exam: 13.0, final: 13.75, status: 'valid' },
  { id: 'S-02', name: 'Youssef Alaoui', cne: 'M130000002', cc: 11.0, tp: 12.0, exam: 8.5, final: 9.75, status: 'rattrapage' },
  { id: 'S-03', name: 'Sara Idrissi', cne: 'R140000003', cc: 16.0, tp: 17.0, exam: 15.5, final: 15.85, status: 'valid' },
  { id: 'S-04', name: 'Omar Chraibi', cne: 'J150000004', cc: 8.0, tp: 10.0, exam: 5.0, final: 6.5, status: 'failed' },
]

export default function GradeEntry() {
  const { t, i18n } = useTranslation('common')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLocked, setIsLocked] = useState(false)

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Saisie des Notes</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground text-sm font-medium">Module: <span className="text-foreground">Marketing Stratégique (S5)</span></p>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <p className="text-muted-foreground text-sm font-medium">Prof.: <span className="text-foreground">Dr. Bennani</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground border rounded-lg font-medium shadow-sm hover:bg-muted/80 transition-colors text-sm">
            <FileSpreadsheet className="w-4 h-4" />
            Importer Excel
          </button>
          {!isLocked ? (
            <button 
              onClick={() => setIsLocked(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          ) : (
            <button disabled className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium shadow-sm text-sm opacity-90 cursor-not-allowed">
              <Check className="w-4 h-4" />
              Verrouillé & Soumis
            </button>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
          <Lock className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-green-600 dark:text-green-500">Les notes ont été verrouillées</h3>
            <p className="text-xs text-green-600/80 dark:text-green-500/80 mt-1">
              Les notes ont été transmises au service de scolarité pour la délibération. Toute modification ultérieure nécessite une demande d'ouverture.
            </p>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col relative">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher (Nom, CNE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> {`> 12 (Validé)`}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> {`< 12 (Rattrapage)`}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive"></span> {`< 7 (Éliminatoire)`}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Étudiant</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center w-28">CC (20%)</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center w-28">TP (20%)</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center w-28">Examen (60%)</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">Note Finale</th>
                <th scope="col" className="px-6 py-3 font-semibold text-right">Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student) => (
                <tr key={student.id} className="bg-card hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{student.name}</span>
                      <span className="text-xs text-muted-foreground">{student.cne}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input 
                      type="number" 
                      defaultValue={student.cc}
                      disabled={isLocked}
                      className={cn(
                        "w-20 text-center py-1.5 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20",
                        isLocked && "opacity-70 bg-muted cursor-not-allowed"
                      )}
                      min="0" max="20" step="0.25"
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input 
                      type="number" 
                      defaultValue={student.tp}
                      disabled={isLocked}
                      className={cn(
                        "w-20 text-center py-1.5 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20",
                        isLocked && "opacity-70 bg-muted cursor-not-allowed"
                      )}
                      min="0" max="20" step="0.25"
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input 
                      type="number" 
                      defaultValue={student.exam}
                      disabled={isLocked}
                      className={cn(
                        "w-20 text-center py-1.5 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20",
                        isLocked && "opacity-70 bg-muted cursor-not-allowed"
                      )}
                      min="0" max="20" step="0.25"
                    />
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-foreground">
                    <span className={cn(
                      student.final >= 12 ? "text-green-600 dark:text-green-500" :
                      student.final >= 7 ? "text-orange-500" : "text-destructive"
                    )}>
                      {student.final.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {student.final >= 12 && <span className="text-xs font-medium text-green-600 dark:text-green-500">Validé</span>}
                    {student.final < 12 && student.final >= 7 && <span className="text-xs font-medium text-orange-600 dark:text-orange-500">Rattrapage</span>}
                    {student.final < 7 && <span className="text-xs font-medium text-destructive">N. Éliminatoire</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
