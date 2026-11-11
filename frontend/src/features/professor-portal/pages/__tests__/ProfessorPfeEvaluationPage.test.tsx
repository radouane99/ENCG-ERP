import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProfessorPfeEvaluationPage from '../ProfessorPfeEvaluationPage';
import api from '@/shared/lib/api';

vi.mock('@/shared/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@shared/lib/documentAccess', () => ({ openAuthenticatedUrl: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const stage = { id: 12, can_evaluate: true, student: { user: { first_name: 'Audit', last_name: 'Étudiant' }, cne: 'AUDIT', student_number: '123' }, soutenance: { id: 87, status: 'scheduled', date_time: '2026-01-01', president: { user: { name: 'Jury réel' } } } };
function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><ProfessorPfeEvaluationPage /></QueryClientProvider>);
}
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe('PFE persistence', () => {
  it('does not replace empty dossiers with demonstration students', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { internships: [] } });
    open();
    expect(await screen.findByText('Aucun dossier PFE affecté.')).toBeInTheDocument();
    expect(screen.queryByText(/Bennani/)).not.toBeInTheDocument();
  });
  it('shows a loading error without fake candidates', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network'));
    open();
    expect(await screen.findByText('Impossible de charger les dossiers PFE.')).toBeInTheDocument();
  });
  it('persists the actual defense and displays closure only after the server confirms', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { internships: [stage] } }).mockResolvedValue({ data: { internships: [{ ...stage, can_evaluate: false, soutenance: { ...stage.soutenance, status: 'completed', grade: 0 } }] } });
    let resolveSave!: (value: any) => void;
    vi.mocked(api.post).mockImplementation(() => new Promise(resolve => { resolveSave = resolve; }));
    open();
    const save = await screen.findByRole('button', { name: 'Enregistrer et clôturer l’évaluation' });
    fireEvent.click(save);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/professor/internships/soutenances/87/evaluate', expect.objectContaining({ grade: 0, criteria: expect.any(Object) })));
    expect(screen.queryByRole('button', { name: /Évaluation enregistrée & clôturée/ })).not.toBeInTheDocument();
    resolveSave({ data: { success: true } });
    expect(await screen.findByRole('button', { name: /Évaluation enregistrée & clôturée/ })).toBeDisabled();
  });
  it('keeps evaluation editable after a failed save', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { internships: [stage] } });
    vi.mocked(api.post).mockRejectedValue(new Error('Network'));
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'Enregistrer et clôturer l’évaluation' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer et clôturer l’évaluation' })).toBeEnabled());
    expect(screen.queryByRole('button', { name: /Évaluation enregistrée & clôturée/ })).not.toBeInTheDocument();
  });
});
