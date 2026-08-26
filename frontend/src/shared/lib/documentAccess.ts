import { useAuthStore } from '@stores/authStore'

/** Attach a short-lived staff Bearer token only for serve-document iframe URLs. */
export function protectedDocumentUrl(url: string | undefined | null): string {
  if (!url) {
    return ''
  }
  if (url.includes('sig=') || !url.includes('/serve-document/')) {
    return url
  }
  const token = useAuthStore.getState().token
  if (!token || url.includes('token=')) {
    return url
  }
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
}
