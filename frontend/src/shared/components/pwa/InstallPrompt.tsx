import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-[#0f2863] text-white p-4 rounded-2xl shadow-xl z-50 animate-in slide-in-from-bottom-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-1">Installer ENCG ERP</h3>
          <p className="text-xs text-blue-200">
            Installez l'application sur votre appareil pour un accès rapide et une meilleure expérience.
          </p>
        </div>
        <button 
          onClick={() => setShowPrompt(false)}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-300" />
        </button>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleInstallClick}
          className="bg-white text-[#0f2863] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Installer l'application
        </button>
      </div>
    </div>
  )
}
