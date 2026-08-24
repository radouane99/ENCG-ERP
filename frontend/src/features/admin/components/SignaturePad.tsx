import { useRef, useState } from 'react'

export function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const point = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { x, y } = point(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setHasDrawn(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { x, y } = point(e)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (canvasRef.current && hasDrawn) {
      onSave(canvasRef.current.toDataURL('image/png'))
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    onSave('')
  }

  return (
    <div className="space-y-2">
      <div className="relative bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-2xl overflow-hidden touch-none shadow-inner">
        <canvas
          ref={canvasRef}
          width={440}
          height={140}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 cursor-crosshair"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
            Dessinez votre signature manuelle ou tactile ici...
          </div>
        )}
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[10px] text-slate-400 italic font-medium">
          {hasDrawn ? 'Empreinte manuelle capturée' : 'Utilisez votre souris, stylet ou doigt'}
        </span>
        <button
          type="button"
          onClick={clearCanvas}
          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg font-bold transition-all text-[11px] cursor-pointer"
        >
          Effacer
        </button>
      </div>
    </div>
  )
}
