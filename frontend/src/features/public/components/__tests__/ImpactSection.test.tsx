import { render, screen } from '@testing-library/react';
import ImpactSection from '../ImpactSection';
import { describe, expect, it } from 'vitest';

describe('ImpactSection', () => {
  it('renders the section heading, public trust cards, and institution branding', () => {
    render(<ImpactSection lang="fr" />);

    expect(screen.getByText(/Impact public & confiance/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ENCG Fès/i)).toHaveLength(2);
    expect(screen.getByText(/Sécurité étatique/i)).toBeInTheDocument();
    expect(screen.getByText(/Transparence totale/i)).toBeInTheDocument();
  });
});
