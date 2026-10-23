from pathlib import Path
p=Path(__file__).resolve().parents[1]/'frontend/src/features/admissions/components/CandidateAdmissionWorkspace.tsx'
t=p.read_text(encoding='utf-8')
t=t.replace("upload(type, e.target.files?.[0]); e.target.value = ''", "const file = e.target.files?.[0]; if (file?.type.startsWith('image/')) setImagePreparation({ type, file }); else upload(type, file); e.target.value = ''")
t=t.replace('className="mt-2 block w-full text-sm file:me-3', 'capture={type === \'photo\' ? \'user\' : undefined} className="mt-2 block w-full text-sm file:me-3')
t=t.replace("{app.appointment.checked_in_at && ' · Entrée enregistrée'}</p>", "{app.appointment.checked_in_at && ' · Entrée enregistrée'}</p>")
needle='<p className="mt-3 text-xs text-slate-500">Présentez les originaux demandés.'
t=t.replace(needle,'''{app.appointment && <div className="mt-4 rounded-lg border bg-white p-4 text-slate-900"><QRCodeSVG value={app.appointment.entry_token} size={120} title="QR du rendez-vous"/><p className="mt-2 break-all text-xs">Jeton personnel : {app.appointment.entry_token}</p><p className="mt-2 text-xs text-slate-500">Présentez ce code au contrôle d’entrée.</p></div>}'''+needle)
p.write_text(t,encoding='utf-8')
