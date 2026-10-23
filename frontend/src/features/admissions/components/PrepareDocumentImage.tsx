import { useEffect, useRef, useState } from 'react'
import { Modal } from '@shared/components/ui/Modal'

/** Image preparation stays in the browser until the candidate confirms the upload. */
export default function PrepareDocumentImage({ file, onCancel, onPrepared }: { file: File; onCancel: () => void; onPrepared: (file: File) => void }) {
  const [url, setUrl] = useState(''); const [rotation, setRotation] = useState(0); const [crop, setCrop] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [quality, setQuality] = useState('')
  const image = useRef<HTMLImageElement>(null)
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
      context.translate(canvas.width / 2, canvas.height / 2); context.rotate(rotation * Math.PI / 180); context.drawImage(img, -w / 2, -h / 2, w, h)
      const result = document.createElement('canvas'); result.width = Math.round(canvas.width * (1 - crop * 2 / 100)); result.height = Math.round(canvas.height * (1 - crop * 2 / 100))
      result.getContext('2d')?.drawImage(canvas, canvas.width * crop / 100, canvas.height * crop / 100, result.width, result.height, 0, 0, result.width, result.height)
      const blob = await new Promise<Blob | null>(resolve => result.toBlob(resolve, 'image/jpeg', 0.92)); if (!blob) throw new Error('Conversion impossible. Envoyez l’original.')
      onPrepared(new File([blob], 'document-prepare.jpg', { type: 'image/jpeg' }))
    } catch (e) { setError(e instanceof Error ? e.message : 'Conversion impossible.') } finally { setBusy(false) }
  }
  const checkQuality = () => {
    const img = image.current; if (!img) return
    if (Math.min(img.naturalWidth, img.naturalHeight) < 600) { setQuality('La résolution est faible. Reprenez la photo de plus près si les petits caractères sont difficiles à lire.'); return }
    const c = document.createElement('canvas'); c.width = 240; c.height = 180
    const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return
    ctx.drawImage(img, 0, 0, c.width, c.height); const px = ctx.getImageData(0, 0, c.width, c.height).data
    let variation = 0
    for (let i = 4; i < px.length; i += 4) variation += Math.abs(px[i] - px[i - 4])
    setQuality(variation / (c.width * c.height) < 3 ? 'L’image semble peu contrastée. Vérifiez le flou et l’éclairage avant l’envoi.' : 'Vérifiez les quatre coins et la lisibilité des petits caractères. Ce contrôle visuel ne certifie pas la qualité de lecture.')
  }
  return <Modal open title="Préparer la photo du document" onClose={onCancel} size="lg" description="Aucun fichier n’est envoyé avant votre confirmation. Gardez tous les champs visibles.">
    <div className="overflow-hidden rounded-lg bg-slate-100 p-8"><img ref={image} src={url} onLoad={checkQuality} alt="Document à préparer" className="mx-auto max-h-80 max-w-full object-contain" style={{ transform: `rotate(${rotation}deg)`, clipPath: `inset(${crop}%)` }}/></div>
    <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">{quality}</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} className="min-h-11 rounded-lg border px-4 text-sm" onClick={() => setRotation(x => (x + 90) % 360)}>Tourner de 90°</button><label className="flex-1 text-sm">Retirer les bordures : {crop}%<input aria-label="Recadrage des bordures" type="range" min={0} max={20} value={crop} onChange={e => setCrop(Number(e.target.value))} className="mt-2 block min-h-8 w-full"/></label></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-5 flex flex-wrap justify-end gap-3"><button disabled={busy} className="min-h-11 rounded-lg border px-4 text-sm" onClick={() => onPrepared(file)}>Envoyer l’original</button><button disabled={busy} className="min-h-11 rounded-lg bg-blue-900 px-4 text-sm font-semibold text-white" onClick={() => void prepare()}>{busy ? 'Préparation…' : 'Confirmer et envoyer'}</button></div>
  </Modal>
}
