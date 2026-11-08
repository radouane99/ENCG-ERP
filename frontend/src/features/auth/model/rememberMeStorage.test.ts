import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearRememberedLogin,
  loadRememberedLogin,
  saveRememberedLogin,
} from './rememberMeStorage'

describe('rememberMeStorage', () => {
  beforeEach(() => {
    clearRememberedLogin()
  })

  it('persists and restores the remembered identifier when remember is true', () => {
    const saved = saveRememberedLogin('  etudiant@encg-fes.ac.ma  ', true)
    expect(saved.remember).toBe(true)
    expect(saved.identifier).toBe('etudiant@encg-fes.ac.ma')

    const loaded = loadRememberedLogin()
    expect(loaded.remember).toBe(true)
    expect(loaded.identifier).toBe('etudiant@encg-fes.ac.ma')
    expect(loaded.savedAt).not.toBeNull()
  })

  it('clears storage when remember is false or clearRememberedLogin is called', () => {
    saveRememberedLogin('N139876543', true)
    saveRememberedLogin('N139876543', false)

    const loaded = loadRememberedLogin()
    expect(loaded.remember).toBe(false)
    expect(loaded.identifier).toBe('')
  })
})

