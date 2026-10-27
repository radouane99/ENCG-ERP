import { useState } from 'react'

export default function CnieUploadFields({ disabled, ar, onUpload }: { disabled: boolean; ar: boolean; onUpload: (recto: File, verso?: File) => void }) {
  const [recto, setRecto] = useState<File | null>(null)
  const [verso, setVerso] = useState<File | null>(null)
  const [error, setError] = useState('')
  const select = (side: 'recto' | 'verso', file?: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError(ar ? 'الحد الأقصى 10 ميغا لكل وجه.' : '10 Mo maximum par face.'); return }
    setError('')
    const front = side === 'recto' ? file : recto
    const back = side === 'verso' ? file : verso
    if (side === 'recto') setRecto(file); else setVerso(file)
    if (front && back) { onUpload(front, back); setRecto(null); setVerso(null) }
  }
  const inputClass = 'mt-1 block w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900'
  return <fieldset disabled={disabled} className="mt-3 space-y-3">
    <p className="text-xs text-muted-foreground">{ar ? 'أضف صورتي البطاقة. يبدأ الحفظ والاستخراج تلقائياً بعد إضافة الوجهين، أو أرفق PDF يتضمنهما.' : 'Ajoutez les deux photos : dépôt et extraction automatiques dès que les deux faces sont prêtes. Vous pouvez aussi joindre un PDF contenant les deux faces.'}</p>
    <div className="grid gap-3 sm:grid-cols-2">{(['recto', 'verso'] as const).map(side => <label key={side} className="min-w-0 text-xs font-semibold">{ar ? (side === 'recto' ? 'البطاقة الوطنية — الوجه الأمامي' : 'البطاقة الوطنية — الوجه الخلفي') : `CNIE ${side}`}<input aria-label={`CNIE ${side}`} type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} onChange={event => { select(side, event.target.files?.[0]); event.target.value = '' }} />{(side === 'recto' ? recto : verso) && <span className="mt-1 block break-all text-muted-foreground">{(side === 'recto' ? recto : verso)?.name}</span>}</label>)}</div>
    <label className="block text-xs font-semibold">{ar ? 'أو PDF يتضمن الوجهين' : 'Ou PDF recto-verso'}<input aria-label="CNIE PDF recto-verso" type="file" accept="application/pdf" className={inputClass} onChange={event => { const file = event.target.files?.[0]; if (file) { setRecto(null); setVerso(null); onUpload(file) }; event.target.value = '' }} /></label>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
  </fieldset>
}
