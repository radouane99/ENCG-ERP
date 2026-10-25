import { useEffect, useRef, useState } from 'react'
import { Modal } from '@shared/components/ui/Modal'
import { assessImageQuality, type ImageQualityWarning } from '../model/imageQuality'

/** Image preparation stays in the browser until the candidate confirms the upload. */
export default function PrepareDocumentImage({ file, onCancel, onPrepared, photo = false, ar = false }: { file: File; onCancel: () => void; onPrepared: (file: File) => void; photo?: boolean; ar?: boolean }) {
  const [url, setUrl] = useState(''); const [rotation, setRotation] = useState(0); const [crop, setCrop] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [quality, setQuality] = useState('')
  const image = useRef<HTMLImageElement>(null)
  const [warnings, setWarnings] = useState<ImageQualityWarning[]>([]); const [checked, setChecked] = useState(false); const [ready, setReady] = useState(false)
  const warningLabels = ar ? { resolution: 'دقة الصورة ضعيفة؛ قد يصعب قراءة الحروف الصغيرة.', dark: 'الصورة مظلمة؛ أعد التصوير في إضاءة أفضل.', blank: 'الوثيقة قد تكون فارغة أو شديدة الإضاءة.', blur: 'احتمال ضبابية الصورة أو ضعف وضوح النص.' } : { resolution: 'Résolution faible : les petits caractères peuvent être illisibles.', dark: 'Image sombre : reprenez la photo avec un meilleur éclairage.', blank: 'Image presque blanche : vérifiez que le document est visible.', blur: 'Flou possible ou texte peu visible : vérifiez la netteté.' }
  useEffect(() => { const value = URL.createObjectURL(file); setUrl(value); return () => URL.revokeObjectURL(value) }, [file])
  const prepare = async () => {
    const img = image.current
    if (!img?.naturalWidth) return
    setBusy(true); setError('')
    try {
      const scale = Math.min(1, 2800 / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale); const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas'); const turn = rotation % 180 !== 0
      canvas.width = turn ? h : w; canvas.height = turn ? w : h
      const context = canvas.getContext('2d'); if (!context) throw new Error('Préparation indisponible. Vous pouvez envoyer l’original.')
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
      context.translate(canvas.width / 2, canvas.height / 2); context.rotate(rotation * Math.PI / 180); context.drawImage(img, -w / 2, -h / 2, w, h)
      const result = document.createElement('canvas'); result.width = Math.round(canvas.width * (1 - crop * 2 / 100)); result.height = Math.round(canvas.height * (1 - crop * 2 / 100))
      const output = result.getContext('2d'); if (!output) throw new Error('Préparation indisponible. Vous pouvez envoyer l’original.')
      output.drawImage(canvas, canvas.width * crop / 100, canvas.height * crop / 100, result.width, result.height, 0, 0, result.width, result.height)
      const blob = await new Promise<Blob | null>(resolve => result.toBlob(resolve, 'image/jpeg', 0.92)); if (!blob) throw new Error('Conversion impossible. Envoyez l’original.')
      onPrepared(new File([blob], 'document-prepare.jpg', { type: 'image/jpeg' }))
    } catch (e) { setError(e instanceof Error ? e.message : 'Conversion impossible.') } finally { setBusy(false) }
  }
  const checkQuality = () => {
    const img = image.current; if (!img) return
    const c = document.createElement('canvas'); c.width = 240; c.height = 180
    try {
      const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) throw new Error('canvas')
      ctx.drawImage(img, 0, 0, c.width, c.height); const px = ctx.getImageData(0, 0, c.width, c.height).data
      setWarnings(assessImageQuality(px, c.width, c.height, img.naturalWidth, img.naturalHeight, photo))
    } catch {
      setWarnings(['resolution'])
    }
    setReady(true)
    setQuality(ar ? 'تحقق من ظهور الأركان الأربعة ومن وضوح النص. هذا الفحص إرشادي ولا يؤكد جودة القراءة أو صحة الوثيقة.' : 'Vérifiez les quatre coins et la lisibilité du texte. Ce contrôle est indicatif et ne certifie ni la qualité de lecture ni l’authenticité.')
  }
  return <Modal open title={ar ? 'تحضير صورة الوثيقة' : 'Préparer la photo du document'} onClose={onCancel} size="lg" description={ar ? 'لا يتم إرسال أي ملف قبل تأكيدك. حافظ على ظهور كل المعلومات.' : 'Aucun fichier n’est envoyé avant votre confirmation. Gardez tous les champs visibles.'}>
    <div dir={ar ? 'rtl' : 'ltr'} className="space-y-3"><div className="overflow-hidden rounded-lg bg-muted p-8"><img ref={image} src={url} onLoad={checkQuality} onError={() => { setReady(true); setWarnings(['resolution']); setQuality(ar ? 'تعذر عرض الصورة؛ اختر صورة أخرى أو تحقق من الأصل قبل إرساله.' : 'Aperçu indisponible : choisissez une autre image ou vérifiez l’original avant envoi.') }} alt={ar ? 'معاينة الوثيقة' : 'Document à préparer'} className="mx-auto max-h-80 max-w-full object-contain" style={{ transform: `rotate(${rotation}deg)`, clipPath: `inset(${crop}%)` }}/></div>
    {!!warnings.length && <ul role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">{warnings.map(warning => <li key={warning}>{warningLabels[warning]}</li>)}</ul>}
    {(warnings.length > 0 || crop > 0) && <label className="flex gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="mt-1 h-5 w-5 shrink-0"/>{ar ? 'تحققت من وضوح الصورة ومن أن المعلومات والأركان غير مقطوعة؛ أريد المتابعة.' : 'J’ai vérifié la lisibilité et les quatre coins : aucun champ utile n’est coupé. Je souhaite continuer.'}</label>}
    <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">{quality}</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} className="min-h-11 rounded-lg border px-4 text-sm" onClick={() => setRotation(x => (x + 90) % 360)}>{ar ? 'تدوير 90 درجة' : 'Tourner de 90°'}</button><label className="flex-1 text-sm">{ar ? 'اقتطاع الحواف' : 'Retirer les bordures'} : {crop}%<input aria-label={ar ? 'اقتطاع حواف الصورة' : 'Recadrage des bordures'} type="range" min={0} max={20} value={crop} onChange={e => { setCrop(Number(e.target.value)); setChecked(false) }} className="mt-2 block min-h-8 w-full"/></label></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-5 flex flex-wrap justify-end gap-3"><button disabled={busy || !ready || ((warnings.length > 0 || crop > 0) && !checked)} className="min-h-11 rounded-lg border px-4 text-sm disabled:opacity-50" onClick={() => onPrepared(file)}>{ar ? 'إرسال الصورة الأصلية' : 'Envoyer l’original'}</button><button disabled={busy || !ready || ((warnings.length > 0 || crop > 0) && !checked)} className="min-h-11 rounded-lg bg-secondary px-4 text-sm font-semibold text-white disabled:opacity-50" onClick={() => void prepare()}>{busy ? (ar ? 'جارٍ التحضير…' : 'Préparation…') : (ar ? 'تأكيد وإرسال' : 'Confirmer et envoyer')}</button></div></div>
  </Modal>
}
