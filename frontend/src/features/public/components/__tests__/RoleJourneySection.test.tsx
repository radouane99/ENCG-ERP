import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RoleJourneySection from '../RoleJourneySection'

describe('RoleJourneySection', () => {
  it('renders the experience highlights for each user role', () => {
    render(<RoleJourneySection lang="fr" isRTL={false} />)

    expect(screen.getByText(/rôles & acteurs/i)).toBeInTheDocument()
    expect(screen.getByText(/administrateur/i)).toBeInTheDocument()
    expect(screen.getByText(/professeur/i)).toBeInTheDocument()
    expect(screen.getByText(/étudiant/i)).toBeInTheDocument()
  })
})
