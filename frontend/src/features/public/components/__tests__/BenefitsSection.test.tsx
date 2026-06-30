import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BenefitsSection from '../BenefitsSection'

describe('BenefitsSection', () => {
  it('renders the benefit cards and section heading', () => {
    render(<BenefitsSection />)

    expect(screen.getByText(/valeurs clés/i)).toBeInTheDocument()
    expect(screen.getByText(/opérations unifiées/i)).toBeInTheDocument()
    expect(screen.getByText(/sécurité d’état/i)).toBeInTheDocument()
    expect(screen.getByText(/ia accessible/i)).toBeInTheDocument()
    expect(screen.getByText(/expérience fluide/i)).toBeInTheDocument()
  })
})
