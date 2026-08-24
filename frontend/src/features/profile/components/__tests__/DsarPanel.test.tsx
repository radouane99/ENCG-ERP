import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@shared/lib/api'
import { DsarPanel } from '../DsarPanel'

vi.mock('@shared/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <DsarPanel />
    </QueryClientProvider>,
  )
}

describe('DsarPanel completed export download', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/v1/privacy/export') {
        return Promise.resolve({
          data: {
            data: [{ id: 7, status: 'completed', request_type: 'access' }],
          },
        })
      }
      return Promise.resolve({ data: new Blob(['{"ok":true}'], { type: 'application/json' }) })
    })

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:dsar-export'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
    HTMLAnchorElement.prototype.click = vi.fn()
  })

  it('does not expose an unauthenticated same-origin href for the DSAR file', async () => {
    renderPanel()

    const download = await screen.findByTestId('dsar-download')
    expect(download.tagName).toBe('BUTTON')
    expect(document.querySelector('a[href*="privacy/export"]')).toBeNull()
  })

  it('downloads the completed export through the authenticated API client', async () => {
    renderPanel()

    fireEvent.click(await screen.findByTestId('dsar-download'))

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/v1/privacy/export/7/download', {
        responseType: 'blob',
      })
    })
  })
})
