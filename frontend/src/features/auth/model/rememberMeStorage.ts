export interface RememberedLoginState {
  remember: boolean
  identifier: string
  savedAt: string | null
}

const STORAGE_KEY = 'encg_auth_remember_me_v1'

export function loadRememberedLogin(): RememberedLoginState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { remember: false, identifier: '', savedAt: null }
    }
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { remember: false, identifier: '', savedAt: null }
    }
    const parsed = JSON.parse(raw) as Partial<RememberedLoginState>
    if (!parsed || !parsed.remember || typeof parsed.identifier !== 'string') {
      return { remember: false, identifier: '', savedAt: null }
    }
    return {
      remember: true,
      identifier: parsed.identifier.trim(),
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : null,
    }
  } catch {
    return { remember: false, identifier: '', savedAt: null }
  }
}

export function saveRememberedLogin(identifier: string, remember: boolean): RememberedLoginState {
  const clean = identifier.trim()
  if (!remember || !clean) {
    clearRememberedLogin()
    return { remember: false, identifier: '', savedAt: null }
  }

  const state: RememberedLoginState = {
    remember: true,
    identifier: clean,
    savedAt: new Date().toISOString(),
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  } catch {
    // Ignore localStorage quota issues
  }

  return state
}

export function clearRememberedLogin(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Ignore
  }
}

