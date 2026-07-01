import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function AdminActivityLogsPage() {
  const [logs] = useState([
    { id: 1, user: 'Radouane El Asri', action: 'Status updated', type: 'Request', desc: 'Le statut de la demande \'Relevé de Notes...', ip: '79.127.170.81', date: '01/07/2026 11:05', actionColor: 'bg-slate-100 text-slate-700' },
    { id: 2, user: 'Radouane El Asri', action: 'Status updated', type: 'Request', desc: 'Le statut de la demande \'Attestation de T...', ip: '79.127.170.81', date: '01/07/2026 11:05', actionColor: 'bg-slate-100 text-slate-700' },
    { id: 3, user: 'Radouane El Asri', action: 'Status updated', type: 'Request', desc: 'Le statut de la demande \'Attestation de T...', ip: '79.127.170.81', date: '01/07/2026 11:05', actionColor: 'bg-slate-100 text-slate-700' },
    { id: 4, user: 'Radouane El Asri', action: 'Approved', type: 'Absence', desc: 'Absence manuellement justifiée #78.', ip: '79.127.170.81', date: '01/07/2026 11:01', actionColor: 'bg-emerald-100 text-emerald-700' },
    { id: 5, user: 'Radouane El Asri', action: 'Approved', type: 'Absence', desc: 'Absence manuellement justifiée #60.', ip: '79.127.170.81', date: '01/07/2026 11:01', actionColor: 'bg-emerald-100 text-emerald-700' },
    { id: 6, user: 'Radouane El Asri', action: 'Created', type: 'Reservation', desc: 'Administration : Création d\'une réservati...', ip: '79.127.170.81', date: '01/07/2026 10:43', actionColor: 'bg-blue-100 text-blue-700' },
    { id: 7, user: 'Radouane El Asri', action: 'Login', type: 'User', desc: 'Double authentification 2FA réussie pour...', ip: '79.127.170.81', date: '01/07/2026 09:48', actionColor: 'bg-indigo-100 text-indigo-700' },
    { id: 8, user: 'Radouane El Asri', action: 'Login', type: 'User', desc: 'Double authentification 2FA réussie pour...', ip: '79.127.170.81', date: '27/06/2026 00:57', actionColor: 'bg-indigo-100 text-indigo-700' },
    { id: 9, user: 'Radouane El Asri', action: 'Login', type: 'User', desc: 'Double authentification 2FA réussie pour...', ip: '79.127.170.81', date: '26/06/2026 08:32', actionColor: 'bg-indigo-100 text-indigo-700' },
    { id: 10, user: 'Radouane El Asri', action: 'Login', type: 'User', desc: 'Double authentification 2FA réussie pour...', ip: '79.127.170.81', date: '24/06/2026 22:25', actionColor: 'bg-indigo-100 text-indigo-700' },
    { id: 11, user: 'Radouane El Asri', action: 'Updated', type: 'Student', desc: 'Affectation automatique équilibrée de 1 é...', ip: '79.127.170.81', date: '24/06/2026 14:05', actionColor: 'bg-slate-100 text-slate-700' },
  ])

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] text-center italic">Journal d'Activité</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">UTILISATEUR</th>
                <th className="px-6 py-4">ACTION</th>
                <th className="px-6 py-4">TYPE</th>
                <th className="px-6 py-4">DESCRIPTION</th>
                <th className="px-6 py-4">IP</th>
                <th className="px-6 py-4">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0f2863] text-white flex items-center justify-center font-bold text-[10px]">
                      R
                    </div>
                    {log.user}
                  </td>
                  <td className="px-6 py-3">
                    <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold", log.actionColor)}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-bold text-blue-600">
                    {log.type}
                  </td>
                  <td className="px-6 py-3 text-slate-500 truncate max-w-[250px]">
                    {log.desc}
                  </td>
                  <td className="px-6 py-3 text-slate-400 font-mono text-[10px]">
                    {log.ip}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {log.date}
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
