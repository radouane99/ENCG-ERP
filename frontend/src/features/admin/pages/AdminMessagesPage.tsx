import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Search, Trash2, Eye } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function AdminMessagesPage() {
  const [messages] = useState([])

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] text-center">Boîte de Réception (Contact)</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">EXPÉDITEUR</th>
                <th className="px-6 py-4">SUJET</th>
                <th className="px-6 py-4">STATUT</th>
                <th className="px-6 py-4">APERÇU</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {messages.length > 0 ? (
                messages.map((msg: any) => (
                  <tr key={msg.id} className="hover:bg-slate-50 transition-colors group">
                    {/* Render message row here if there are messages */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Mail className="w-12 h-12 text-slate-200" />
                      <p className="font-bold text-xs uppercase tracking-wider">AUCUN MESSAGE REÇU POUR LE MOMENT.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
