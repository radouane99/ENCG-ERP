import { describe,it,expect } from 'vitest'
import { escapeHtml,formatSafeRichText,isPasswordPolicyValid } from '@shared/lib/htmlSafe'
import { safeHtml } from '@shared/lib/escapeHtml'

describe('htmlSafe — XSS and password policy', () => {
  it('escapes HTML tags in chatbot-style content', () => {
    const raw = '<img src=x onerror=alert(1)>hello'
    expect(escapeHtml(raw)).not.toContain('<img')
    expect(escapeHtml(raw)).toContain('&lt;img')
    expect(formatSafeRichText(raw)).not.toMatch(/<img/i)
  })

  it('escapes interpolated values in safeHtml tagged templates', () => {
    const untrusted = '<script>alert("xss")</script>'
    const rendered = safeHtml`<div>${untrusted}</div>`
    expect(rendered).toBe('<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>')
  })

  it('keeps bold markdown after escape', () => {
    expect(formatSafeRichText('**ok**')).toBe('<strong>ok</strong>')
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(isPasswordPolicyValid('Ab1!xyz')).toBe(false)
  })

  it('accepts a mixed-case password with digit and symbol', () => {
    expect(isPasswordPolicyValid('EncgFes!2026')).toBe(true)
  })
})
