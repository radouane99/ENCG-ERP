from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'frontend/src/features/admissions/components/AdmissionAdminWorkbench.tsx';t=p.read_text(encoding='utf-8')
t=t.replace("['appointments', 'Rendez-vous & entrées']", "['appointments', 'Rendez-vous & entrées'], ['settings', 'Campagnes & échéances']")
needle="    {tab === 'dossiers' && <>"
t=t.replace(needle,"    {tab === 'settings' && <AdmissionCampaignSettings campaignId={campaign} onSelect={setCampaign}/>}\n"+needle)
needle='<details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">Versions documentaires conservées</summary>'
t=t.replace(needle,'''<details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">Suivi des notifications</summary>{app.notifications.map(n => <p className="mt-2 flex items-center justify-between gap-2" key={n.id}>{n.type} · {n.status}{n.status === 'failed' && <button className="min-h-11 text-blue-700 underline" disabled={busy} onClick={() => void perform(async () => { const r = await api.post(`${workflowBase}/notifications/${n.id}/retry`); toast.success(r.data.message) })}>Relancer l’envoi</button>}</p>)}</details>'''+needle)
t=t.replace("disabled={busy || !document || app.dossier_status === 'approved'}", "disabled={busy || !document || !['submitted', 'under_review'].includes(app.dossier_status)}")
t=t.replace("disabled={busy || !document || !reason || app.dossier_status === 'approved'}", "disabled={busy || !document || !reason || !['submitted', 'under_review'].includes(app.dossier_status)}")
p.write_text(t,encoding='utf-8')
p=root/'frontend/src/features/admissions/components/CandidateAdmissionWorkspace.tsx';t=p.read_text(encoding='utf-8')
t=t.replace('<h2 className="font-bold">Historique du dossier</h2>', '<h2 className="font-bold">Historique du dossier</h2><p className="mt-2 text-xs text-slate-500">Dernier envoi : {app.notifications[0]?.status === \'sent\' ? \'envoyé\' : app.notifications[0]?.status === \'failed\' ? \'échec, le service peut relancer\' : app.notifications[0] ? \'en attente\' : \'aucun\'}</p>')
p.write_text(t,encoding='utf-8')
