import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { GraduationCap } from 'lucide-react';
import { Field, VirtualArabicKeyboardModal } from '../RegistrationFields';
it('associates labels and propagates native select validation and disabled state', () => {
  render(<><Field icon={GraduationCap} label="CNE" name="cne" required />
    <Field icon={GraduationCap} label="Filière" as="select" name="filiere" value="" required disabled><option value="">Choisir</option></Field></>);
  expect(screen.getByLabelText('CNE', {exact: false})).toBeRequired();
  expect(screen.getByRole('combobox', {name: /Filière/})).toBeRequired();
  expect(screen.getByRole('combobox')).toBeDisabled();
});
it('opens an accessible Arabic keyboard dialog that closes with Escape', () => {
  const close = vi.fn();
  render(<VirtualArabicKeyboardModal target={{fieldName:'name',fieldLabel:'Nom'}} formData={{}} setFormData={vi.fn()} onClose={close} />);
  const dialog = screen.getByRole('dialog', {name:'Clavier arabe'});
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  fireEvent.keyDown(dialog, {key:'Escape'});
  expect(close).toHaveBeenCalledOnce();
});
