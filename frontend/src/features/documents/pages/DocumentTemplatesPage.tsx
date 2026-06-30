import { useState } from 'react'
import { FileText, Plus, Edit2, Trash2, Download } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function DocumentTemplatesPage() {
  const [templates] = useState([
    { id: 1, name: 'Attestation de Scolarité', type: 'PDF', lastModified: '2026-06-01', status: 'active' },
    { id: 2, title: 'Relevé de Notes (Format Bilingue)', type: 'PDF', lastModified: '2026-06-15', status: 'active' },
    { id: 3, title: 'Convention de Stage PFE', type: 'Word', lastModified: '2026-05-20', status: 'active' },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modèles de Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez les templates officiels pour la génération automatique.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm">
          <Plus className="w-4 h-4" /> Nouveau Modèle
        </button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">Nom du Modèle</th>
              <th className="px-6 py-3 font-semibold text-center">Format</th>
              <th className="px-6 py-3 font-semibold">Dernière modif.</th>
              <th className="px-6 py-3 font-semibold text-center">Statut</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {templates.map(t => (
              <tr key={t.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 font-bold flex items-center gap-2">
                   <FileText className="w-4 h-4 text-primary" /> {t.name || t.title}
                </td>
                <td className="px-6 py-4 text-center">
                   <span className="bg-muted px-2 py-1 rounded text-xs font-bold">{t.type}</span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{t.lastModified}</td>
                <td className="px-6 py-4 text-center">
                   <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-600 border-green-200">
                     Actif
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-muted-foreground hover:text-primary"><Download className="w-4 h-4"/></button>
                    <button className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4"/></button>
                    <button className="p-1.5 text-muted-foreground hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
