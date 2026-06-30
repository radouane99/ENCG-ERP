import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@shared/lib/api'
import ForgotPasswordPage from '../ForgotPasswordPage'
import ResetPasswordPage from '../ResetPasswordPage'

vi.mock('@shared/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api, true)

describe('password auth routes', () => {
  beforeEach(() => {
    mockedApi.post.mockReset()
    mockedApi.post.mockResolvedValue({ data: {} } as never)
  })

  it('sends the forgot-password request to the v1 auth endpoint', async () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/adresse email universitaire/i), {
      target: { value: 'student@encg.ma' },
    })
    fireEvent.click(screen.getByRole('button', { name: /envoyer le lien/i }))

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/v1/auth/forgot-password', {
        email: 'student@encg.ma',
      })
    })
  })

  it('sends the reset-password request to the v1 auth endpoint', async () => {
    render(
      <MemoryRouter initialEntries={['/reset-password?email=student@encg.ma&token=test-token']}>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/8 caractères minimum/i), {
      target: { value: 'NewPassword123' },
    })
    fireEvent.change(screen.getByPlaceholderText(/confirmez le mot de passe/i), {
      target: { value: 'NewPassword123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /mettre à jour le mot de passe/i }))

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/v1/auth/reset-password', {
        email: 'student@encg.ma',
        token: 'test-token',
        password: 'NewPassword123',
        password_confirmation: 'NewPassword123',
      })
    })
  })
})
