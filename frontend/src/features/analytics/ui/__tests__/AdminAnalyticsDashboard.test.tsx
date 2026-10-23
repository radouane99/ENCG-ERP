import { fireEvent,render,screen,waitFor } from '@testing-library/react'
import { describe,expect,it,vi } from 'vitest'
import AdminAnalyticsDashboard from '../AdminAnalyticsDashboard'
import { analyticsApi } from '../../api/analyticsApi'

vi.mock('../../api/analyticsApi', () => ({ analyticsApi: { getAdminAnalytics: vi.fn() } }))

describe('analytics availability', () => {
  it('shows a retryable error instead of inventing zero metrics', async () => {
    vi.mocked(analyticsApi.getAdminAnalytics).mockRejectedValue(new Error('offline'))
    render(<AdminAnalyticsDashboard />)
    expect(await screen.findByRole('alert')).toHaveTextContent('indisponibles')
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    await waitFor(() => expect(analyticsApi.getAdminAnalytics).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
