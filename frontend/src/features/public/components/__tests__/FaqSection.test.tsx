import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FaqSection from '../FaqSection'

describe('FaqSection', () => {
  it('reveals the answer when a question is expanded', () => {
    render(<FaqSection />)

    expect(screen.getByText(/faq/i)).toBeInTheDocument()
    expect(screen.queryByText(/les relevés, attestations et documents administratifs/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /comment les documents officiels sont-ils accessibles/i }))

    expect(screen.getByText(/les relevés, attestations et documents administratifs/i)).toBeInTheDocument()
  })
})
