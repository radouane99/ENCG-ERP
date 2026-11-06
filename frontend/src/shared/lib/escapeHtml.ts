/**
 * Shared HTML escaping utility to prevent DOM XSS in printable document generators
 * (`win.document.write(...)`) and rich text renderers.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Tagged template helper that automatically HTML-escapes all interpolated values.
 */
export function safeHtml(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, idx) => {
    const val = idx < values.length ? escapeHtml(values[idx]) : ''
    return acc + str + val
  }, '')
}
