import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TestimonialsSection from '../TestimonialsSection'

describe('TestimonialsSection', () => {
  it('renders the testimonial section with quotes', () => {
    render(<TestimonialsSection />)

    expect(screen.getByText(/ils témoignent/i)).toBeInTheDocument()
    expect(screen.getByText(/ce que nos utilisateurs disent déjà/i)).toBeInTheDocument()
    expect(screen.getByText(/la visibilité en temps réel/i)).toBeInTheDocument()
    expect(screen.getByText(/la correction assistée par ia/i)).toBeInTheDocument()
    expect(screen.getByText(/tous mes documents officiels/i)).toBeInTheDocument()
  })
})
