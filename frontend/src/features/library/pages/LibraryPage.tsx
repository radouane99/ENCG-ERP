import { useState } from 'react'
import { Search, BookMarked, Clock, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LibraryPage() {
  const { t } = useTranslation('library')
  const [books] = useState([
    { id: 'B001', title: 'Principes de Management', author: 'Stephen Robbins', category: 'Management', available: 5, total: 10 },
    { id: 'B002', title: 'Macroéconomie Avancée', author: 'David Romer', category: 'Économie', available: 0, total: 3 },
    { id: 'B003', title: 'Comptabilité Générale', author: 'Martinet', category: 'Comptabilité', available: 12, total: 15 },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex gap-4">
           <div className="relative w-full max-w-sm">
             <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input type="text" placeholder={t('search')} className="w-full ps-9 pr-4 py-2 text-sm border rounded-lg" />
           </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">{t('columns.title')}</th>
              <th className="px-6 py-3 font-semibold">{t('columns.author')}</th>
              <th className="px-6 py-3 font-semibold text-center">{t('columns.category')}</th>
              <th className="px-6 py-3 font-semibold text-center">{t('columns.availability')}</th>
              <th className="px-6 py-3 font-semibold text-end">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {books.map(b => (
              <tr key={b.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 font-bold">{b.title}</td>
                <td className="px-6 py-4">{b.author}</td>
                <td className="px-6 py-4 text-center">
                   <span className="bg-muted px-2 py-1 rounded text-xs">{b.category}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className={b.available > 0 ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                      {b.available} / {b.total}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{b.available > 0 ? t('status.available') : t('status.out_of_stock')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-end">
                  <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/20 transition-colors">
                    {t('details')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
