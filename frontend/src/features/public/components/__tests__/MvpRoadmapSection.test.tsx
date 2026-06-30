import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MvpRoadmapSection from '../MvpRoadmapSection'

describe('MvpRoadmapSection', () => {
  it('renders the MVP roadmap phases', () => {
    render(<MvpRoadmapSection />)

    expect(screen.getByText(/roadmap mvp/i)).toBeInTheDocument()
    expect(screen.getByText(/phase 1/i)).toBeInTheDocument()
    expect(screen.getAllByText(/examens/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/documents officiels/i).length).toBeGreaterThan(0)
  })
})
