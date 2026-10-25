import { useState } from 'react'
import { Mail } from 'lucide-react'

export default function AdminMessagesPage() {
  const [messages] = useState([])

  return (
    <div className="space-y-6 animate-in max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-[#0f2863] text-center erp-page-title">Boîte de Réception (Contact)</h1>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-wider border-b border-border">
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
                  <tr key={msg.id} className="hover:bg-muted/50 transition-colors group">
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
