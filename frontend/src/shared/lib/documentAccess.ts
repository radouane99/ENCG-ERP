/** Same-origin PDFs use the HttpOnly auth cookie — never put the Sanctum token in the URL. */
export function withAuthQuery(url: string): string {
  return url || ''
}

export function protectedDocumentUrl(url: string | undefined | null): string {
  return url || ''
}

export function openAuthenticatedUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}
