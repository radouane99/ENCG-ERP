import { useState } from 'react';
import api from '@shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';
export function CourseWorkPanel({courseId, assignments, refresh}: {courseId: string; assignments: {id: number; title: string}[]; refresh: () => Promise<void>}) {
  const [busy, setBusy] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  return <details className="rounded-xl border border-border bg-card p-4 text-card-foreground">
    <summary className="cursor-pointer py-2 font-semibold">Supports, devoirs et travaux reçus</summary>
    <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={async event => {
      event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
      if (!data.get('due_date')) data.delete('due_date');
      const file = data.get('file'); if (file instanceof File && !file.size) data.delete('file');
      if (!data.get('external_url')) data.delete('external_url');
      setBusy(true);
      try { await api.post(`/lms/courses/${courseId}/materials`, data); toast.success('Publication enregistrée.'); form.reset(); await refresh(); }
      catch (error: any) { toast.error(error.response?.data?.message || 'Publication impossible.'); }
      finally { setBusy(false); }
    }}>
      <label className="text-sm">Titre<input name="title" required maxLength={255} className="block w-full rounded border border-input bg-background p-2 rounded-[var(--control-radius)]" /></label>
      <label className="text-sm">Type<select name="type" className="block w-full rounded border border-input bg-background p-2 rounded-[var(--control-radius)]"><option value="document">Support</option><option value="assignment">Devoir</option></select></label>
      <label className="text-sm sm:col-span-2">Consignes<textarea name="description" className="block w-full rounded border border-input bg-background p-2 rounded-[var(--control-radius)]" /></label>
      <label className="text-sm">Échéance du devoir<input name="due_date" type="datetime-local" className="block w-full rounded border border-input bg-background p-2 rounded-[var(--control-radius)]" /></label>
      <label className="text-sm">Barème<input name="max_score" type="number" min={1} max={100} defaultValue={20} className="block w-full rounded border border-input bg-background p-2 rounded-[var(--control-radius)]" /></label>
      <label className="text-sm">Pièce jointe<input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="block w-full" /></label>
      <label className="text-sm">Lien HTTPS<input name="external_url" type="url" className="block w-full rounded border border-input bg-background p-2 rounded-[var(--control-radius)]" /></label>
      <button disabled={busy} className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">{busy ? 'Publication…' : 'Publier'}</button>
    </form>
    <div className="mt-5 flex flex-wrap gap-2">{assignments.map(a => <button key={a.id} type="button" className="min-h-11 rounded-lg border border-input px-3" onClick={async () => {
      try { const response = await api.get(`/lms/courses/${courseId}/assignments/${a.id}/submissions`); setSubmissions(response.data.data.data); }
      catch { toast.error('Impossible de charger les travaux reçus.'); }
    }}>Travaux : {a.title}</button>)}</div>
    <ul className="mt-4 space-y-3">{submissions.map(row => <li key={row.id} className="rounded border border-border p-3">
      <p className="text-sm">Étudiant #{row.student_id} · {new Date(row.submitted_at).toLocaleString()}</p>
      <p className="whitespace-pre-wrap break-words py-2">{row.submission_text}</p>
      {row.file_name && <button type="button" className="min-h-11 underline" onClick={() => void openAuthenticatedUrl(`/api/lms/submissions/${row.id}/file`)}>{row.file_name}</button>}
    </li>)}</ul>
  </details>;
}
