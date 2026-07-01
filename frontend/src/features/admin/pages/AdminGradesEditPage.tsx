import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function AdminGradesEditPage() {
  const students = [
    { id: 1, name: 'Aniss el alaoui', matricule: 'S20260001', cc1: '13,10', cc2: '11,50', examen: '7,60', final: '10.00' },
    { id: 2, name: 'Ahmed Naciri', matricule: 'S20260002', cc1: '9,70', cc2: '19,70', examen: '8,90', final: '11.22' },
    { id: 3, name: 'Ilyas Alaoui', matricule: 'S20260003', cc1: '13,70', cc2: '11,20', examen: '3,40', final: '11.62' },
    { id: 4, name: 'Youssef Chraibi', matricule: 'S20260004', cc1: '13,70', cc2: '18,60', examen: '16,10', final: '14.40' },
    { id: 5, name: 'Aya Bennis', matricule: 'S20260005', cc1: '17,80', cc2: '12,30', examen: '13,20', final: '13.94' },
    { id: 6, name: 'Othmane Filali', matricule: 'S20260006', cc1: '13,40', cc2: '13,50', examen: '0,00', final: '12.22' },
    { id: 7, name: 'Ayoub Chraibi', matricule: 'S20260007', cc1: '12,70', cc2: '20,00', examen: '15,10', final: '14.40' },
    { id: 8, name: 'Sara Tazi', matricule: 'S20260008', cc1: '15,00', cc2: '11,00', examen: '11,20', final: '11.92' },
    { id: 9, name: 'Omar Idrissi', matricule: 'S20260009', cc1: '9,10', cc2: '8,90', examen: '12,80', final: '11.28' },
    { id: 10, name: 'Salma El Othmani', matricule: 'S20260010', cc1: '14,20', cc2: '3,50', examen: '0,40', final: '10.38' },
  ]

  const getFinalColor = (noteStr: string) => {
    const note = parseFloat(noteStr.replace(',', '.'))
    if (isNaN(note)) return 'text-slate-800'
    return note >= 10 ? 'text-emerald-500' : 'text-red-500'
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Édition des Notes</h1>
        </div>
        <Link to="/admin/grades" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wide">
          <ArrowLeft className="w-4 h-4" /> Retour au sélecteur
        </Link>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col items-center">
        {/* Dark Blue Banner */}
        <div className="bg-gradient-to-br from-[#0a1945] to-[#14285e] p-8 text-white m-4 rounded-[1.5rem] shadow-md relative overflow-hidden w-[calc(100%-2rem)] flex items-center justify-between">
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-2 block">Groupe Académique</span>
            <h2 className="text-2xl font-bold mb-1">Génie Informatique - Groupe 1</h2>
            <p className="text-blue-200 text-sm">GAMING (INF-107)</p>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-2xl p-4 min-w-[120px] backdrop-blur-sm">
            <span className="text-3xl font-bold text-white mb-1">26</span>
            <span className="text-[9px] font-bold text-blue-200 uppercase tracking-widest text-center">Étudiants<br/>Inscrits</span>
          </div>
        </div>

        {/* Table */}
        <div className="w-full px-4 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] font-bold text-[#0f2863] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-6 pb-4">Étudiant</th>
                <th className="px-6 py-6 pb-4 text-center">CC 1 (20%)</th>
                <th className="px-6 py-6 pb-4 text-center">CC 2 (20%)</th>
                <th className="px-6 py-6 pb-4 text-center">Examen (60%)</th>
                <th className="px-6 py-6 pb-4 text-center">Note Finale Actuelle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        {student.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {student.matricule}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="text"
                      defaultValue={student.cc1}
                      className="w-20 text-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="text"
                      defaultValue={student.cc2}
                      className="w-20 text-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="text"
                      defaultValue={student.examen}
                      className="w-20 text-center rounded-xl border border-pink-200 bg-pink-50/30 px-3 py-2 text-sm font-bold text-slate-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all outline-none"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("font-bold text-base", getFinalColor(student.final))}>
                      {student.final}
                    </span>
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
