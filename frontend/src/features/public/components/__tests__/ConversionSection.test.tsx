import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ConversionSection from '../ConversionSection';

describe('ConversionSection', () => {
  it('renders the main heading and CTAs', () => {
    render(
      <BrowserRouter>
        <ConversionSection lang="fr" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Prêt à transformer l'expérience éducative/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Commencer l'inscription/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Voir le contact/i })).toBeInTheDocument();
  });
});
