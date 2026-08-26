import { useAuthStore } from '@stores/authStore'

export function getAuthToken(): string {
  return useAuthStore.getState().token || ''
}

export function withAuthQuery(url: string): string {
  if (!url) {
    return ''
  }
  if (url.includes('sig=') || url.includes('token=')) {
    return url
  }
  const token = getAuthToken()
  if (!token) {
    return url
  }
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
}

/** Attach a short-lived staff Bearer token only for serve-document iframe URLs. */
export function protectedDocumentUrl(url: string | undefined | null): string {
  if (!url) {
    return ''
  }
  if (url.includes('sig=') || !url.includes('/serve-document/')) {
    return withAuthQuery(url)
  }
  return withAuthQuery(url)
}

export function openAuthenticatedUrl(url: string): void {
  window.open(withAuthQuery(url), '_blank', 'noopener,noreferrer')
}
