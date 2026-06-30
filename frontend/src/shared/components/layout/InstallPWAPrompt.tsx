import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    
    setIsVisible(false);
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
        "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
      )}
      title="Installer l'application ENCG"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Installer l'App</span>
    </button>
  );
}
