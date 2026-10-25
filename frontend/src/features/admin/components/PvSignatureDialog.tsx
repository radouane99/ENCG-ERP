import { useState } from 'react'
import { Modal } from '@shared/components/ui/Modal'
import { SignaturePad } from './SignaturePad'
export default function PvSignatureDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: (data: string) => Promise<void> }) {
  const [signature, setSignature] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  return <Modal open title="Signer mon visa du PV" onClose={() => !busy && onClose()} preventBackdropClose={busy} preventEscapeClose={busy}>
    <p className="mb-4 text-sm text-muted-foreground">Votre visa est enregistré côté serveur avec votre compte et le contexte du PV. Il ne remplace pas les visas des autres membres.</p>
    <SignaturePad onSave={setSignature}/>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <button disabled={!signature || busy} className="mt-4 min-h-11 rounded-lg bg-secondary px-4 text-white disabled:opacity-50" onClick={() => { setBusy(true); setError(''); void onConfirm(signature).catch(err => setError(err.response?.data?.message || err.message || 'Signature non enregistrée.')).finally(() => setBusy(false)) }}>{busy ? 'Enregistrement…' : 'Enregistrer mon visa'}</button>
  </Modal>
}
