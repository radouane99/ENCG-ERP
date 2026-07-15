import { useEffect } from 'react'
import { toast } from 'sonner'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { useAuthStore } from '@stores/authStore'
import api from '@shared/lib/api'

// Make Pusher available globally for Laravel Echo
window.Pusher = Pusher

export function useReverbNotifications() {
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    // Only connect if the user is a professor
    if (!user || !user.roles.includes('professeur')) return

    // Get Reverb config from environment
    const echo = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
      wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
      enabledTransports: ['ws', 'wss'],
      authorizer: (channel: any, options: any) => {
        return {
          authorize: (socketId: string, callback: any) => {
            api.post('/broadcasting/auth', {
              socket_id: socketId,
              channel_name: channel.name
            })
            .then(response => {
              callback(false, response.data);
            })
            .catch(error => {
              callback(true, error);
            });
          }
        };
      },
    })

    // Listen to the professors private channel
    echo.private('professors')
      .listen('.grade.period.changed', (e: any) => {
        toast.message('Phase de saisie mise à jour', {
          description: `La direction a changé la phase de saisie des notes vers : ${e.newPhase}.`,
          duration: 10000,
          icon: '🔄'
        })
      })
      .listen('.grade.deadline.warning', (e: any) => {
        toast.warning('Rappel de délai !', {
          description: `N'oubliez pas de finaliser la saisie des notes avant le ${e.endDate} pour la session ${e.sessionLabel}.`,
          duration: 10000,
          icon: '⏳'
        })
      })

    return () => {
      echo.leave('professors')
      echo.disconnect()
    }
  }, [user])
}
